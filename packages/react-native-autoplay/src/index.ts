import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import type { AutoPlay as NitroAutoPlay } from './specs/AutoPlay.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask();

export const AutoPlay = NitroModules.createHybridObject<NitroAutoPlay>('AutoPlay');
