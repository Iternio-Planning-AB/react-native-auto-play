import { HybridAutoPlayTiming } from '../hybrid/HybridAutoPlayTiming';

type TimerCallback = (...args: unknown[]) => void;

let installed = false;

/**
 * Replaces the global `setTimeout`/`setInterval`/`clearTimeout`/`clearInterval` and
 * `requestAnimationFrame`/`cancelAnimationFrame` with implementations backed by the native
 * `AutoPlayTiming` module, so they keep running while the app is actively driving a car
 * surface even though the phone itself is backgrounded or its screen is locked. React
 * Native's own timers throttle or pause in that state regardless of whether the process is
 * actually still alive, which would otherwise stall ETA updates and telemetry polling.
 *
 * `requestIdleCallback`/`cancelIdleCallback` are deliberately not covered: bridgeless RN
 * backs those with a separate native module unrelated to `setTimeout`/`requestAnimationFrame`
 * (and its own callback delivery path is an unimplemented stub on iOS), so there is nothing
 * for this library to intercept there.
 *
 * All due-time bookkeeping happens natively -- this is a thin pass-through, so JS only
 * crosses the bridge when a timer actually fires, not on some fixed interval.
 *
 * Call this **once**, as early as possible in your app -- ideally the first line of your
 * entry file, before any other import -- so nothing else has already captured a reference to
 * the original globals. Safe to call more than once; only the first call has any effect.
 */
export function installAutoPlayTimers(): void {
  if (installed || HybridAutoPlayTiming == null) {
    return;
  }
  installed = true;

  const timing = HybridAutoPlayTiming;

  // Native takes a due timer out of its table before the callback reaches the JS thread, so
  // a clear that lands in between has nothing left to delete and the callback still runs.
  // Code that relies on clearTimeout actually cancelling then breaks: axios' progress
  // throttle, for one, calls its handler with null and throws. Tracking the live ids here
  // makes a cleared timer never fire, whatever the native side has already queued.
  const live = new Set<number>();

  const start = (fire: () => void, delay: number, repeats: boolean): number => {
    const id = timing.createTimer(
      () => {
        if (!live.has(id)) {
          return;
        }
        if (!repeats) {
          live.delete(id);
        }
        fire();
      },
      delay,
      repeats
    );
    live.add(id);
    return id;
  };

  const schedule =
    (repeats: boolean) =>
    (callback: TimerCallback, delay?: number, ...args: unknown[]): number =>
      start(() => callback(...args), delay ?? 0, repeats);

  const clear = (id: unknown): void => {
    if (typeof id === 'number') {
      live.delete(id);
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
    start(() => callback(now()), 0, false)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = clear as unknown as typeof cancelAnimationFrame;
}
