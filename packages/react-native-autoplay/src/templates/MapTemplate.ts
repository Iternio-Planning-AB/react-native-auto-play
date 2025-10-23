import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { HybridAutoPlay, HybridMapTemplate } from '..';
import { MapTemplateProvider } from '../components/MapTemplateContext';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type { ActionButtonAndroid, MapButton, MapPanButton } from '../types/Button';
import type { AutoManeuvers } from '../types/Maneuver';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import type {
  TripConfig,
  TripPoint,
  TripPreviewTextConfiguration,
  TripsConfig,
} from '../types/Trip';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NavigationAlert, NitroAlertUtil } from '../utils/NitroAlert';
import { type NitroManeuver, NitroManeuverUtil } from '../utils/NitroManeuver';
import { NitroMapButton } from '../utils/NitroMapButton';
import {
  type HeaderActionsIos,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

export type AutoPlayCluster = string & { __brand: 'uuid' };
export type MapTemplateId = 'AutoPlayRoot' | 'AutoPlayDashboard' | AutoPlayCluster;

type Point = { x: number; y: number };
export type VisibleTravelEstimate = 'first' | 'last';

export type HeaderActionsAndroidMap<T> =
  | [ActionButtonAndroid<T>, ActionButtonAndroid<T>, ActionButtonAndroid<T>, ActionButtonAndroid<T>]
  | [ActionButtonAndroid<T>, ActionButtonAndroid<T>, ActionButtonAndroid<T>]
  | [ActionButtonAndroid<T>, ActionButtonAndroid<T>]
  | [ActionButtonAndroid<T>];

export interface NitroMapTemplateConfig extends TemplateConfig {
  mapButtons?: Array<NitroMapButton>;

  headerActions?: Array<NitroAction>;

  /**
   * show either the next or final step travel estimates, defaults to final step so last
   */
  visibleTravelEstimate?: VisibleTravelEstimate;

  /**
   * callback for single finger pan gesture
   * @param translation distance in pixels along the x & y axis that has been scrolled since the last touch position during the scroll event
   * @param velocity the velocity of the pan gesture, iOS only
   */
  onDidUpdatePanGestureWithTranslation?: (translation: Point, velocity?: Point) => void;

  /**
   * callback for pinch to zoom gesture
   * @param center x & y coordinate of the focal point in pixels
   * @param scale the scaling factor
   * @param velocity the velocity of the zoom gesture in scale factor per second, iOS only
   */
  onDidUpdateZoomGestureWithCenter?: (center: Point, scale: number, velocity?: number) => void;

  /**
   * single press event callback
   * @param center coordinates of the click event in pixel
   * @namespace Android
   */
  onClick?: (center: Point) => void;

  /**
   * double tap event callback
   * @param center coordinates of the click event in pixel
   * @namespace Android
   */
  onDoubleClick?: (center: Point) => void;

  /**
   * callback for color scheme changes
   */
  onAppearanceDidChange?: (colorScheme: ColorScheme) => void;
}

export type MapButtons<T> = Array<MapButton<T> | MapPanButton<T>>;

export type MapTemplateConfig = Omit<
  NitroMapTemplateConfig,
  'id' | 'mapButtons' | 'headerActions'
> & {
  /**
   * since we need to find the proper Android screen/iOS scene only certain ids can be used on this template
   */
  id: MapTemplateId;
  /**
   * react component that is rendered
   */
  component: React.ComponentType<RootComponentInitialProps & { template: MapTemplate }>;

  /**
   * buttons that represent actions on the map template, usually on the bottom right corner
   */
  mapButtons?: MapButtons<MapTemplate>;

  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: {
    android?: HeaderActionsAndroidMap<MapTemplate>;
    ios?: HeaderActionsIos<MapTemplate>;
  };
};

const convertActions = (
  template: MapTemplate,
  headerActions: MapTemplateConfig['headerActions']
) => {
  return Platform.OS === 'android'
    ? NitroActionUtil.convertAndroidMap(template, headerActions?.android)
    : NitroActionUtil.convertIos(template, headerActions?.ios);
};

export class MapTemplate extends Template<MapTemplateConfig, MapTemplateConfig['headerActions']> {
  private template = this;

  constructor(config: MapTemplateConfig) {
    super(config);

    const { component, mapButtons, headerActions, ...baseConfig } = config;

    AppRegistry.registerComponent(
      this.id,
      () => (props) =>
        React.createElement(MapTemplateProvider, {
          mapTemplate: this.template,
          // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
          children: React.createElement(SafeAreaInsetsProvider, {
            moduleName: config.id,
            // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
            children: React.createElement(component, props),
          }),
        })
    );

    const nitroConfig: NitroMapTemplateConfig & NitroTemplateConfig = {
      ...baseConfig,
      id: this.id,
      headerActions: convertActions(this.template, headerActions),
      mapButtons: NitroMapButton.convert(this.template, mapButtons),
    };

    HybridMapTemplate.createMapTemplate(nitroConfig);
  }

  public setMapButtons(mapButtons: MapTemplateConfig['mapButtons']) {
    const buttons = NitroMapButton.convert(this.template, mapButtons);
    HybridMapTemplate.setTemplateMapButtons(this.id, buttons);
  }

  public override setHeaderActions(headerActions: MapTemplateConfig['headerActions']) {
    const nitroActions = convertActions(this.template, headerActions);
    HybridAutoPlay.setTemplateHeaderActions(this.id, nitroActions);
  }

  /**
   * brings up a navigation alert
   * calling this with the same alert.id will update an already shown alert
   * ⚠️ updating an existing alert is currently broken on Android Automotive, it brings up a new alert for each call
   */
  public showAlert(alert: NavigationAlert) {
    HybridMapTemplate.showNavigationAlert(this.id, NitroAlertUtil.convert(alert));
  }

  public showTripSelector(
    trips: Array<TripsConfig>,
    selectedTripId: string | null,
    textConfig: TripPreviewTextConfiguration,
    onTripSelected: (tripId: string, routeId: string) => void,
    onTripStarted: (tripId: string, routeId: string) => void
  ) {
    if (
      trips.length === 0 ||
      trips.some(
        (t) => t.routeChoices.length === 0 || t.routeChoices.some((r) => r.steps.length < 2)
      )
    ) {
      throw new Error(
        'Invalid trips passed, either no trips or some trips routeChoice or steps are empty'
      );
    }

    if (
      __DEV__ &&
      Platform.OS === 'android' &&
      new Set(trips.flatMap((t) => t.routeChoices.flatMap((r) => r.steps.at(-1)?.name))).size > 1
    ) {
      console.warn(
        'found none distinct destination names, while this is possible it might lead to exceeding the step count, check https://developer.android.com/design/ui/cars/guides/ux-requirements/plan-task-flows#steps-refreshes for details'
      );
    }

    HybridMapTemplate.showTripSelector(
      this.id,
      trips,
      selectedTripId,
      textConfig,
      onTripSelected,
      onTripStarted
    );
  }

  public hideTripSelector() {
    HybridMapTemplate.hideTripSelector(this.id);
  }

  public updateVisibleTravelEstimate(visibleTravelEstimate: VisibleTravelEstimate) {
    HybridMapTemplate.updateVisibleTravelEstimate(this.id, visibleTravelEstimate);
  }

  /**
   * updates travel estimates
   * @param steps all future steps, do not put in origin or passed steps
   */
  public updateTravelEstimates(steps: Array<TripPoint>) {
    HybridMapTemplate.updateTravelEstimates(this.id, steps);
  }

  /**
   * sets or updates maneuvers, make sure to call startNavigation first!
   * @namespace Android sets all the supplied maneuvers whenever called
   * @namespace iOS will update travelEstimates only when passing in maneuvers with the same id
   */
  public updateManeuvers(maneuvers: AutoManeuvers) {
    const nitroManeuvers = maneuvers.reduce((acc, maneuver) => {
      if (maneuver == null) {
        return acc;
      }

      acc.push(NitroManeuverUtil.convert(maneuver));
      return acc;
    }, [] as NitroManeuver[]);

    HybridMapTemplate.updateManeuvers(this.id, nitroManeuvers);
  }

  /**
   * either use showTripSelector to show a set of trips and let the user start the navigation session
   * or use this to start a navigation session without asking the user
   */
  public startNavigation(trip: TripConfig) {
    HybridMapTemplate.startNavigation(this.id, trip);
  }

  public stopNavigation() {
    HybridMapTemplate.stopNavigation(this.id);
  }
}
