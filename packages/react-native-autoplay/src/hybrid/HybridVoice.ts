import { NitroModules } from 'react-native-nitro-modules';
import type { Voice } from '../specs/Voice.nitro';
import type { VoiceInputOptions, VoiceInputResult } from '../types/Voice';

const _native = NitroModules.createHybridObject<Voice>('Voice');

type StartVoiceInput = {
  (options: VoiceInputOptions & Required<Pick<VoiceInputOptions, 'onChunk'>>): Promise<void>;
  (options?: Omit<VoiceInputOptions, 'onChunk'>): Promise<VoiceInputResult>;
};

const startVoiceInput: StartVoiceInput = (async (options?: VoiceInputOptions) => {
  const { onChunk, silenceThresholdMs, maxDurationMs, listeningText, preferSpeechToText } =
    options ?? {};
  const result = await _native.startVoiceInput(
    silenceThresholdMs,
    maxDurationMs,
    listeningText,
    preferSpeechToText,
    onChunk
  );
  return onChunk !== undefined ? undefined : result;
}) as unknown as StartVoiceInput;

export const HybridVoice = {
  hasVoiceInputPermission: () => _native.hasVoiceInputPermission(),
  requestVoiceInputPermission: () => _native.requestVoiceInputPermission(),
  startVoiceInput,
  stopVoiceInput: () => _native.stopVoiceInput(),
};
