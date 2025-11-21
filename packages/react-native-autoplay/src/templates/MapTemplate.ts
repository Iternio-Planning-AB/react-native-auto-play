import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { type AutoText, HybridAutoPlay } from '..';
import { MapTemplateProvider } from '../components/MapTemplateContext';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type { MapTemplate as NitroMapTemplate } from '../specs/MapTemplate.nitro';
import type { ActionButtonAndroid, MapButton, MapPanButton } from '../types/Button';
import type { AutoManeuver } from '../types/Maneuver';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import type {
  TripConfig,
  TripPoint,
  TripPreviewTextConfiguration,
  TripsConfig,
} from '../types/Trip';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { type NavigationAlert, NitroAlertUtil } from '../utils/NitroAlert';
import { NitroManeuverUtil, type NitroRoutingManeuver } from '../utils/NitroManeuver';
import { NitroMapButton } from '../utils/NitroMapButton';
import {
  type HeaderActionsIos,
  type NitroBaseMapTemplateConfig,
  type NitroTemplateConfig,
  Template,
  type TemplateConfig,
} from './Template';

const HybridMapTemplate = NitroModules.createHybridObject<NitroMapTemplate>('MapTemplate');

export type Point = { x: number; y: number };
export type VisibleTravelEstimate = 'first' | 'last';

export type HeaderActionsAndroidMap<T> = Array<ActionButtonAndroid<T>> & { length: 1 | 2 | 3 | 4 };

export interface NitroMapTemplateConfig extends TemplateConfig, NitroBaseMapTemplateConfig {
  /**
   * show either the next or final step travel estimates, defaults to final step so last
   */
  visibleTravelEstimate?: VisibleTravelEstimate;

  /**
   * callback for single finger pan gesture
   * @param translation distance in pixels along the x & y axis that has been scrolled since the last touch position during the scroll event
   * @param velocity the velocity of the pan gesture, iOS only
   */
  onDidPan?: (translation: Point, velocity?: Point) => void;

  /**
   * callback for pinch to zoom gesture
   * @param center x & y coordinate of the focal point in pixels
   * @param scale the scaling factor
   */
  onDidUpdateZoomGestureWithCenter?: (center: Point, scale: number) => void;

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

  onStopNavigation(): void;
  onAutoDriveEnabled?: () => void;

  mapButtons?: Array<NitroMapButton>;
  headerActions?: Array<NitroAction>;

  /**
   * specify the percentage of screen height/width the pan button should scroll
   * @namespace iOS
   */
  panButtonScrollPercentage?:
    | 0
    | 0.05
    | 0.1
    | 0.15
    | 0.2
    | 0.25
    | 0.3
    | 0.35
    | 0.4
    | 0.45
    | 0.5
    | 0.55
    | 0.6
    | 0.65
    | 0.7
    | 0.75
    | 0.8
    | 0.85
    | 0.9
    | 0.95
    | 1;
}

export type MapButtons<T> = Array<MapButton<T> | MapPanButton> & { length: 1 | 2 | 3 | 4 };

export type MapHeaderActions<T> = {
  android?: HeaderActionsAndroidMap<T>;
  ios?: HeaderActionsIos<T>;
};

export type BaseMapTemplateConfig<T> = {
  /**
   * buttons that represent actions on the map template, usually on the bottom right corner
   * @namespace Android - adding a pan button will always make the pan button the first one
   * @namespace iOS - the pan button can be on any position
   */
  mapButtons?: MapButtons<T>;

  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  headerActions?: MapHeaderActions<T>;
};

export type MapTemplateConfig = Omit<
  NitroMapTemplateConfig,
  'mapButtons' | 'headerActions' | 'onStopNavigation' | 'onAutoDriveEnabled'
> &
  BaseMapTemplateConfig<MapTemplate> & {
    /**
     * react component that is rendered
     */
    component: React.ComponentType<RootComponentInitialProps>;

    /**
     * Notification that navigation was stopped. May occur when another source such as the car head unit starts navigating.
     * The navigation session on Android Auto/CarPlay is stopped already when this callback is triggered, make sure to stop other things like TTS too.
     */
    onStopNavigation(template: MapTemplate): void;

    /**
     * Notifies the app that, from this point onwards, when the user chooses to navigate to a destination, the app should start simulating a drive towards that destination.
     * @namespace Android
     */
    onAutoDriveEnabled?: (template: MapTemplate) => void;
  };

export interface TripSelectorCallback {
  setSelectedTrip: (id: string) => void;
}

