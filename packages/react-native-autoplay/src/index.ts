import { NitroModules } from 'react-native-nitro-modules';
import AutoPlayHeadlessJsTask from './AutoPlayHeadlessJsTask';
import type { HybridAutoPlay as NitroHybridAutoPlay } from './specs/HybridAutoPlay.nitro';

AutoPlayHeadlessJsTask.registerHeadlessTask();

export const HybridAutoPlay =
  NitroModules.createHybridObject<NitroHybridAutoPlay>('HybridAutoPlay');

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
export * from './hooks/useMapTemplate';
export * from './hooks/useSafeAreaInsets';
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
export * from './types/GestureEvents';
export * from './types/Image';
export * from './types/Maneuver';
export * from './types/RootComponent';
export * from './types/Telemetry';
export * from './types/Text';
export * from './types/Trip';
export type {
  NavigationAlert as Alert,
  NavigationAlertAction as AlertAction,
} from './utils/NitroAlert';
export type { GridButton } from './utils/NitroGrid';
