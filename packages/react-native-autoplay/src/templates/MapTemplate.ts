import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { AutoPlay } from '..';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type { ActionButtonAndroid, MapButton, MapPanButton } from '../types/Button';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import { NitroAction } from '../utils/NitroAction';
import { NitroMapButton } from '../utils/NitroMapButton';
import { type ActionsIos, Template, type TemplateConfig } from './Template';

export type AutoPlayCluster = string & { __brand: 'uuid' };
export type MapTemplateId = 'AutoPlayRoot' | 'AutoPlayDashboard' | AutoPlayCluster;

type Point = { x: number; y: number };

export type ActionsAndroidMap =
  | [ActionButtonAndroid, ActionButtonAndroid, ActionButtonAndroid, ActionButtonAndroid]
  | [ActionButtonAndroid, ActionButtonAndroid, ActionButtonAndroid]
  | [ActionButtonAndroid, ActionButtonAndroid]
  | [ActionButtonAndroid];

export interface NitroMapTemplateConfig extends TemplateConfig {
  mapButtons?: Array<NitroMapButton>;

  actions?: Array<NitroAction>;

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

export type MapButtons = Array<MapButton | MapPanButton>;

export type MapTemplateConfig = Omit<
  NitroMapTemplateConfig,
  'templateHostId' | 'mapButtons' | 'actions'
> & {
  /**
   * react component that is rendered
   */
  component: React.ComponentType<RootComponentInitialProps & { template: MapTemplate }>;

  /**
   * buttons that represent actions on the map template, usually on the bottom right corner
   */
  mapButtons?: MapButtons;

  /**
   * action buttons, usually at the the top right on Android and a top bar on iOS
   */
  actions?: {
    android?: ActionsAndroidMap;
    ios?: ActionsIos;
  };
};

export class MapTemplate extends Template<MapTemplateConfig> {
  public get type(): string {
    return 'map';
  }

  private cleanup: () => void;

  constructor(config: MapTemplateConfig) {
    super(config);

    // biome-ignore lint/complexity/noUselessThisAlias: we need the template reference when the component gets started from react-native
    const template = this;
    const { component, mapButtons, actions, ...baseConfig } = config;

    AppRegistry.registerComponent(
      this.templateId,
      () => (props) =>
        React.createElement(SafeAreaInsetsProvider, {
          moduleName: config.id,
          // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
          children: React.createElement(component, { ...props, template }),
        })
    );

    const nitroActions =
      Platform.OS === 'android'
        ? NitroAction.convertAndroidMap(actions?.android)
        : NitroAction.convertIos(actions?.ios);

    const mapConfig: NitroMapTemplateConfig = {
      ...baseConfig,
      actions: nitroActions,
      mapButtons: NitroMapButton.convert(mapButtons),
    };

    this.cleanup = AutoPlay.createMapTemplate(mapConfig);
  }

  public setRootTemplate() {
    AutoPlay.setRootTemplate(this.templateId);
  }

  public setMapButtons(mapButtons: Array<MapButton | MapPanButton>) {
    const buttons = NitroMapButton.convert(mapButtons);
    AutoPlay.setMapButtons(this.templateId, buttons);
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
