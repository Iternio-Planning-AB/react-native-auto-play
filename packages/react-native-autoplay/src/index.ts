import { Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import type { AndroidAutoTelemetry as NitroAndroidAutoTelemetry } from './specs/AndroidAutoTelemetry.nitro';
import type { AutoPlay as NitroAutoPlay } from './specs/AutoPlay.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask();

export const HybridAutoPlay = NitroModules.createHybridObject<NitroAutoPlay>('AutoPlay');

export const HybridAndroidAutoTelemetry =
  Platform.OS === 'android'
    ? NitroModules.createHybridObject<NitroAndroidAutoTelemetry>('AndroidAutoTelemetry')
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
export * from './templates/GridTemplate';
export * from './templates/InformationTemplate';
export * from './templates/ListTemplate';
export * from './templates/MapTemplate';
export * from './templates/MessageTemplate';
export * from './templates/SearchTemplate';
export * from './templates/Template';
export * from './types/Button';
export * from './types/Event';
export * from './types/Image';
export * from './types/Maneuver';
export * from './types/RootComponent';
export * from './types/Telemetry';
export * from './types/Text';
export * from './types/Trip';
export type {
  AlertPriority,
  NavigationAlert as Alert,
  NavigationAlertAction as AlertAction,
} from './utils/NitroAlert';
export type { ThemedColor } from './utils/NitroColor';
export type { GridButton } from './utils/NitroGrid';
