import { NitroModules } from 'react-native-nitro-modules';
import type { AutoPlayTiming } from '../specs/AutoPlayTiming.nitro';

export const HybridAutoPlayTiming =
  NitroModules.createHybridObject<AutoPlayTiming>('AutoPlayTiming');
