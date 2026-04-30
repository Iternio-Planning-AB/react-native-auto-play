import AVFoundation
import CarPlay
import NitroModules
import Speech

/// Wraps CheckedContinuation so it can only be resumed once even when
/// shared between a stop() call and an async recognition task callback.
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

/// Captures audio from the car microphone and buffers raw 16 kHz / 16-bit / mono PCM,
/// or transcribes it via SFSpeechRecognizer when preferSpeechToText is true.
class VoiceInputManager {
    private var audioEngine: AVAudioEngine?
    private var voiceControlTemplate: CPVoiceControlTemplate?
    private var resultBox: ResultBox?
    private var samples: [Int16] = []
    private var isStopping = false
    private let stopLock = NSLock()

    // STT
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var isSTTMode = false

    // Timing
    private var recordingStart: Date?
    private var silenceStart: Date?

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
        preferSpeechToText: Bool,
        onChunk: ((_ chunk: VoiceInputChunk) -> Void)?
    ) async throws -> VoiceInputResult {
        return try await withCheckedThrowingContinuation { cont in
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
                    listeningText: listeningText,
                    preferSpeechToText: preferSpeechToText,
                    onChunk: onChunk,
                    box: box
                )
            }
            catch {
                self.cleanup(interfaceController: interfaceController)
                box.resume(throwing: error)
            }
        }
    }

    func stop(interfaceController: AutoPlayInterfaceController? = nil) {
        stopLock.lock()
        guard !isStopping else {
            stopLock.unlock()
            return
        }
        isStopping = true
        let wasSTTMode = isSTTMode
        let box = resultBox
        let capturedSamples = samples
        resultBox = nil
        samples = []
        stopLock.unlock()

        if wasSTTMode {
            // endAudio() causes the recognition task to fire its final result,
            // which resumes the box. Engine teardown happens there too.
            recognitionRequest?.endAudio()
        }
        else {
            cleanup(interfaceController: interfaceController)
            box?.resume(returning: makePCMResult(from: capturedSamples))
        }
    }

    // MARK: - Private

    private func startCapture(
        interfaceController: AutoPlayInterfaceController?,
        silenceThresholdMs: Double,
        maxDurationMs: Double,
        listeningText: String,
        preferSpeechToText: Bool,
        onChunk: ((_ chunk: VoiceInputChunk) -> Void)?,
        box: ResultBox
    ) throws {
        guard AVAudioSession.sharedInstance().recordPermission == .granted else {
            throw VoiceInputError.microphonePermissionDenied
        }

        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .measurement, options: [])
        try session.setActive(true)

        if let interfaceController {
            presentVoiceTemplate(interfaceController: interfaceController, listeningText: listeningText)
        }

        var activeRecognitionRequest: SFSpeechAudioBufferRecognitionRequest? = nil

        if preferSpeechToText, SFSpeechRecognizer.authorizationStatus() == .authorized,
            let recognizer = SFSpeechRecognizer(locale: Locale.current),
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
                    let capturedSamples = self.samples
                    self.samples = []
                    self.stopLock.unlock()

                    self.cleanup(interfaceController: interfaceController)
                    box.resume(returning: self.makePCMResult(from: capturedSamples))
                    return
                }

                guard let result else { return }

                if result.isFinal {
                    self.stopLock.lock()
                    self.isStopping = true
                    self.samples = []
                    self.stopLock.unlock()

                    self.cleanup(interfaceController: interfaceController)
                    box.resume(
                        returning: VoiceInputResult(
                            transcription: result.bestTranscription.formattedString,
                            audio: nil
                        )
                    )
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

        inputNode.installTap(
            onBus: 0,
            bufferSize: VoiceInputManager.tapBufferSize,
            format: nativeFormat
        ) { [weak self] buffer, _ in
            guard let self, !self.isStopping else { return }

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
            self.samples.append(contentsOf: newSamples)

            // PCM chunk callback
            if activeRecognitionRequest == nil, let onChunk {
                if let chunkBuffer = try? ArrayBuffer.copy(
                    data: newSamples.withUnsafeBufferPointer { Data(buffer: $0) }
                ) {
                    onChunk(VoiceInputChunk(partial: nil, audio: chunkBuffer))
                }
            }

            let now = Date()

            // Max duration — applies in both modes
            if let start = self.recordingStart,
                now.timeIntervalSince(start) * 1000 >= maxDurationMs
            {
                self.triggerAutoStop(interfaceController: interfaceController)
                return
            }

            // Silence detection — skip during warm-up so the pipeline has time
            // to stabilise before we start measuring amplitude
            if let start = self.recordingStart,
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
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        if let interfaceController {
            dismissVoiceTemplate(interfaceController: interfaceController)
        }
    }

    private func makePCMResult(from samples: [Int16]) -> VoiceInputResult {
        let data = samples.withUnsafeBufferPointer { Data(buffer: $0) }
        let buffer = try? ArrayBuffer.copy(data: data)
        return VoiceInputResult(transcription: nil, audio: buffer)
    }

    private func presentVoiceTemplate(interfaceController: AutoPlayInterfaceController, listeningText: String) {
        let listeningState = CPVoiceControlState(
            identifier: "listening",
            titleVariants: [listeningText],
            image: nil,
            repeats: true
        )
        let template = CPVoiceControlTemplate(voiceControlStates: [listeningState])
        initTemplate(template: template, id: "voice-input")
        voiceControlTemplate = template

        Task { @MainActor in
            try? await interfaceController.presentTemplate(template, animated: true)
            template.activateVoiceControlState(withIdentifier: "listening")
        }
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
