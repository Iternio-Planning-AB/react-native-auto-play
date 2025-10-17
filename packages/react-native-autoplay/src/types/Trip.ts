import type { AutoText, Distance } from './Text';

type RouteChoice = {
  id: string;
  /**
   * Title on the alternatives, only visible when providing more then one routeChoices
   */
  summaryVariants: Array<string>;
  /**
   * Content shown on the overview, only property visible when providing a single routeChoice
   */
  additionalInformationVariants: Array<string>;
  /**
   * Subtitle on the alternatives, only visible when providing more then one routeChoices
   * travelEstimates are automatically appended to this one
   */
  selectionSummaryVariants: Array<string>;
  /**
   * ⚠️ name of the last step is used as title on Android Auto,
   * ideally all these should have the same name to make sure to not exceed the step count
   * https://developer.android.com/design/ui/cars/guides/ux-requirements/plan-task-flows#steps-refreshes
   */
  steps: Array<TripPoint>;
};

export type TripPoint = {
  latitude: number;
  longitude: number;
  name: string;
  /**
   * includes the duration until arriving at this step, distance to this step and arrival time with timezone
   */
  travelEstimates: TravelEstimates;
};

/**
 * used for showTripSelector
 */
export type TripsConfig = {
  id: string;
  routeChoices: Array<RouteChoice>;
};

export type TripPreviewTextConfiguration = {
  startButtonTitle: string;
  additionalRoutesButtonTitle: string;
  overviewButtonTitle: string;
  /**
   * specifies the title for the travel estimates row on the trip preview
   * @namespace Android
   */
  travelEstimatesTitle: string;
};

export type DurationWithTimeZone = {
  timezone: string;
  seconds: number;
};

export type TravelEstimates = {
  distanceRemaining: Distance;
  timeRemaining: DurationWithTimeZone;
  /**
   * @namespace Android
   */
  tripText?: AutoText;
  // /**
  //  * @namespace Android
  //  */
  // tripIcon?: number;
};

/**
 * used for startNavigation
 */
export type TripConfig = {
  id: string;
  routeChoice: RouteChoice;
};
