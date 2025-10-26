import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback } from '../types/Event';
import type { NitroAttributedString } from '../utils/NitroAttributedString';

type ClusterEventName =
  | 'didConnect'
  | 'didConnectWithWindow'
  | 'didDisconnect'
  | 'didDisconnectFromWindow';

export interface HybridCluster extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  addListener(eventType: ClusterEventName, callback: (clusterId: string) => void): CleanupCallback;
  initRootView(clusterId: string): Promise<void>;
  setAttributedInactiveDescriptionVariants(
    clusterId: string,
    attributedInactiveDescriptionVariants: Array<NitroAttributedString>
  ): Promise<void>;
}
