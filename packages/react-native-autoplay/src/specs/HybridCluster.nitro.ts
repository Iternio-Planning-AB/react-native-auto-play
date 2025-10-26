import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback } from '../types/Event';
import type { ColorScheme } from '../types/RootComponent';
import type { NitroAttributedString } from '../utils/NitroAttributedString';

type ClusterEventName =
  | 'didConnect'
  | 'didConnectWithWindow'
  | 'didDisconnect'
  | 'didDisconnectFromWindow';

export type ZoomEvent = 'in' | 'out';

export interface HybridCluster extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  addListener(eventType: ClusterEventName, callback: (clusterId: string) => void): CleanupCallback;
  initRootView(clusterId: string): Promise<void>;
  setAttributedInactiveDescriptionVariants(
    clusterId: string,
    attributedInactiveDescriptionVariants: Array<NitroAttributedString>
  ): void;
  addListenerColorScheme(
    callback: (clusterId: string, payload: ColorScheme) => void
  ): CleanupCallback;
  addListenerZoom(callback: (clusterId: string, payload: ZoomEvent) => void): CleanupCallback;
  addListenerCompass(callback: (clusterId: string, payload: boolean) => void): CleanupCallback;
  addListenerSpeedLimit(callback: (clusterId: string, payload: boolean) => void): CleanupCallback;
}
