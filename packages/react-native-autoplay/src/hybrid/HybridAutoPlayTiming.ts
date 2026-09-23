import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { AutoPlayTiming } from '../specs/AutoPlayTiming.nitro';

export const HybridAutoPlayTiming =
  Platform.OS === 'ios' ? NitroModules.createHybridObject<AutoPlayTiming>('AutoPlayTiming') : null;
