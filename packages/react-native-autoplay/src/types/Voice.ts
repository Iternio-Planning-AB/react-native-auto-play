import type { VoiceInputImage } from './Image';

export interface VoiceInputChunk {
  partial?: string;
  audio?: ArrayBuffer;
}

export interface VoiceInputResult {
  transcription?: string;
  audio?: ArrayBuffer;
}

export interface VoiceInputOptions {
  silenceThresholdMs?: number;
  maxDurationMs?: number;
  listeningText?: string;
  /** Image displayed in the CarPlay voice control overlay. See {@link VoiceInputImage}.
   * @namespace ios
   */
  listeningImage?: VoiceInputImage;
  preferSpeechToText?: boolean;
  onChunk?: (chunk: VoiceInputChunk) => void;
  language?: string;
  /** Sound played just before recording starts. Pass a Metro asset: `require('./beep_start.wav')`. */
  startSound?: number;
  /** Sound played just after recording stops. Pass a Metro asset: `require('./beep_end.wav')`. */
  endSound?: number;
}
