import type { HybridObject } from 'react-native-nitro-modules';

/**
 * Backs setTimeout/setInterval with a scheduler that never pauses -- unlike RN's own JS
 * timers, which RN throttles or pauses whenever the app backgrounds, regardless of whether
 * the process is actually still running. CarPlay keeps this app's process alive and driving
 * the external screen even when the phone's own screen is off, but RN doesn't know that, so
 * ETA updates and telemetry polling would otherwise stall.
 *
 * All due-time bookkeeping lives here natively (mirroring RCTTiming's own architecture) so
 * JS only crosses the bridge when a timer actually fires, not on every tick.
 *
 * @namespace iOS
 */
export interface AutoPlayTiming extends HybridObject<{ ios: 'swift' }> {
  /**
   * Schedules `callback` to run after `durationMs`, repeating every `durationMs` if `repeats`
   * is true. Returns an id to pass to `deleteTimer`.
   */
  createTimer(callback: () => void, durationMs: number, repeats: boolean): number;
  deleteTimer(id: number): void;
}
