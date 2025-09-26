import type { HybridObject } from 'react-native-nitro-modules';

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  add(a: number, b: number): number;
}
