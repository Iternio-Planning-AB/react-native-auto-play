import type { HybridObject } from 'react-native-nitro-modules';
import type { VoiceInputChunk, VoiceInputResult } from '../types/Voice';

export interface Voice extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * Returns true if all permissions required for voice input are granted.
   * On iOS: checks both microphone and speech recognition authorization.
   * On Android: checks RECORD_AUDIO permission.
   */
  hasVoiceInputPermission(): boolean;

  /**
   * Request all permissions required for voice input.
   * On iOS: requests microphone permission then speech recognition authorization.
   * On Android: requests RECORD_AUDIO via car context when connected, otherwise
   * via the React Native application context.
   * Returns true only if all required permissions were granted.
   */
  requestVoiceInputPermission(): Promise<boolean>;

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
   * @param onChunk             optional streaming callback; when set the
   *                            promise resolves with an empty VoiceInputResult
   */
  startVoiceInput(
    silenceThresholdMs?: number,
    maxDurationMs?: number,
    listeningText?: string,
    preferSpeechToText?: boolean,
    onChunk?: (chunk: VoiceInputChunk) => void
  ): Promise<VoiceInputResult>;

  /**
   * Stop the active voice session early.
   * For PCM mode: resolves startVoiceInput with audio captured so far.
   * For STT mode: finalises the recognition request.
   * No-op if no session is active.
   */
  stopVoiceInput(): void;
}
