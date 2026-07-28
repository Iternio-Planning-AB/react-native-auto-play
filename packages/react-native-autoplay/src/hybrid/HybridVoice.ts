import { Image } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { Voice } from '../specs/Voice.nitro';
import type { VoiceInputOptions, VoiceInputResult } from '../types/Voice';
import { NitroImageUtil } from '../utils/NitroImage';

const _native = NitroModules.createHybridObject<Voice>('Voice');

type StartVoiceInput = {
  (
    options: VoiceInputOptions & Required<Pick<VoiceInputOptions, 'onChunk'>>
  ): Promise<VoiceInputResult>;
  (options?: Omit<VoiceInputOptions, 'onChunk'>): Promise<VoiceInputResult>;
};

const startVoiceInput: StartVoiceInput = async (options?: VoiceInputOptions) => {
  const {
    onChunk,
    silenceThresholdMs,
    maxDurationMs,
    listeningText,
    listeningImage,
    preferSpeechToText,
    language,
    startSound,
    endSound,
    encoding,
  } = options ?? {};

  const listeningImageRepeats =
    listeningImage?.type === 'asset' ? listeningImage.repeats : undefined;

  const startSoundUri = startSound != null ? Image.resolveAssetSource(startSound).uri : undefined;
  const endSoundUri = endSound != null ? Image.resolveAssetSource(endSound).uri : undefined;

  return await _native.startVoiceInput(
    silenceThresholdMs,
    maxDurationMs,
    listeningText,
    NitroImageUtil.convert(listeningImage),
    listeningImageRepeats,
    preferSpeechToText,
    onChunk,
    language,
    startSoundUri,
    endSoundUri,
    encoding
  );
};

export const HybridVoice = {
  /**
   * Returns true if all permissions required for voice input are granted.
   * On iOS: checks both microphone and speech recognition authorization.
   * On Android: checks RECORD_AUDIO permission.
   */
  hasVoiceInputPermission: () => _native.hasVoiceInputPermission(),
  /**
   * Request all permissions required for voice input.
   * On iOS: requests microphone permission then speech recognition authorization.
   * On Android: requests RECORD_AUDIO via car context when connected, otherwise
   * via the React Native application context.
   * Returns true only if all required permissions were granted.
   */
  requestVoiceInputPermission: () => _native.requestVoiceInputPermission(),
  /**
   * Start an in-app voice session.
   *
   * When preferSpeechToText is true:
   *   iOS — streams audio buffers into SFSpeechRecognizer during recording;
   *          onChunk fires with partial transcription results; resolves with
   *          { transcription } or falls back to { audio } if unavailable.
   *   Android — checks SpeechRecognizer availability upfront; if available it
   *              owns the mic and streams partial results via onChunk; if not
   *              available falls back to PCM recording.
   *
   * When preferSpeechToText is false (default):
   *   Both platforms record raw PCM; onChunk fires with audio chunks;
   *   resolves with { audio }.
   *
   * @param silenceThresholdMs  ms of silence before auto-stop (default 1500)
   * @param maxDurationMs       hard cap on recording duration (default 10000)
   * @param listeningText       iOS only — text shown on CPVoiceControlTemplate
   * @param preferSpeechToText  request STT transcription instead of raw PCM
   * @param onChunk             optional streaming callback
   * @param language            specify the language for the SpeechRecognizer, falls back to system language if not set
   * @param encoding            PCM encoding for onChunk audio and the final result (default LINEAR16)
   */
  startVoiceInput,
  /**
   * Stop the active voice session early.
   * For PCM mode: resolves startVoiceInput with audio captured so far.
   * For STT mode: finalises the recognition request.
   * No-op if no session is active.
   */
  stopVoiceInput: () => _native.stopVoiceInput(),
};
