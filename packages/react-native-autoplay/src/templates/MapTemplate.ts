import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { AutoPlay } from '..';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type { ActionButtonAndroid, MapButton, MapPanButton } from '../types/Button';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import { type NitroAction, NitroActionUtil } from '../utils/NitroAction';
import { NitroMapButton } from '../utils/NitroMapButton';
import { type ActionsIos, Template, type TemplateConfig } from './Template';

export type AutoPlayCluster = string & { __brand: 'uuid' };
export type MapTemplateId = 'AutoPlayRoot' | 'AutoPlayDashboard' | AutoPlayCluster;

type Point = { x: number; y: number };

export type ActionsAndroidMap<T> =
  | [ActionButtonAndroid<T>, ActionButtonAndroid<T>, ActionButtonAndroid<T>, ActionButtonAndroid<T>]
  | [ActionButtonAndroid<T>, ActionButtonAndroid<T>, ActionButtonAndroid<T>]
  | [ActionButtonAndroid<T>, ActionButtonAndroid<T>]
  | [ActionButtonAndroid<T>];

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

export type MapButtons<T> = Array<MapButton<T> | MapPanButton<T>>;

export type MapTemplateConfig = Omit<NitroMapTemplateConfig, 'id' | 'mapButtons' | 'actions'> & {
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
  actions?: {
    android?: ActionsAndroidMap<MapTemplate>;
    ios?: ActionsIos<MapTemplate>;
  };
};

const convertActions = (template: MapTemplate, actions: MapTemplateConfig['actions']) => {
  return Platform.OS === 'android'
    ? NitroActionUtil.convertAndroidMap(template, actions?.android)
    : NitroActionUtil.convertIos(template, actions?.ios);
};

export class MapTemplate extends Template<MapTemplateConfig, MapTemplateConfig['actions']> {
  private cleanup: () => void;
  private template = this;

  constructor(config: MapTemplateConfig) {
    super(config);

    const { component, mapButtons, actions, ...baseConfig } = config;

    AppRegistry.registerComponent(
      this.templateId,
      () => (props) =>
        React.createElement(SafeAreaInsetsProvider, {
          moduleName: config.id,
          // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
          children: React.createElement(component, { ...props, template: this.template }),
        })
    );

    const nitroConfig: NitroMapTemplateConfig = {
      ...baseConfig,
      actions: convertActions(this.template, actions),
      mapButtons: NitroMapButton.convert(this.template, mapButtons),
    };

    this.cleanup = AutoPlay.createMapTemplate(nitroConfig);
  }

  public setMapButtons(mapButtons: MapTemplateConfig['mapButtons']) {
    const buttons = NitroMapButton.convert(this.template, mapButtons);
    AutoPlay.setTemplateMapButtons(this.templateId, buttons);
  }

  public override setActions(actions: MapTemplateConfig['actions']) {
    const nitroActions = convertActions(this.template, actions);
    AutoPlay.setTemplateActions(this.templateId, nitroActions);
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
