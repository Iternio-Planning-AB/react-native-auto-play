import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import type { AutoPlay as NitroAutoPlay } from './specs/AutoPlay.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask();

export const AutoPlay = NitroModules.createHybridObject<NitroAutoPlay>('AutoPlay');

export * from './components/SafeAreaView';
export * from './hooks/useSafeAreaInsets';
export * from './templates/AlertTemplate';
export * from './templates/GridTemplate';
export * from './templates/ListTemplate';
export * from './templates/MapTemplate';
export * from './templates/Template';
export * from './types/Button';
export * from './types/Event';
export * from './types/GestureEvents';
export * from './types/Image';
export * from './types/RootComponent';
export * from './types/Text';
export type { GridButton } from './utils/NitroGrid';
