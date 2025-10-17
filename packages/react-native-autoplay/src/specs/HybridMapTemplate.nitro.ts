import type { HybridObject } from 'react-native-nitro-modules';
import type { NitroMapTemplateConfig, VisibleTravelEstimate } from '../templates/MapTemplate';
import type {
  TripConfig,
  TripPoint,
  TripPreviewTextConfiguration,
  TripsConfig,
} from '../types/Trip';
import type { NitroNavigationAlert } from '../utils/NitroAlert';
import type { NitroColor } from '../utils/NitroColor';
import type { NitroManeuver } from '../utils/NitroManeuver';
import type { NitroMapButton } from '../utils/NitroMapButton';
import type { NitroTemplateConfig } from './HybridAutoPlay.nitro';

interface MapTemplateConfig extends NitroTemplateConfig, NitroMapTemplateConfig {}

export interface HybridMapTemplate extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * creates a map template that can render any react component
   * @returns a cleanup function, eg: removes attached listeners
   */
  createMapTemplate(config: MapTemplateConfig): void;
  showNavigationAlert(templateId: string, alert: NitroNavigationAlert): void;
  showTripSelector(
    templateId: string,
    trips: Array<TripsConfig>,
    selectedTripId: string | null,
    textConfig: TripPreviewTextConfiguration,
    onTripSelected: (tripId: string, routeId: string) => void,
    onTripStarted: (tripId: string, routeId: string) => void
  ): void;
  hideTripSelector(templateId: string): void;

  /**
   * update the map buttons on a map template
   */
  setTemplateMapButtons(templateId: string, buttons?: Array<NitroMapButton>): void;

  /**
   * Sets the background color to use for the navigation information.
   */
  updateGuidanceBackgroundColor(templateId: string, color?: NitroColor): void;

  updateVisibleTravelEstimate(
    templateId: string,
    visibleTravelEstimate: VisibleTravelEstimate
  ): void;

  updateTravelEstimates(templateId: string, steps: Array<TripPoint>): void;
  updateManeuvers(templateId: string, maneuvers: Array<NitroManeuver>): void;

  startNavigation(templateId: string, trip: TripConfig): void;
  stopNavigation(templateId: string): void;
}
