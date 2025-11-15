import React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import { HybridAutoPlay } from '..';
import { SafeAreaInsetsProvider } from '../components/SafeAreaInsetsContext';
import type {
  BaseCarPlayDashboardButton,
  CarPlayDashboard as NitroCarPlayDashboard,
} from '../specs/CarPlayDashboard.nitro';
import type { EventName, VisibilityState } from '../types/Event';
import type { AutoImage } from '../types/Image';
import type { ColorScheme, RootComponentInitialProps } from '../types/RootComponent';
import { NitroImageUtil } from '../utils/NitroImage';

const HybridCarPlayDashboard =
  Platform.OS === 'ios'
    ? NitroModules.createHybridObject<NitroCarPlayDashboard>('CarPlayDashboard')
    : null;

export interface CarPlayDashboardButton extends BaseCarPlayDashboardButton {
  image: AutoImage;
}

export type CarPlayDashboardEvent = EventName | VisibilityState;

class Dashboard {
  private component: React.ComponentType<RootComponentInitialProps> | null = null;
  public isConnected = false;
  public readonly id = 'CarPlayDashboard';

  constructor() {
    if (HybridCarPlayDashboard == null) {
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
    if (HybridCarPlayDashboard == null) {
      return;
    }

    const { component, isConnected } = this;
    if (!isConnected || component == null) {
      return;
    }

    AppRegistry.registerComponent(
      this.id,
      () => (props) =>
        React.createElement(SafeAreaInsetsProvider, {
          moduleName: this.id,
          // biome-ignore lint/correctness/noChildrenProp: there is no other way in a ts file
          children: React.createElement(component, props),
        })
    );
    HybridCarPlayDashboard.initRootView();
  }

  public setComponent(component: React.ComponentType<RootComponentInitialProps>) {
    if (Platform.OS !== 'ios') {
      console.warn(`CarPlayDashboard.setComponent is not supported on ${Platform.OS}`);
      return;
    }
    if (this.component != null) {
      throw new Error('CarPlayDashboard.setComponent can be called once only');
    }
    this.component = component;
    this.registerComponent();
  }

  /**
   * sets the dashboard shortcut buttons, make sure to supply at least one button as soon as possible,
   * otherwise the dashboard will not show up!
   * @namespace iOS
   */
  public setButtons(buttons: Array<CarPlayDashboardButton>) {
    if (HybridCarPlayDashboard == null) {
      console.warn(`CarPlayDashboard.setButtons is not supported on ${Platform.OS}`);
      return;
    }
    HybridCarPlayDashboard.setButtons(
      buttons.map((button) => ({ ...button, image: NitroImageUtil.convert(button.image) }))
    );
  }

  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace iOS
   * @param eventType generic events
   * @returns callback to remove the listener
   */
  public addListener(event: EventName, callback: () => void) {
    if (HybridCarPlayDashboard == null) {
      throw new Error(`CarPlayDashboard.addListener is not supported on ${Platform.OS}`);
    }
    return HybridCarPlayDashboard.addListener(event, callback);
  }

  public addListenerRenderState(callback: (payload: VisibilityState) => void) {
    if (HybridCarPlayDashboard == null) {
      throw new Error(`CarPlayDashboard.addListener is not supported on ${Platform.OS}`);
    }
    return HybridAutoPlay.addListenerRenderState(this.id, callback);
  }

  public addListenerColorScheme(callback: (payload: ColorScheme) => void) {
    if (HybridCarPlayDashboard == null) {
      throw new Error(`CarPlayDashboard.addListener is not supported on ${Platform.OS}`);
    }
    return HybridCarPlayDashboard.addListenerColorScheme(callback);
  }
}

export const CarPlayDashboard = new Dashboard();
