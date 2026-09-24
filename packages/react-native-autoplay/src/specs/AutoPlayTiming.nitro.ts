import type { HybridObject } from 'react-native-nitro-modules';

/**
 * Backs setTimeout/setInterval with a scheduler that never pauses -- unlike RN's own JS
 * timers, which RN throttles or pauses whenever the app backgrounds, regardless of whether
 * the process is actually still running.
 *
 * iOS: CarPlay keeps this app's process alive and driving the external screen even when the
 * phone's own screen is off, but RN's own RCTTiming still pauses in that state regardless.
 *
 * Android: JavaTimerManager only keeps ticking while the host is resumed *or* a headless JS
 * task is running -- previously satisfied by registering a permanent no-op headless task
 * (see AutoPlayHeadlessJsTask), which this replaces.
 *
 * All due-time bookkeeping lives here natively (mirroring RCTTiming's/JavaTimerManager's own
 * architecture) so JS only crosses the bridge when a timer actually fires, not on every tick.
 */
export interface AutoPlayTiming extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Schedules `callback` to run after `durationMs`, repeating every `durationMs` if `repeats`
   * is true. Returns an id to pass to `deleteTimer`.
   */
  createTimer(callback: () => void, durationMs: number, repeats: boolean): number;
  deleteTimer(id: number): void;
}