export class MapTemplate extends Template<MapTemplateConfig, MapTemplateConfig['headerActions']> {
  id = 'AutoPlayRoot';
  private template = this;

  constructor(config: MapTemplateConfig) {
    super(config);

    const {
      component,
      mapButtons,
      headerActions,
      onStopNavigation,
      onAutoDriveEnabled,
      ...baseConfig
    } = config;

    AppRegistry.registerComponent(
      this.id,
      () => (props) =>
        React.createElement(MapTemplateProvider, {
          mapTemplate: this.template,
          // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
          children: React.createElement(SafeAreaInsetsProvider, {
            moduleName: this.id,
            // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
            children: React.createElement(component, props),
          }),
        })
    );

    const nitroConfig: NitroMapTemplateConfig & NitroTemplateConfig = {
      ...baseConfig,
      id: this.id,
      headerActions: NitroActionUtil.convert(this.template, headerActions),
      mapButtons: NitroMapButton.convert(this.template, mapButtons),
      onStopNavigation: () => onStopNavigation(this.template),
      onAutoDriveEnabled: onAutoDriveEnabled ? () => onAutoDriveEnabled(this.template) : undefined,
    };

    HybridMapTemplate.createMapTemplate(nitroConfig);
  }

  public setMapButtons(mapButtons: MapTemplateConfig['mapButtons']) {
    const buttons = NitroMapButton.convert(this.template, mapButtons);
    return HybridMapTemplate.setTemplateMapButtons(this.id, buttons);
  }

  public override setHeaderActions(headerActions: MapTemplateConfig['headerActions']) {
    const nitroActions = NitroActionUtil.convert(this.template, headerActions);
    return HybridAutoPlay.setTemplateHeaderActions(this.id, nitroActions);
  }

  /**
   * brings up a navigation alert
   * ⚠️ updating an existing alert is currently broken on Android Automotive, it brings up a new alert for each call
   * @returns a callback to dismiss or update the navigation alert
   */
  public showAlert(alert: NavigationAlert) {
    return HybridMapTemplate.showNavigationAlert(this.id, NitroAlertUtil.convert(alert));
  }

  public updateAlert(alertId: number, title: AutoText, subtitle?: AutoText) {
    HybridMapTemplate.updateNavigationAlert(this.id, alertId, title, subtitle);
  }

  public dismissAlert(alertId: number) {
    HybridMapTemplate.dismissNavigationAlert(this.id, alertId);
  }

  /**
   * @namespace Android brings up a custom trip selector mimicking the CarPlay trip selector as close as possible
   * @namespace iOS brings up the stock CarPlay trip selector
   * @returns a callback to update the shown trip
   */
  public showTripSelector({
    trips,
    selectedTripId,
    textConfig,
    onTripSelected,
    onTripStarted,
    onBackPressed,
    mapButtons,
  }: {
    trips: Array<TripsConfig>;
    selectedTripId?: string;
    textConfig: TripPreviewTextConfiguration;
    onTripSelected: (tripId: string, routeId: string) => void;
    onTripStarted: (tripId: string, routeId: string) => void;
    onBackPressed: () => void;
    /**
     * @namespace iOS - always shown no matter if navigation is started or not
     * @namespace Android - these buttons will only be shown when navigation is not started, otherwise AA will not show them
     */
    mapButtons?: MapTemplateConfig['mapButtons'];
  }): TripSelectorCallback {
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
        'found non distinct destination names, while this is possible it might lead to exceeding the step count, check https://developer.android.com/design/ui/cars/guides/ux-requirements/plan-task-flows#steps-refreshes for details'
      );
    }

    const buttons = NitroMapButton.convert(this.template, mapButtons);

    return HybridMapTemplate.showTripSelector(
      this.id,
      trips,
      selectedTripId,
      textConfig,
      onTripSelected,
      onTripStarted,
      onBackPressed,
      buttons ?? []
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
  public updateManeuvers(maneuvers: AutoManeuver) {
    if (Array.isArray(maneuvers)) {
      const nitroManeuvers = maneuvers.reduce((acc, maneuver) => {
        if (maneuver == null) {
          return acc;
        }

        acc.push(NitroManeuverUtil.convert(maneuver));
        return acc;
      }, [] as NitroRoutingManeuver[]);

      HybridMapTemplate.updateManeuvers(this.id, nitroManeuvers);
      return;
    }

    const messageManeuver = NitroManeuverUtil.convert(maneuvers);
    HybridMapTemplate.updateManeuvers(this.id, messageManeuver);
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
