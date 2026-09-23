import { Platform } from 'react-native';
import { HybridAutoPlayTiming } from '../hybrid/HybridAutoPlayTiming';

type TimerCallback = (...args: unknown[]) => void;

let installed = false;

/**
 * Replaces the global `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval` and
 * `requestAnimationFrame`/`cancelAnimationFrame` with implementations backed by the native
 * `AutoPlayTiming` module, so they keep running while the phone screen is locked and CarPlay
 * is actively driving the external screen. React Native's own timers throttle or pause in
 * that state regardless of whether the process is actually still alive, which would
 * otherwise stall ETA updates and telemetry polling.
 *
 * `requestIdleCallback`/`cancelIdleCallback` are deliberately not covered: bridgeless RN
 * backs those with a separate native module unrelated to `setTimeout`/`requestAnimationFrame`
 * (and its own callback delivery path is an unimplemented stub on iOS), so there is nothing
 * for this library to intercept there.
 *
 * All due-time bookkeeping happens natively -- this is a thin pass-through, so JS only
 * crosses the bridge when a timer actually fires, not on some fixed interval.
 *
 * iOS only -- a no-op on Android (which doesn't have this problem) and everywhere else.
 *
 * Call this **once**, as early as possible in your app -- ideally the first line of your
 * entry file, before any other import -- so nothing else has already captured a reference to
 * the original globals. Safe to call more than once; only the first call has any effect.
 */
export function installAutoPlayTimers(): void {
  if (installed || Platform.OS !== 'ios' || HybridAutoPlayTiming == null) {
    return;
  }
  installed = true;

  const timing = HybridAutoPlayTiming;

  const schedule =
    (repeats: boolean) =>
    (callback: TimerCallback, delay?: number, ...args: unknown[]): number =>
      timing.createTimer(() => callback(...args), delay ?? 0, repeats);

  const clear = (id: unknown): void => {
    if (typeof id === 'number') {
      timing.deleteTimer(id);
    }
  };

  globalThis.setTimeout = schedule(false) as unknown as typeof setTimeout;
  globalThis.setInterval = schedule(true) as unknown as typeof setInterval;
  globalThis.clearTimeout = clear as unknown as typeof clearTimeout;
  globalThis.clearInterval = clear as unknown as typeof clearInterval;

  // Mirrors bridgeless RN's own implementation: requestAnimationFrame is setTimeout(0) with
  // a performance.now() timestamp handed to the callback, and cancelAnimationFrame deletes
  // the same underlying timer clearTimeout would.
  const now = () =>
    (globalThis as { performance?: { now(): number } }).performance?.now() ?? Date.now();

  globalThis.requestAnimationFrame = ((callback: (timestamp: number) => void): number =>
    timing.createTimer(() => callback(now()), 0, false)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = clear as unknown as typeof cancelAnimationFrame;
}
