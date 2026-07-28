import AVFoundation
import CarPlay
import NitroModules
import Speech

/// Retains the player and itself until playback finishes — AVAudioPlayer.delegate is weak.
private final class AudioPlayerDelegate: NSObject, AVAudioPlayerDelegate, @unchecked Sendable {
    private let onFinish: () -> Void
    private var keepAlive: AudioPlayerDelegate?
    private var player: AVAudioPlayer?

    init(player: AVAudioPlayer, _ onFinish: @escaping () -> Void) {
        self.onFinish = onFinish
        self.player = player
        super.init()
        keepAlive = self
    }

    private func finish() {
        player = nil
        keepAlive = nil
        onFinish()
    }

    func audioPlayerDidFinishPlaying(_: AVAudioPlayer, successfully _: Bool) { finish() }
    func audioPlayerDecodeErrorDidOccur(_: AVAudioPlayer, error _: Error?) { finish() }
}

/// CheckedContinuation wrapper that can only be resumed once, safe across concurrent stop() and recognition callbacks.
private final class ResultBox: @unchecked Sendable {
    private var continuation: CheckedContinuation<VoiceInputResult, Error>?
    private let lock = NSLock()

    init(_ continuation: CheckedContinuation<VoiceInputResult, Error>) {
        self.continuation = continuation
    }

    func resume(returning result: VoiceInputResult) {
        lock.lock()
        defer { lock.unlock() }
        continuation?.resume(returning: result)
        continuation = nil
    }

    func resume(throwing error: Error) {
        lock.lock()
        defer { lock.unlock() }
        continuation?.resume(throwing: error)
        continuation = nil
    }
}

/// Records 16 kHz / 16-bit mono PCM from the car mic, or transcribes via SFSpeechRecognizer.
class VoiceInputManager {
    private var audioEngine: AVAudioEngine?
    private var voiceControlTemplate: CPVoiceControlTemplate?
    private var resultBox: ResultBox?
    private var samples: [Int16] = []
    private var isStopping = false
    private var cancelledByUser = false
    private let stopLock = NSLock()

    // STT
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var isSTTMode = false

    // Timing
    private var recordingStart: Date?
    private var silenceStart: Date?
    private var firstBufferContinuation: CheckedContinuation<Void, Never>?

    // PCM result/onChunk audio encoding — STT transcription itself is unaffected
    private var encoding: VoiceAudioEncoding = .linear16

    private static let sampleRate: Double = 16_000
    private static let tapBufferSize: AVAudioFrameCount = 4_096
    private static let silenceAmplitudeThreshold = 500
    private static let warmupMs: Double = 500

    private static let targetFormat = AVAudioFormat(
        commonFormat: .pcmFormatInt16,
        sampleRate: sampleRate,
        channels: 1,
        interleaved: true
    )!

    // MARK: - Public

    func start(
        interfaceController: AutoPlayInterfaceController?,
        silenceThresholdMs: Double,
        maxDurationMs: Double,
        listeningText: String,
        listeningImage: Variant_GlyphImage_AssetImage_RemoteImage?,
        listeningImageRepeats: Bool?,
        preferSpeechToText: Bool,
        onChunk: ((_ chunk: VoiceInputChunk) -> Void)?,
        language: String?,
        startSoundUri: String?,
        endSoundUri: String?,
        encoding: VoiceAudioEncoding
    ) async throws -> VoiceInputResult {
        self.encoding = encoding
        stopLock.withLock {
            cancelledByUser = false
        }
        // Single session for the full flow (start sound + recording + end sound); defer deactivates once at the end.
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .measurement, options: [])
        try session.setActive(true)
        defer {
            try? session.setActive(false, options: .notifyOthersOnDeactivation)
        }

