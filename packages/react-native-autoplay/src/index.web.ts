// Web/Jest stub for the native CarPlay/Android Auto surface. Nothing here talks to a real native
// module — every function call resolves to `undefined` (or an already-resolved promise, which is
// indistinguishable from `undefined` to an `await`er) rather than throwing. Types are preserved by
// casting against the real exports, so callers still get full type-checking/autocomplete.
//
// Anything below that's already safe as-is (pure types, plain enums, or modules that neither
// create native objects nor import anything that does) is re-exported directly instead of stubbed.

import { createElement } from 'react';
import { View, type ViewProps } from 'react-native';
import type { AndroidAutomotive } from './specs/AndroidAutomotive.nitro';
import type { AutoPlay } from './specs/AutoPlay.nitro';
import type { Voice } from './specs/Voice.nitro';
import type { GridTemplate as RealGridTemplate } from './templates/GridTemplate';
import type { InformationTemplate as RealInformationTemplate } from './templates/InformationTemplate';
import type { ListTemplate as RealListTemplate } from './templates/ListTemplate';
import type { MapTemplate as RealMapTemplate } from './templates/MapTemplate';
import type { MessageTemplate as RealMessageTemplate } from './templates/MessageTemplate';
import type { SearchTemplate as RealSearchTemplate } from './templates/SearchTemplate';
import type { SignInTemplate as RealSignInTemplate } from './templates/SignInTemplate';
import type { Template as RealTemplate } from './templates/Template';
import type { SafeAreaInsets } from './types/Event';
import type { Telemetry } from './types/Telemetry';

function noop() {
  return undefined;
}

/** Any property access returns a no-op function, so any method call is safe regardless of name. */
function createNoopObject<T>(): T {
  return new Proxy(
    {},
    {
      get: (_target, prop) => (prop === 'then' || prop === 'toJSON' ? undefined : noop),
    }
  ) as T;
}

function createNoopClass<T>(): new (...args: never[]) => T {
  function NoopInstance() {
    return createNoopObject<T>();
  }
  return NoopInstance as unknown as new (
    ...args: never[]
  ) => T;
}

export * from './Constants';
export * from './hooks/useMapTemplate';
export type {
  ActiveCarUxRestrictions,
  AppFocusState,
} from './specs/AndroidAutomotive.nitro';
export { CarUxRestrictions } from './specs/AndroidAutomotive.nitro';
export type { GridImageSize, GridTemplateConfig } from './templates/GridTemplate';
export type { InformationItems, InformationTemplateConfig } from './templates/InformationTemplate';
export type {
  DefaultRow,
  ListImageType,
  ListTemplateConfig,
  MultiSection,
  RadioRow,
  Section,
  SingleSection,
  TextRow,
  ToggleRow,
  WaypointCoordinate,
  WaypointRow,
} from './templates/ListTemplate';
export type {
  BaseMapTemplateConfig,
  ChargerLocation,
  ChargerOutlet,
  ChargingConnector,
  HeaderActionsAndroidMap,
  MapButtons,
  MapHeaderActions,
  MapTemplateConfig,
  OptionsPanelChargerSection,
  OptionsPanelConfig,
  OptionsPanelGridSection,
  OptionsPanelListSection,
  OptionsPanelSection,
  PanelActionsIos,
  PanelHeaderActions,
  Point,
  TripSelectorCallback,
  VisibleTravelEstimate,
} from './templates/MapTemplate';
export type { MessageTemplateConfig } from './templates/MessageTemplate';
export type { SearchSection, SearchTemplateConfig } from './templates/SearchTemplate';
export type { SignInTemplateConfig } from './templates/SignInTemplate';
export type {
  ActionButton,
  HeaderActions,
  HeaderActionsAndroid,
  HeaderActionsIos,
  NitroBaseMapTemplateConfig,
  NitroTemplateConfig,
  TemplateConfig,
} from './templates/Template';
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
export * from './utils/ErrorUtil';
export type {
  AlertPriority,
  NavigationAlert as Alert,
  NavigationAlertAction as AlertAction,
} from './utils/NitroAlert';
export type { ThemedColor } from './utils/NitroColor';
export type { GridButton } from './utils/NitroGrid';

export enum AutoPlayModules {
  App = 'main',
  AutoPlayRoot = 'AutoPlayRoot',
  CarPlayDashboard = 'CarPlayDashboard',
}

const NO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };
export const useSafeAreaInsets = () => NO_INSETS;
export const SafeAreaView = (props: ViewProps) => createElement(View, props);

export function setIconFont(_name: string, _glyphMap?: Record<string, number>): void {}

export const useFocusedEffect = () => {};

export const useVoiceInput = () => ({
  voiceInputResult: undefined,
  resetVoiceInputResult: () => {},
});

export const useAndroidAutoTelemetry = (): {
  permissionsGranted: boolean | null;
  telemetry: Telemetry | undefined;
  error: string | undefined;
} => ({
  permissionsGranted: null,
  telemetry: undefined,
  error: undefined,
});

export const AutoPlayCluster = createNoopObject<Record<string, unknown>>();
export const CarPlayDashboard = createNoopObject<Record<string, unknown>>();

export const HybridAndroidAutomotive: AndroidAutomotive | null = null;
export { HybridAndroidAutoTelemetry } from './hybrid/HybridAndroidAutoTelemetry';
export { HybridAndroidWindowInformation } from './hybrid/HybridAndroidWindowInformation';
export const HybridAutoPlay = createNoopObject<AutoPlay>();
export const HybridVoice = createNoopObject<Voice>();

export const Template = createNoopClass<InstanceType<typeof RealTemplate>>();
export const ListTemplate = createNoopClass<RealListTemplate>();
export const GridTemplate = createNoopClass<RealGridTemplate>();
export const InformationTemplate = createNoopClass<RealInformationTemplate>();
export const MessageTemplate = createNoopClass<RealMessageTemplate>();
export const MapTemplate = createNoopClass<RealMapTemplate>();
export const SearchTemplate = createNoopClass<RealSearchTemplate>();
export const SignInTemplate = createNoopClass<RealSignInTemplate>();
