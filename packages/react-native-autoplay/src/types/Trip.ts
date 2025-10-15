import type { Distance } from './Text';

export type RouteChoice = {
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
  travelEstimates: TravelEstimates;
};

export type TripPoint = {
  latitude: number;
  longitude: number;
  name: string;
};

export type TripConfig = {
  id: string;
  origin: TripPoint;
  /**
   * ⚠️ destination.name is used as title on Android Auto,
   * ideally all destinations should have the same name to make sure to not exceed the step count
   * https://developer.android.com/design/ui/cars/guides/ux-requirements/plan-task-flows#steps-refreshes
   */
  destination: TripPoint;
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

export type TravelEstimates = {
  /**
   * Distance remaining, setting it to a negative number will put the timeRemaining in the maneuver
   */
  distanceRemaining: Distance;
  /**
   * Time remaining in seconds
   */
  timeRemaining: number;
};
