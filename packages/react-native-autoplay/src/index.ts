import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import type { HybridAutoPlay as NitroHybridAutoPlay } from './specs/HybridAutoPlay.nitro';
import type { HybridGridTemplate as NitroHybridGridTemplate } from './specs/HybridGridTemplate.nitro';
import type { HybridListTemplate as NitroHybridListTemplate } from './specs/HybridListTemplate.nitro';
import type { HybridMapTemplate as NitroHybridMapTemplate } from './specs/HybridMapTemplate.nitro';
import type { HybridMessageTemplate as NitroHybridMessageTemplate } from './specs/HybridMessageTemplate.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask();

export const HybridAutoPlay =
  NitroModules.createHybridObject<NitroHybridAutoPlay>('HybridAutoPlay');
export const HybridListTemplate =
  NitroModules.createHybridObject<NitroHybridListTemplate>('HybridListTemplate');
export const HybridGridTemplate =
  NitroModules.createHybridObject<NitroHybridGridTemplate>('HybridGridTemplate');
export const HybridMapTemplate =
  NitroModules.createHybridObject<NitroHybridMapTemplate>('HybridMapTemplate');
export const HybridMessageTemplate =
  NitroModules.createHybridObject<NitroHybridMessageTemplate>('HybridMessageTemplate');

export * from './components/SafeAreaView';
export * from './hooks/useAndroidAutoTelemetry';
export * from './hooks/useMapTemplate';
export * from './hooks/useSafeAreaInsets';
export * from './templates/GridTemplate';
export * from './templates/ListTemplate';
export * from './templates/MapTemplate';
export * from './templates/MessageTemplate';
export * from './templates/Template';
export * from './types/Button';
export * from './types/Event';
export * from './types/GestureEvents';
export * from './types/Image';
export * from './types/RootComponent';
export * from './types/Telemetry';
export * from './types/Text';
export * from './types/Trip';
export type {
  NavigationAlert as Alert,
  NavigationAlertAction as AlertAction,
} from './utils/NitroAlert';
export type { GridButton } from './utils/NitroGrid';
