import type React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type {
  BaseCarPlayDashboardButton,
  HybridCarPlayDashboard as NitroHybridCarPlayDashboard,
} from '../specs/HybridCarPlayDashboard.nitro';
import type { AutoImage } from '../types/Image';
import type { RootComponentInitialProps } from '../types/RootComponent';
import { NitroImageUtil } from '../utils/NitroImage';

const HybridCarPlayDashboard =
  NitroModules.createHybridObject<NitroHybridCarPlayDashboard>('HybridCarPlayDashboard');

export interface CarPlayDashboardButton extends BaseCarPlayDashboardButton {
  image: AutoImage;
}

class Dashboard {
  private component: React.ComponentType<RootComponentInitialProps> | null = null;
  public isConnected = false;
  public readonly id = 'CarPlayDashboard';

  constructor() {
    if (Platform.OS !== 'ios') {
      return;
    }
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
    if (Platform.OS !== 'ios') {
      console.warn(`CarPlayDashboard is not supported on ${Platform.OS}`);
      return;
    }
    if (this.component != null) {
      throw new Error('setComponent can be called once only');
    }
    this.component = component;
    this.registerComponent();
  }

  /**
   * sets the dashboard shortcut buttons, make sure to supply at least one button as soon as possible,
   * otherwise the dashboard will not show up!
   */
  public setButtons(buttons: Array<CarPlayDashboardButton>) {
    HybridCarPlayDashboard.setButtons(
      buttons.map((button) => ({ ...button, image: NitroImageUtil.convert(button.image) }))
    );
  }
}

export const CarPlayDashboard = new Dashboard();
