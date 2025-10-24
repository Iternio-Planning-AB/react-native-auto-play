import type React from 'react';
import { AppRegistry } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { HybridCarPlayDashboard as NitroHybridCarPlayDashboard } from '../specs/HybridCarPlayDashboard.nitro';
import type { RootComponentInitialProps } from '../types/RootComponent';

const HybridCarPlayDashboard =
  NitroModules.createHybridObject<NitroHybridCarPlayDashboard>('HybridCarPlayDashboard');

class Dashboard {
  private component: React.ComponentType<RootComponentInitialProps> | null = null;
  public isConnected = false;
  public readonly id = 'CarPlayDashboard';

  constructor() {
    HybridCarPlayDashboard.addListener('didConnect', () => this.setIsConnected(true));
    HybridCarPlayDashboard.addListener('didDisconnect', () => this.setIsConnected(false));
  }

  private setIsConnected(isConnected: boolean) {
    this.isConnected = isConnected;
    this.registerComponent();
  }

  private registerComponent() {
    const { component, isConnected } = this;
    if (!isConnected || component == null) {
      return;
    }

    AppRegistry.registerComponent(this.id, () => component);
    HybridCarPlayDashboard.initRootView();
  }

  public setComponent(component: React.ComponentType<RootComponentInitialProps>) {
    if (this.component != null) {
      throw new Error('setComponent can be called once only');
    }
    this.component = component;
    this.registerComponent();
  }
}

export const CarPlayDashboard = new Dashboard();
