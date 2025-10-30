import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type { HybridCluster as NitroHybridCluster, ZoomEvent } from '../specs/HybridCluster.nitro';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import type { AutoAttributedString } from '../utils/NitroAttributedString';
import { NitroImageUtil } from '../utils/NitroImage';

const HybridCluster = NitroModules.createHybridObject<NitroHybridCluster>('HybridCluster');

class Cluster {
  private component: React.ComponentType<RootComponentInitialProps> | null = null;
  private attributedInactiveDescriptionVariants: Array<AutoAttributedString> = [];
  /**
   * Holds all cluster scene/session IDs and if they have a window/surface connected
   */
  private clusters: { [key: string]: boolean } = {};

  constructor() {
    HybridCluster.addListener('didConnect', (clusterId) => {
      if (this.clusters[clusterId] != null) {
        // in case didConnectWithWindow fires before didConnect
        return;
      }
      this.clusters[clusterId] = false;
      this.applyAttributedInactiveDescriptionVariants();
    });
    HybridCluster.addListener('didConnectWithWindow', (clusterId) => {
      this.clusters[clusterId] = false;
      this.registerComponent().catch((e) => {
        console.error(e);
      });
    });
    HybridCluster.addListener('didDisconnectFromWindow', (clusterId) => {
      if (this.clusters[clusterId] == null) {
        // in case didDisconnect fires before didDisconnectFromWindow
        return;
      }
      this.clusters[clusterId] = false;
    });
    HybridCluster.addListener('didDisconnect', (clusterId) => {
      delete this.clusters[clusterId];
    });
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
    return this.registerComponent();
  }

  /**
   * sets the text that is shown while no navigation is ongoing
   * applies specified strings to all connected cluster of content type "Instruction Card"
   * @namespace iOS
   */
  public setAttributedInactiveDescriptionVariants(
    attributedInactiveDescriptionVariants: Array<AutoAttributedString>
  ) {
    if (Platform.OS !== 'ios') {
      console.warn(
        `ClusterScene.setAttributedInactiveDescriptionVariants not supported for ${Platform.OS}`
      );
      return;
    }
    this.attributedInactiveDescriptionVariants = attributedInactiveDescriptionVariants;
    this.applyAttributedInactiveDescriptionVariants();
  }

  public addListenerColorScheme(callback: (clusterId: string, payload: ColorScheme) => void) {
    return HybridCluster.addListenerColorScheme(callback);
  }

  /**
   * add listener for cluster zoom buttons
   * @namespace iOS
   */
  public addListenerZoom(callback: (clusterId: string, payload: ZoomEvent) => void) {
    if (Platform.OS !== 'ios') {
      return;
    }
    return HybridCluster.addListenerZoom(callback);
  }

  /**
   * add listener for compass enable/disable
   * @namespace iOS
   */
  public addListenerCompass(callback: (clusterId: string, payload: boolean) => void) {
    if (Platform.OS !== 'ios') {
      return;
    }
    return HybridCluster.addListenerCompass(callback);
  }

  /**
   * add listener for speed limit enable/disable
   * @namespace iOS
   */
  public addListenerSpeedLimit(callback: (clusterId: string, payload: boolean) => void) {
    if (Platform.OS !== 'ios') {
      return;
    }
    return HybridCluster.addListenerSpeedLimit(callback);
  }
}

/**
 * @namespace Android
 * @namespace iOS >= 15.4
 */
export const AutoPlayCluster = new Cluster();
