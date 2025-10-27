import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback } from '../types/Event';
import type { Telemetry } from '../types/Telemetry';

export interface HybridAndroidAutoTelemetry extends HybridObject<{ android: 'kotlin' }> {
  /**
   * Register a listener for Android Auto telemetry data. Should be registered only after the telemetry permissions are granted otherwise no data will be received.
   * @param callback the callback to receive the telemetry data
   * @returns callback to remove the listener
   */
  registerTelemetryListener(callback: (tlm: Telemetry | null) => void): CleanupCallback;
}
