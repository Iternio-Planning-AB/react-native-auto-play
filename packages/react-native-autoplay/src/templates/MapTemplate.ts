import React from 'react';
import { AppRegistry } from 'react-native';
import { AutoPlay } from '..';
import type { RootComponentInitialProps } from '../types/RootComponent';
import { Template, type TemplateConfig } from './Template';

export type AutoPlayCluster = string & { __brand: 'uuid' };
export type MapTemplateId = 'AutoPlayRoot' | 'AutoPlayDashboard' | AutoPlayCluster;

type Point = { x: number; y: number };

export interface NitroMapTemplateConfig extends TemplateConfig {
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
   * double tab event callback
   * @param center coordinates of the click event in pixel
   * @namespace Android
   */
  onDoubleClick?: (center: Point) => void;
}

export type MapTemplateConfig = Omit<NitroMapTemplateConfig, 'id'> & {
  /**
   * map templates can have only these ids
   * @AutoPlayRoot head unit screen
   * @AutoPlayDashboard CarPlay dashboard (iOS only)
   * @AutoPlayCluster uuid generated on native side when a cluster screen connects and passed over on the cluster connection listener
   */
  id: MapTemplateId;
  component: React.ComponentType<RootComponentInitialProps & { template: MapTemplate }>;
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
    const { component, ...rest } = config;

    AppRegistry.registerComponent(
      this.templateId,
      () => (props) => React.createElement(component, { ...props, template })
    );

    this.cleanup = AutoPlay.createMapTemplate(rest);
  }

  public setRootTemplate() {
    AutoPlay.setRootTemplate(this.templateId);
  }

  public destroy() {
    this.cleanup();
    super.destroy();
  }
}
