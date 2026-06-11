import type { HybridObject } from 'react-native-nitro-modules';
import type { VoiceInputChunk, VoiceInputResult } from '../types/Voice';

export interface Voice extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  hasVoiceInputPermission(): boolean;
  requestVoiceInputPermission(): Promise<boolean>;
  startVoiceInput(
    silenceThresholdMs?: number,
    maxDurationMs?: number,
    listeningText?: string,
    preferSpeechToText?: boolean,
    onChunk?: (chunk: VoiceInputChunk) => void,
    language?: string
  ): Promise<VoiceInputResult>;
  stopVoiceInput(): void;
}
