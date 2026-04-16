import AVFoundation
import CarPlay

/// Captures audio from the car microphone and buffers raw 16 kHz / 16-bit / mono PCM.
/// Recording stops automatically when silence is detected or the max duration is reached.
class VoiceInputManager {
    private var audioEngine: AVAudioEngine?
    private var voiceControlTemplate: CPVoiceControlTemplate?
    private var continuation: CheckedContinuation<[Int16], Error>?
    private var samples: [Int16] = []
    private var isStopping = false

    // Timing
    private var recordingStart: Date?
    private var silenceStart: Date?
    private weak var storedInterfaceController: AutoPlayInterfaceController?

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
        interfaceController: AutoPlayInterfaceController,
        silenceThresholdMs: Double,
        maxDurationMs: Double,
        listeningText: String
    ) async throws -> Data {
        storedInterfaceController = interfaceController

        let samples = try await withCheckedThrowingContinuation {
            (cont: CheckedContinuation<[Int16], Error>) in
            self.continuation = cont
            self.samples = []
            self.isStopping = false

            do {
                try self.startCapture(
                    interfaceController: interfaceController,
                    silenceThresholdMs: silenceThresholdMs,
                    maxDurationMs: maxDurationMs,
                    listeningText: listeningText
                )
            } catch {
                cont.resume(throwing: error)
                self.continuation = nil
            }
        }

        return samplesAsData(samples)
    }

    func stop(interfaceController: AutoPlayInterfaceController) {
        guard !isStopping else { return }
        isStopping = true

        stopCapture(interfaceController: interfaceController)
        continuation?.resume(returning: samples)
        continuation = nil
        samples = []
    }

    // MARK: - Private

    private func startCapture(
        interfaceController: AutoPlayInterfaceController,
        silenceThresholdMs: Double,
        maxDurationMs: Double,
        listeningText: String
    ) throws {
        guard AVAudioSession.sharedInstance().recordPermission == .granted else {
            throw VoiceInputError.microphonePermissionDenied
        }

        // Activate the session first so inputNode reports the correct hardware format
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .measurement, options: [.mixWithOthers])
        try session.setActive(true)

        presentVoiceTemplate(interfaceController: interfaceController, listeningText: listeningText)

        let engine = AVAudioEngine()
        let inputNode = engine.inputNode
        let nativeFormat = inputNode.outputFormat(forBus: 0)

        let targetFormat = VoiceInputManager.targetFormat
        guard let converter = AVAudioConverter(from: nativeFormat, to: targetFormat) else {
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

            let outputFrameCapacity = AVAudioFrameCount(
                Double(buffer.frameLength)
                    * VoiceInputManager.sampleRate
                    / nativeFormat.sampleRate
            )

            guard
                let outputBuffer = AVAudioPCMBuffer(
                    pcmFormat: targetFormat,
                    frameCapacity: outputFrameCapacity
                )
            else { return }

            var conversionError: NSError?
            let status = converter.convert(to: outputBuffer, error: &conversionError) {
                _, outStatus in
                outStatus.pointee = .haveData
                return buffer
            }

            guard status != .error, let int16Data = outputBuffer.int16ChannelData else { return }

            let frameCount = Int(outputBuffer.frameLength)
            let newSamples = Array(UnsafeBufferPointer(start: int16Data[0], count: frameCount))
            self.samples.append(contentsOf: newSamples)

            let now = Date()

            // Max duration check
            if let start = self.recordingStart,
                now.timeIntervalSince(start) * 1000 >= maxDurationMs
            {
                self.triggerAutoStop()
                return
            }

            // Silence detection — skip during warm-up so the pipeline has time
            // to stabilise before we start measuring amplitude
            if let start = self.recordingStart,
                now.timeIntervalSince(start) * 1000 >= VoiceInputManager.warmupMs
            {
                let peak = newSamples.reduce(0) { max($0, abs(Int($1))) }
                if peak < VoiceInputManager.silenceAmplitudeThreshold {
                    if self.silenceStart == nil { self.silenceStart = now }
                    if let silenceBegin = self.silenceStart,
                        now.timeIntervalSince(silenceBegin) * 1000 >= silenceThresholdMs
                    {
                        self.triggerAutoStop()
                    }
                } else {
                    self.silenceStart = nil
                }
            }
        }

        try engine.start()
        audioEngine = engine
    }

    private func triggerAutoStop() {
        guard let interfaceController = storedInterfaceController else { return }
        DispatchQueue.global(qos: .userInitiated).async {
            self.stop(interfaceController: interfaceController)
        }
    }

    private func stopCapture(interfaceController: AutoPlayInterfaceController) {
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        recordingStart = nil
        silenceStart = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        dismissVoiceTemplate(interfaceController: interfaceController)
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

    private func samplesAsData(_ samples: [Int16]) -> Data {
        samples.withUnsafeBufferPointer { ptr in
            Data(buffer: ptr)
        }
    }
}

enum VoiceInputError: Error {
    case microphonePermissionDenied
    case converterUnavailable
    case noActiveSession
}
