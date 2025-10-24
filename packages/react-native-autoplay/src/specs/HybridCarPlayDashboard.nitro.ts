import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback, EventName, VisibilityState } from '../types/Event';

type DashboardEvent = EventName | VisibilityState;

export interface HybridCarPlayDashboard extends HybridObject<{ ios: 'swift' }> {
  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace iOS
   * @param eventType generic events
   * @returns callback to remove the listener
   */
  addListener(eventType: DashboardEvent, callback: () => void): CleanupCallback;

  initRootView(): void;
}
