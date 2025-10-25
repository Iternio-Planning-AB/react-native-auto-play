import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback, EventName, VisibilityState } from '../types/Event';
import type { NitroImage } from '../utils/NitroImage';

type DashboardEvent = EventName | VisibilityState;

export interface BaseCarPlayDashboardButton {
  titleVariants: Array<string>;
  subtitleVariants: Array<string>;
  onPress?: () => void;
}

interface NitroCarPlayDashboardButton extends BaseCarPlayDashboardButton {
  image: NitroImage;
}

export interface HybridCarPlayDashboard extends HybridObject<{ ios: 'swift' }> {
  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace iOS
   * @param eventType generic events
   * @returns callback to remove the listener
   */
  addListener(eventType: DashboardEvent, callback: () => void): CleanupCallback;
  setButtons(buttons: Array<NitroCarPlayDashboardButton>): void;

  initRootView(): void;
}
