import type { HybridObject } from 'react-native-nitro-modules';
import type {
  NitroMapTemplateConfig,
  TripSelectorCallback,
  VisibleTravelEstimate,
} from '../templates/MapTemplate';
import type { AutoText } from '../types/Text';
import type {
  TripConfig,
  TripPoint,
  TripPreviewTextConfiguration,
  TripsConfig,
} from '../types/Trip';
import type { NitroNavigationAlert } from '../utils/NitroAlert';
import type { NitroManeuver } from '../utils/NitroManeuver';
import type { NitroMapButton } from '../utils/NitroMapButton';
import type { NitroTemplateConfig } from './AutoPlay.nitro';

interface MapTemplateConfig extends NitroTemplateConfig, NitroMapTemplateConfig {}

export interface MapTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  createMapTemplate(config: MapTemplateConfig): void;
  showNavigationAlert(templateId: string, alert: NitroNavigationAlert): void;
  updateNavigationAlert(
    templateId: string,
    navigationAlertId: number,
    title: AutoText,
    subtitle?: AutoText
  ): void;
  dismissNavigationAlert(templateId: string, navigationAlertId: number): void;
  showTripSelector(
    templateId: string,
    trips: Array<TripsConfig>,
    selectedTripId: string | undefined,
    textConfig: TripPreviewTextConfiguration,
    onTripSelected: (tripId: string, routeId: string) => void,
    onTripStarted: (tripId: string, routeId: string) => void,
    onBackPressed: () => void,
    mapButtons: Array<NitroMapButton>
  ): TripSelectorCallback;
  hideTripSelector(templateId: string): void;
  setTemplateMapButtons(templateId: string, buttons?: Array<NitroMapButton>): Promise<void>;
  updateVisibleTravelEstimate(
    templateId: string,
    visibleTravelEstimate: VisibleTravelEstimate
  ): void;
  updateTravelEstimates(templateId: string, steps: Array<TripPoint>): void;
  updateManeuvers(templateId: string, maneuvers: NitroManeuver): void;
  startNavigation(templateId: string, trip: TripConfig): void;
  stopNavigation(templateId: string): void;
}
