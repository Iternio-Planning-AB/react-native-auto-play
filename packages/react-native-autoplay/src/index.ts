import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import { HybridAndroidAutoTelemetry } from './hybrid/HybridAndroidAutoTelemetry';
import { HybridAutoPlay } from './hybrid/HybridAutoPlay';
import { HybridVoice } from './hybrid/HybridVoice';
import type { AndroidAutomotive } from './specs/AndroidAutomotive.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask(HybridAutoPlay);

export { HybridAutoPlay };
export { HybridVoice };
export { HybridAndroidAutoTelemetry };

export const HybridAndroidAutomotive =
  Platform.OS === 'android'
    ? NitroModules.createHybridObject<AndroidAutomotive>('AndroidAutomotive')
    : null;

/**
 * These are the static module names for the app running on the mobile device, head unit screen and the CarPlay dashboard.
 * Clusters generate uuids on native side that are passed in the RootComponentInitialProps
 */
export enum AutoPlayModules {
  App = 'main',
  AutoPlayRoot = 'AutoPlayRoot',
  CarPlayDashboard = 'CarPlayDashboard',
}

export * from './components/SafeAreaView';
export * from './hooks/useAndroidAutoTelemetry';
export * from './hooks/useFocusedEffect';
export * from './hooks/useMapTemplate';
export * from './hooks/useSafeAreaInsets';
export * from './hooks/useVoiceInput';
export * from './scenes/AutoPlayCluster';
export * from './scenes/CarPlayDashboardScene';
export type {
  ActiveCarUxRestrictions,
  AppFocusState,
} from './specs/AndroidAutomotive.nitro';
export { CarUxRestrictions } from './specs/AndroidAutomotive.nitro';
export * from './templates/GridTemplate';
export * from './templates/InformationTemplate';
export * from './templates/ListTemplate';
export * from './templates/MapTemplate';
export * from './templates/MessageTemplate';
export * from './templates/SearchTemplate';
export * from './templates/SignInTemplate';
export * from './templates/Template';
export * from './types/Button';
export * from './types/Event';
export * from './types/Image';
export * from './types/Maneuver';
export * from './types/RootComponent';
export * from './types/SignInMethod';
export * from './types/Telemetry';
export * from './types/Text';
export * from './types/Trip';
export type { VoiceInputChunk, VoiceInputOptions, VoiceInputResult } from './types/Voice';
export type {
  AlertPriority,
  NavigationAlert as Alert,
  NavigationAlertAction as AlertAction,
} from './utils/NitroAlert';
export type { ThemedColor } from './utils/NitroColor';
export type { GridButton } from './utils/NitroGrid';
export { setIconFont } from './utils/NitroImage';
