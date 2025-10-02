import React from 'react';
import { AppRegistry } from 'react-native';
import { AutoPlay } from '..';
import type { RootComponentInitialProps } from '../types/RootComponent';
import { Template, type TemplateConfig } from './Template';

export type AutoPlayCluster = string & { __brand: 'uuid' };
export type MapTemplateId = 'AutoPlayRoot' | 'AutoPlayDashboard' | AutoPlayCluster;

export interface NitroMapTemplateConfig extends TemplateConfig {}

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

  constructor(config: MapTemplateConfig) {
    super(config);

    // biome-ignore lint/complexity/noUselessThisAlias: we need the template reference when the component gets started from react-native
    const template = this;
    const { component, ...rest } = config;

    AppRegistry.registerComponent(
      this.templateId,
      () => (props) => React.createElement(component, { ...props, template })
    );

    AutoPlay.createMapTemplate(rest);
  }

  public setRootTemplate() {
    AutoPlay.setRootTemplate(this.templateId);
  }
}
