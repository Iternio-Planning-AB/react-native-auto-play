import AVFoundation
import NitroModules
import Speech

class HybridVoice: HybridVoiceSpec {
    private var voiceInputManager: VoiceInputManager?

    func hasVoiceInputPermission() throws -> Bool {
        let micGranted = AVAudioSession.sharedInstance().recordPermission == .granted
        let speechGranted = SFSpeechRecognizer.authorizationStatus() == .authorized
        return micGranted && speechGranted
    }

    func requestVoiceInputPermission() throws -> Promise<Bool> {
        return Promise.async {
            let micGranted = await withCheckedContinuation { cont in
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    cont.resume(returning: granted)
                }
            }
            guard micGranted else { return false }

            return await withCheckedContinuation { cont in
                SFSpeechRecognizer.requestAuthorization { status in
                    cont.resume(returning: status == .authorized)
                }
            }
        }
    }

    func startVoiceInput(
        silenceThresholdMs: Double?,
        maxDurationMs: Double?,
        listeningText: String?,
        listeningImage: Variant_GlyphImage_AssetImage_RemoteImage?,
        listeningImageRepeats: Bool?,
        preferSpeechToText: Bool?,
        onChunk: ((_ chunk: VoiceInputChunk) -> Void)?,
        language: String?,
        startSoundUri: String?,
        endSoundUri: String?
    ) throws -> Promise<VoiceInputResult> {
        return Promise.async {
            let interfaceController = try? await RootModule.withInterfaceController { $0 }

            let manager = VoiceInputManager()
            self.voiceInputManager = manager

            defer { self.voiceInputManager = nil }

            return try await manager.start(
                interfaceController: interfaceController,
                silenceThresholdMs: silenceThresholdMs ?? 1_500,
                maxDurationMs: maxDurationMs ?? 10_000,
                listeningText: listeningText ?? "Listening...",
                listeningImage: listeningImage,
                listeningImageRepeats: listeningImageRepeats,
                preferSpeechToText: preferSpeechToText ?? false,
                onChunk: onChunk,
                language: language,
                startSoundUri: startSoundUri,
                endSoundUri: endSoundUri
            )
        }
    }

    func stopVoiceInput() throws {
        Task { @MainActor in
            let interfaceController = try? await RootModule.withInterfaceController { $0 }
            self.voiceInputManager?.stop(interfaceController: interfaceController)
        }
    }
}
