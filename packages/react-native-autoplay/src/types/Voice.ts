import type { VoiceInputImage } from './Image';

/** PCM sample encoding for the `audio` payload of chunks and the final result.
 * `LINEAR16` is raw 16-bit signed PCM
 * `MULAW`/`ALAW` are G.711 8-bit companded encodings, halving payload size */
export type VoiceAudioEncoding = 'LINEAR16' | 'MULAW' | 'ALAW';

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
  /** PCM encoding for onChunk audio and the final result. Defaults to LINEAR16. */
  encoding?: VoiceAudioEncoding;
  /** Sound played just before recording starts. Pass a Metro asset: `require('./beep_start.wav')`. */
  startSound?: number;
  /** Sound played just after recording stops. Pass a Metro asset: `require('./beep_end.wav')`. */
  endSound?: number;
}
