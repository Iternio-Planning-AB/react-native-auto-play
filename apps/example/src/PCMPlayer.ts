import { NativeModules } from 'react-native';

const { PCMPlayer } = NativeModules;

/**
 * Play raw PCM audio (16-bit signed LE, mono)
 * For debugging/testing only — not for production use.
 */
export function playPCM(base64: string, sampleRate = 16_000): Promise<void> {
  return PCMPlayer.playPCM(base64, sampleRate);
}
