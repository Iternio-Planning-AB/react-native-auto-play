import React from 'react';
import { AppRegistry } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type { HybridCluster as NitroHybridCluster } from '../specs/HybridCluster.nitro';
import type { RootComponentInitialProps } from '../types/RootComponent';
import type { AutoAttributedString } from '../utils/NitroAttributedString';
import { NitroImageUtil } from '../utils/NitroImage';

const HybridCluster = NitroModules.createHybridObject<NitroHybridCluster>('HybridCluster');

class Cluster {
  private component: React.ComponentType<RootComponentInitialProps> | null = null;
  private attributedInactiveDescriptionVariants: Array<AutoAttributedString> = [];
  private clusters: { [key: string]: boolean } = {};

  constructor() {
    HybridCluster.addListener('didConnect', (clusterId: string) =>
      this.setIsConnected(clusterId, true)
    );
    HybridCluster.addListener('didDisconnect', (clusterId: string) =>
      this.setIsConnected(clusterId, false)
    );
  }

  private setIsConnected(clusterId: string, isConnected: boolean) {
    if (isConnected) {
      this.clusters[clusterId] = false;
      this.registerComponent();
    } else {
      delete this.clusters[clusterId];
    }
  }

  private async registerComponent() {
    const { component } = this;

    if (component == null) {
      return;
    }

    const clusterIds = Object.entries(this.clusters)
      .filter(([_, registered]) => !registered)
      .map(([clusterId]) => clusterId);

    for (const clusterId of clusterIds) {
      AppRegistry.registerComponent(
        clusterId,
        () => (props) =>
          React.createElement(SafeAreaInsetsProvider, {
            moduleName: clusterId,
            // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
            children: React.createElement(component, props),
          })
      );

      this.clusters[clusterId] = true;

      await HybridCluster.initRootView(clusterId);
    }

    this.applyAttributedInactiveDescriptionVariants();
  }

  private applyAttributedInactiveDescriptionVariants() {
    const variants = this.attributedInactiveDescriptionVariants.map((v) => ({
      ...v,
      images: v.images?.map((i) => ({ ...i, image: NitroImageUtil.convert(i.image) })),
    }));
    for (const clusterId of Object.keys(this.clusters)) {
      HybridCluster.setAttributedInactiveDescriptionVariants(clusterId, variants);
    }
  }

  public setComponent(component: React.ComponentType<RootComponentInitialProps>) {
    if (this.component != null) {
      throw new Error('ClusterScene.setComponent can be called once only');
    }
    this.component = component;
    this.registerComponent();
  }

  /**
   * sets the text that is shown while no navigation is ongoing
   * applies specified strings to all connected cluster of content type "Instruction Card"
   * @namespace iOS
   */
  public setAttributedInactiveDescriptionVariants(
    attributedInactiveDescriptionVariants: Array<AutoAttributedString>
  ) {
    this.attributedInactiveDescriptionVariants = attributedInactiveDescriptionVariants;
    this.applyAttributedInactiveDescriptionVariants();
  }
}

/**
 * @namespace Android
 * @namespace iOS >= 15.4
 */
export const ClusterScene = new Cluster();
