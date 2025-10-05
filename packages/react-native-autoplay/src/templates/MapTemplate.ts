import React from 'react';
import { AppRegistry, Platform, processColor } from 'react-native';
import { AutoPlay } from '..';
import type { MapButton, MapButtonType, MapPanButton } from '../types/Button';
import { glyphMap } from '../types/Glyphmap';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import { Template, type TemplateConfig } from './Template';

export type AutoPlayCluster = string & { __brand: 'uuid' };
export type MapTemplateId = 'AutoPlayRoot' | 'AutoPlayDashboard' | AutoPlayCluster;

type Point = { x: number; y: number };

type NitroImage = {
  glyph: number;
  size: number;
  color?: number;
  backgroundColor?: number;
};

type NitroMapButton = {
  type: MapButtonType;
  image?: NitroImage;
  onPress: () => void;
};

export interface NitroMapTemplateConfig extends TemplateConfig {
  /**
   * buttons that represent actions on the map template, usually on the bottom right corner
   */
  mapButtons?: Array<NitroMapButton>;
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
   * lets you know when the color scheme changed
   */
  onAppearanceDidChange?: (colorScheme: ColorScheme) => void;
}

export type MapTemplateConfig = Omit<NitroMapTemplateConfig, 'id' | 'mapButtons'> & {
  /**
   * map templates can have only these ids
   * @AutoPlayRoot head unit screen
   * @AutoPlayDashboard CarPlay dashboard (iOS only)
   * @AutoPlayCluster uuid generated on native side when a cluster screen connects and passed over on the cluster connection listener
   */
  id: MapTemplateId;
  component: React.ComponentType<RootComponentInitialProps & { template: MapTemplate }>;
  mapButtons?: Array<MapButton | MapPanButton>;
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
    const { component, mapButtons, ...baseConfig } = config;

    AppRegistry.registerComponent(
      this.templateId,
      () => (props) => React.createElement(component, { ...props, template })
    );

    const mapConfig: NitroMapTemplateConfig = {
      ...baseConfig,
      mapButtons: mapButtons?.map<NitroMapButton>((button) => {
        const { onPress, type } = button;

        if (button.type === 'pan') {
          if (Platform.OS === 'android') {
            return { type: 'pan', onPress };
          }
          throw new Error(
            'unsupported platform, pan button can be used on Android only! Use a custom button instead.'
          );
        }

        const {
          name,
          size = 16,
          color = 'white',
          backgroundColor = 'transparent',
          ...rest
        } = button.image;

        return {
          type,
          onPress,
          image: {
            ...rest,
            size,
            glyph: glyphMap[name],
            color: processColor(Platform.OS === 'android' ? 'white' : color) as number | undefined,
            backgroundColor: processColor(
              Platform.OS === 'android' ? 'transparent' : backgroundColor
            ) as number | undefined,
          },
        };
      }),
    };

    this.cleanup = AutoPlay.createMapTemplate(mapConfig);
  }

  public setRootTemplate() {
    AutoPlay.setRootTemplate(this.templateId);
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
