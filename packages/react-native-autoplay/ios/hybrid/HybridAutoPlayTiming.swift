import Foundation
import NitroModules

private struct ScheduledTimer {
    let callback: () -> Void
    let interval: TimeInterval
    let repeats: Bool
    var target: Date
}

/// Backs setTimeout/setInterval (see AutoPlayTimers.ts) with a scheduler driven by a plain,
/// always-running `Timer` -- deliberately not tied to `CADisplayLink`/screen refresh, so it
/// keeps firing while the phone screen is locked and CarPlay is actively driving the external
/// screen. All due-time bookkeeping happens here, mirroring RCTTiming's own architecture, so
/// JS only crosses the bridge when a timer actually fires. See AutoPlayTiming.nitro.ts.
class HybridAutoPlayTiming: HybridAutoPlayTimingSpec {
    // Matches RCTTiming's own frame cadence.
    private static let frameDuration: TimeInterval = 1.0 / 60.0

    private let lock = NSLock()
    private var timers = [Double: ScheduledTimer]()
    private var nextId: Double = 1
    private var timer: Timer?

    override init() {
        super.init()
        let timer = Timer.scheduledTimer(withTimeInterval: HybridAutoPlayTiming.frameDuration, repeats: true) {
            [weak self] _ in
            self?.tick()
        }
        RunLoop.main.add(timer, forMode: .common)
        self.timer = timer
    }

    deinit {
        timer?.invalidate()
    }

    private func withLock<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    private func tick() {
        let now = Date()
        var due = [ScheduledTimer]()

        withLock {
            let dueIds = timers.filter { $0.value.target <= now }.map(\.key)
            for id in dueIds {
                guard var entry = timers[id] else { continue }
                due.append(entry)
                if entry.repeats {
                    entry.target = Date(timeIntervalSinceNow: entry.interval)
                    timers[id] = entry
                } else {
                    timers.removeValue(forKey: id)
                }
            }
        }

        for entry in due {
            entry.callback()
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
                target: Date(timeIntervalSinceNow: interval)
            )
            return id
        }
    }

    func deleteTimer(id: Double) throws {
        withLock {
            _ = timers.removeValue(forKey: id)
        }
    }
}