        let result = try await withCheckedThrowingContinuation { cont in
            let box = ResultBox(cont)
            self.resultBox = box
            self.samples = []
            self.isStopping = false
            self.isSTTMode = preferSpeechToText

            do {
                try self.startCapture(
                    interfaceController: interfaceController,
                    silenceThresholdMs: silenceThresholdMs,
                    maxDurationMs: maxDurationMs,
                    preferSpeechToText: preferSpeechToText,
                    onChunk: onChunk,
                    box: box,
                    language: language
                )
            }
            catch {
                self.cleanup(interfaceController: interfaceController)
                box.resume(throwing: error)
                return
            }

            // Start sound fires immediately; template is deferred until the first tap buffer so the mic indicator is already on.
            if let uri = startSoundUri {
                Task { await self.playSound(uri: uri) }
            }
            if let interfaceController = interfaceController {
                Task {
                    await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
                        self.stopLock.withLock { self.firstBufferContinuation = cont }
                    }
                    // Skip if stop() fired before the first buffer — cleanup already dismissed.
                    guard !self.stopLock.withLock({ self.isStopping }) else { return }
                    await self.presentVoiceTemplate(
                        interfaceController: interfaceController,
                        listeningText: listeningText,
                        listeningImage: listeningImage,
                        listeningImageRepeats: listeningImageRepeats
                    )
                }
            }
        }

        if let uri = endSoundUri {
            await playSound(uri: uri)
        }

        return result
    }

    private func playSound(uri: String) async {
        guard let url = URL(string: uri) else { return }
        do {
            // URLSession handles both http:// (Metro dev server) and file:// (release bundle)
            let (data, _) = try await URLSession.shared.data(from: url)
            await withCheckedContinuation { (cont: CheckedContinuation<Void, Never>) in
                DispatchQueue.main.async {
                    do {
                        let player = try AVAudioPlayer(data: data)
                        let delegate = AudioPlayerDelegate(player: player) { cont.resume() }
                        player.delegate = delegate
                        player.prepareToPlay()
                        player.play()
                    }
                    catch {
                        cont.resume()
                    }
                }
            }
        }
        catch {
            print(error)
            // fail silently — a broken sound file must not block voice input
        }
    }

    func stop(interfaceController: AutoPlayInterfaceController? = nil) {
        stopLock.lock()
        guard !isStopping else {
            stopLock.unlock()
            return
        }
        isStopping = true
        let wasCancelled = cancelledByUser
        let wasSTTMode = isSTTMode
        let capturedRequest = recognitionRequest
        let box = resultBox
        let capturedSamples = samples
        resultBox = nil
        samples = []
        stopLock.unlock()

        if wasSTTMode {
            // endAudio() triggers the final recognition result, which resumes the box and tears down the engine.
            capturedRequest?.endAudio()
        }
        else {
            cleanup(interfaceController: interfaceController)
            if wasCancelled {
                box?.resume(throwing: AutoPlayError.voiceInputCancelled)
            }
            else {
                box?.resume(returning: makePCMResult(from: capturedSamples))
            }
        }
    }

    // MARK: - Private

    private func startCapture(
        interfaceController: AutoPlayInterfaceController?,
        silenceThresholdMs: Double,
        maxDurationMs: Double,
        preferSpeechToText: Bool,
        onChunk: ((_ chunk: VoiceInputChunk) -> Void)?,
        box: ResultBox,
        language: String?
    ) throws {
        guard AVAudioSession.sharedInstance().recordPermission == .granted else {
            throw VoiceInputError.microphonePermissionDenied
        }

        var activeRecognitionRequest: SFSpeechAudioBufferRecognitionRequest? = nil

        if preferSpeechToText, SFSpeechRecognizer.authorizationStatus() == .authorized,
            let recognizer = language != nil
                ? SFSpeechRecognizer(locale: Locale(identifier: language!))
                : SFSpeechRecognizer(locale: Locale.current),
            recognizer.isAvailable
        {
            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            recognitionRequest = request
            activeRecognitionRequest = request

            recognizer.recognitionTask(with: request) { [weak self] result, error in
                guard let self else { return }

                if error != nil {
                    // STT failed — fall back to whatever PCM was accumulated
                    self.stopLock.lock()
                    self.isStopping = true
                    let wasCancelled = self.cancelledByUser
                    let capturedSamples = self.samples
                    self.samples = []
                    self.stopLock.unlock()

                    self.cleanup(interfaceController: interfaceController)
                    if wasCancelled {
                        box.resume(throwing: AutoPlayError.voiceInputCancelled)
                    }
                    else {
                        box.resume(returning: self.makePCMResult(from: capturedSamples))
                    }
                    return
                }

                guard let result else { return }

                if result.isFinal {
                    self.stopLock.lock()
                    self.isStopping = true
                    let wasCancelled = self.cancelledByUser
                    self.samples = []
                    self.stopLock.unlock()

                    self.cleanup(interfaceController: interfaceController)
                    if wasCancelled {
                        box.resume(throwing: AutoPlayError.voiceInputCancelled)
                    }
                    else {
                        box.resume(
                            returning: VoiceInputResult(
                                transcription: result.bestTranscription.formattedString,
                                audio: nil
                            )
                        )
                    }
                }
                else {
                    onChunk?(VoiceInputChunk(partial: result.bestTranscription.formattedString, audio: nil))
                }
            }
        }

        let engine = AVAudioEngine()
        let inputNode = engine.inputNode
        let nativeFormat = inputNode.outputFormat(forBus: 0)

        guard let converter = AVAudioConverter(from: nativeFormat, to: VoiceInputManager.targetFormat) else {
            throw VoiceInputError.converterUnavailable
        }

        recordingStart = Date()
        silenceStart = nil
        firstBufferContinuation = nil

        inputNode.installTap(
            onBus: 0,
            bufferSize: VoiceInputManager.tapBufferSize,
            format: nativeFormat
        ) { [weak self] buffer, _ in
            guard let self else { return }

            self.stopLock.lock()
            let stopping = self.isStopping
            let recordingStartSnapshot = self.recordingStart
            let firstBufferCont = self.firstBufferContinuation
            self.firstBufferContinuation = nil
            self.stopLock.unlock()

            firstBufferCont?.resume()

            guard !stopping else { return }

            // Feed STT if active
            activeRecognitionRequest?.append(buffer)

            // Convert to 16kHz int16 for accumulation and PCM chunks
            let outputFrameCapacity = AVAudioFrameCount(
                Double(buffer.frameLength) * VoiceInputManager.sampleRate / nativeFormat.sampleRate
            )
            guard
                let outputBuffer = AVAudioPCMBuffer(
                    pcmFormat: VoiceInputManager.targetFormat,
                    frameCapacity: outputFrameCapacity
                )
            else { return }

            var conversionError: NSError?
            let status = converter.convert(to: outputBuffer, error: &conversionError) { _, outStatus in
                outStatus.pointee = .haveData
                return buffer
            }
            guard status != .error, let int16Data = outputBuffer.int16ChannelData else { return }

            let frameCount = Int(outputBuffer.frameLength)
            let newSamples = Array(UnsafeBufferPointer(start: int16Data[0], count: frameCount))
            self.stopLock.lock()
            if !self.isStopping {
                self.samples.append(contentsOf: newSamples)
            }
            self.stopLock.unlock()

            // PCM chunk callback
            if activeRecognitionRequest == nil, let onChunk {
                let pcmData = newSamples.withUnsafeBufferPointer { Data(buffer: $0) }
                if let chunkBuffer = try? ArrayBuffer.copy(data: self.encodeAudio(pcmData)) {
                    onChunk(VoiceInputChunk(partial: nil, audio: chunkBuffer))
                }
            }

            let now = Date()

            // Max duration — applies in both modes
            if let start = recordingStartSnapshot,
                now.timeIntervalSince(start) * 1000 >= maxDurationMs
            {
                self.triggerAutoStop(interfaceController: interfaceController)
                return
            }

            // Silence detection — skip during warm-up to let the pipeline stabilise.
            if let start = recordingStartSnapshot,
                now.timeIntervalSince(start) * 1000 >= VoiceInputManager.warmupMs
            {
                let peak = newSamples.reduce(0) { max($0, abs(Int($1))) }
                if peak < VoiceInputManager.silenceAmplitudeThreshold {
                    if self.silenceStart == nil {
                        self.silenceStart = now
                    }
                    if let silenceBegin = self.silenceStart,
                        now.timeIntervalSince(silenceBegin) * 1000 >= silenceThresholdMs
                    {
                        self.triggerAutoStop(interfaceController: interfaceController)
                    }
                }
                else {
                    self.silenceStart = nil
                }
            }
        }

        try engine.start()
        audioEngine = engine
    }

    private func triggerAutoStop(interfaceController: AutoPlayInterfaceController?) {
        DispatchQueue.global(qos: .userInitiated).async {
            self.stop(interfaceController: interfaceController)
        }
    }

    private func cleanup(interfaceController: AutoPlayInterfaceController?) {
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        recognitionRequest = nil
        recordingStart = nil
        silenceStart = nil
        // Drain firstBufferContinuation so the template Task doesn't hang if stop() fired before the first buffer.
        let pendingCont = stopLock.withLock { () -> CheckedContinuation<Void, Never>? in
            let c = firstBufferContinuation
            firstBufferContinuation = nil
            return c
        }
        pendingCont?.resume()
        if let interfaceController {
            dismissVoiceTemplate(interfaceController: interfaceController)
        }
    }

    private func makePCMResult(from samples: [Int16]) -> VoiceInputResult {
        let data = samples.withUnsafeBufferPointer { Data(buffer: $0) }
        let buffer = try? ArrayBuffer.copy(data: encodeAudio(data))
        return VoiceInputResult(transcription: nil, audio: buffer)
    }

    private func encodeAudio(_ pcm16le: Data) -> Data {
        switch encoding {
        case .linear16: return pcm16le
        case .mulaw: return G711.encodeUlaw(pcm16le)
        case .alaw: return G711.encodeAlaw(pcm16le)
        }
    }

    // CPVoiceControlState enforces a maximum image size of 150x150 points.
    private static let voiceImageMaxSize = CGSize(width: 150, height: 150)

    // CPVoiceControlState enforces a 0.3s–5s animation cycle; the 0.3s floor is system-applied, clamp only the ceiling.
    private static let maxVoiceImageCycleDuration: TimeInterval = 5.0

    // Uses Parser.decodeImage instead of RCTConvert to preserve animation frames for GIF/APNG/WebP.
    private func loadVoiceImage(image: Variant_GlyphImage_AssetImage_RemoteImage?, traitCollection: UITraitCollection)
        -> UIImage?
    {
        guard let image else { return nil }

        if let assetImage = image.assetImage {
            guard let url = URL(string: assetImage.uri),
                let data = try? Data(contentsOf: url),
                let uiImage = Parser.decodeImage(
                    data: data,
                    scale: CGFloat(assetImage.scale),
                    maxDuration: VoiceInputManager.maxVoiceImageCycleDuration
                )
            else { return nil }

            if uiImage.images != nil {
                return Parser.resizeAnimated(uiImage, max: VoiceInputManager.voiceImageMaxSize)
            }

            if assetImage.color == nil {
                return Parser.resize(uiImage, max: VoiceInputManager.voiceImageMaxSize)
            }

            guard let tinted = Parser.parseAssetImage(assetImage: assetImage, traitCollection: traitCollection) else {
                return nil
            }
            return Parser.resize(tinted, max: VoiceInputManager.voiceImageMaxSize)
        }

        if let glyphImage = image.glyphImage {
            return
                SymbolFont
                .imageFromGlyph(
                    glyphImage: glyphImage,
                    size: 150,  // according to docs on CPVoiceControlState.image
                    foregroundColor: glyphImage.color,
                    backgroundColor: glyphImage.backgroundColor,
                    fontScale: glyphImage.fontScale ?? 1.0,
                    traitCollection: traitCollection
                )
        }

        return nil
    }

    @MainActor
    private func presentVoiceTemplate(
        interfaceController: AutoPlayInterfaceController,
        listeningText: String,
        listeningImage: Variant_GlyphImage_AssetImage_RemoteImage?,
        listeningImageRepeats: Bool?
    ) async {
        let traitCollection = SceneStore.getRootTraitCollection() ?? UITraitCollection.current
        let image = loadVoiceImage(
            image: listeningImage,
            traitCollection: traitCollection
        )

        let repeats = listeningImageRepeats ?? (image?.images != nil)
        let listeningState = CPVoiceControlState(
            identifier: "listening",
            titleVariants: [listeningText],
            image: image,
            repeats: repeats
        )

        let voiceTemplate = VoiceInputTemplate(
            voiceControlStates: [listeningState],
            id: "voice-input"
        ) { [weak self] in
            guard let self else { return }
            self.stopLock.withLock {
                if !self.isStopping { self.cancelledByUser = true }
            }
            self.stop()
        }

        voiceControlTemplate = voiceTemplate.template
        try? await interfaceController.presentTemplate(voiceTemplate.template, animated: true)
        voiceTemplate.template.activateVoiceControlState(withIdentifier: "listening")
    }

    private func dismissVoiceTemplate(interfaceController: AutoPlayInterfaceController) {
        Task { @MainActor in
            try? await interfaceController.dismissTemplate(animated: true)
        }
        voiceControlTemplate = nil
    }
}

enum VoiceInputError: Error {
    case microphonePermissionDenied
    case converterUnavailable
    case noActiveSession
}
