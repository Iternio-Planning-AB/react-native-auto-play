import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback, EventName } from '../types/Event';

export interface HybridCluster extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  addListener(eventType: EventName, callback: (clusterId: string) => void): CleanupCallback;
  initRootView(clusterId: string): Promise<void>;
}
