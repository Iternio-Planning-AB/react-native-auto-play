import type { HybridObject } from 'react-native-nitro-modules';
import type { VoiceInputChunk, VoiceInputResult } from '../types/Voice';
import type { NitroImage } from '../utils/NitroImage';

export interface Voice extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  hasVoiceInputPermission(): boolean;
  requestVoiceInputPermission(): Promise<boolean>;
  startVoiceInput(
    silenceThresholdMs?: number,
    maxDurationMs?: number,
    listeningText?: string,
    listeningImage?: NitroImage,
    listeningImageRepeats?: boolean,
    preferSpeechToText?: boolean,
    onChunk?: (chunk: VoiceInputChunk) => void,
    language?: string,
    startSoundUri?: string,
    endSoundUri?: string
  ): Promise<VoiceInputResult>;
  stopVoiceInput(): void;
}
