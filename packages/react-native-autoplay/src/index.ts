import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import type { AutoPlay as NitroAutoPlay } from './specs/AutoPlay.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask();

export const AutoPlay = NitroModules.createHybridObject<NitroAutoPlay>('AutoPlay');

export * from './components/SafeAreaView';
export * from './hooks/useSafeAreaInsets';
export * from './templates/AlertTemplate';
export * from './templates/MapTemplate';
export * from './templates/Template';
export * from './types/Event';
export * from './types/GestureEvents';
export * from './types/RootComponent';
export * from './types/Text';
