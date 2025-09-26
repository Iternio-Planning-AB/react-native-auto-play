import { NitroModules } from 'react-native-nitro-modules';
import type { AutoPlay as NitroAutoPlay } from './specs/AutoPlay.nitro';

export const AutoPlay = NitroModules.createHybridObject<NitroAutoPlay>('AutoPlay');
