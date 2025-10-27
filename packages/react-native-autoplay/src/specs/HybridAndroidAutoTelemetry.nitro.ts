import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback } from '../types/Event';
import type { Telemetry } from '../types/Telemetry';

export interface HybridAndroidAutoTelemetry extends HybridObject<{ android: 'kotlin' }> {
  /**
   * Register a listener for Android Auto telemetry data. Should be registered only after the telemetry permissions are granted otherwise no data will be received.
   * @param callback the callback to receive the telemetry data
   * @param error the error message if the telemetry listener failed to start
   * @returns callback to remove the listener
   * @namespace Android
   */
  registerTelemetryListener(
    callback: (tlm: Telemetry | null, error: string | null) => void
  ): CleanupCallback;
}
