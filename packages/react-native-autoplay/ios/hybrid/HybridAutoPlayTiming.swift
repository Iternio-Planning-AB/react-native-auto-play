import Foundation
import NitroModules

private struct ScheduledTimer {
    let callback: () -> Void
    let interval: TimeInterval
    let repeats: Bool
    var target: TimeInterval
}

// Unlike ProcessInfo.systemUptime/mach_absolute_time(), keeps counting through sleep. RAW over
// plain CLOCK_MONOTONIC: also immune to NTP frequency-discipline adjustments.
private func now() -> TimeInterval {
    TimeInterval(clock_gettime_nsec_np(CLOCK_MONOTONIC_RAW)) / 1_000_000_000
}

/// Backs setTimeout/setInterval (see AutoPlayTimers.ts) with a plain `Timer` -- not tied to
/// `CADisplayLink`/screen refresh, so it keeps firing while the phone screen is locked and
/// CarPlay is actively driving the external screen. See AutoPlayTiming.nitro.ts.
///
/// Ticks at a fixed ~60Hz while any timer is pending and stops entirely once idle, rather than
/// scheduling a delay to the next due target: a `Timer`'s dispatch is gated on the run loop's
/// own monotonic clock, which (like `mach_absolute_time()`) pauses during sleep, so a long
/// pre-sleep delay would need that much *awake* time after waking. A short, repeated delay only
/// needs ~16ms of awake time, so it fires within about one frame of the device waking
/// regardless of sleep length.
class HybridAutoPlayTiming: HybridAutoPlayTimingSpec {
    private static let frameDuration: TimeInterval = 1.0 / 60.0

    // RN's TimerManager also numbers ids from 1; offsetting avoids collisions with ids a
    // pre-install caller (e.g. React's own scheduler) still holds against the original
    // clearTimeout, now replaced.
    private static let idOffset: Double = 1_000_000_000

    private let lock = NSLock()
    private var timers = [Double: ScheduledTimer]()
    private var nextId: Double = HybridAutoPlayTiming.idOffset
    private var timer: Timer?

    deinit {
        timer?.invalidate()
    }

    private func withLock<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    // Must be called while already holding `lock`.
    private func scheduleTick() {
        let next = Timer(timeInterval: HybridAutoPlayTiming.frameDuration, repeats: false) { [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(next, forMode: .common)
        timer = next
    }

    private func tick() {
        let currentTime = now()

        // Sort by (target, id): Dictionary iteration order is unspecified, so
        // setTimeout(a, 0); setTimeout(b, 0) could otherwise fire b before a.
        let dueIds = withLock {
            timers.filter { $0.value.target <= currentTime }
                .sorted { lhs, rhs in
                    lhs.value.target != rhs.value.target
                        ? lhs.value.target < rhs.value.target
                        : lhs.key < rhs.key
                }
                .map(\.key)
        }

        for id in dueIds {
            // Re-check membership: a same-tick callback may have cleared a later timer in
            // this snapshotted list (e.g. `clearTimeout(t); t = setTimeout(...)`).
            let callback: (() -> Void)? = withLock {
                guard var entry = timers[id] else { return nil }
                if entry.repeats {
                    entry.target = now() + entry.interval
                    timers[id] = entry
                } else {
                    timers.removeValue(forKey: id)
                }
                return entry.callback
            }

            callback?()
        }

        withLock {
            timer = nil
            if !timers.isEmpty {
                scheduleTick()
            }
        }
    }

    func createTimer(callback: @escaping () -> Void, durationMs: Double, repeats: Bool) throws -> Double {
        let interval = max(durationMs, 0) / 1000.0

        return withLock {
            let id = nextId
            nextId += 1
            timers[id] = ScheduledTimer(
                callback: callback,
                interval: interval,
                repeats: repeats,
                target: now() + interval
            )
            if timer == nil {
                scheduleTick()
            }
            return id
        }
    }

    func deleteTimer(id: Double) throws {
        withLock {
            _ = timers.removeValue(forKey: id)
        }
    }
}
