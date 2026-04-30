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
  preferSpeechToText?: boolean;
  onChunk?: (chunk: VoiceInputChunk) => void;
}
