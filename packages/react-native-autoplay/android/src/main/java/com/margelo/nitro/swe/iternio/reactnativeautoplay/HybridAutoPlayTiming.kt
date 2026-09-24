package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong

private class ScheduledTimer(
    val callback: () -> Unit,
    val interval: Long,
    val repeats: Boolean,
    var target: Long,
)

// Weak ref, so a stale instance (dev reload / host restart) can't tick forever in the queue.
private class TickRunnable(target: HybridAutoPlayTiming) : Runnable {
    private val ref = WeakReference(target)

    override fun run() {
        ref.get()?.tick()
    }
}

/**
 * Backs setTimeout/setInterval (see AutoPlayTimers.ts) with a plain Handler loop on the main
 * Looper -- not Choreographer, which JavaTimerManager itself uses and only keeps ticking while
 * the host is resumed or a headless JS task is running. See AutoPlayTiming.nitro.ts.
 *
 * Ticks at a fixed ~60Hz while any timer is pending and stops entirely once idle, rather than
 * scheduling a delay to the next due target: postDelayed's dispatch is gated on uptimeMillis(),
 * which pauses during deep sleep, so a long pre-sleep delay would need that much *awake* time
 * after waking. A short, repeated delay only needs ~16ms of awake time, so it fires within
 * about one frame of the device waking regardless of sleep length -- due timers are then found
 * correctly because target/now use elapsedRealtime(), which counts straight through sleep.
 */
class HybridAutoPlayTiming : HybridAutoPlayTimingSpec() {
    companion object {
        private const val FRAME_DURATION_MS = 1000L / 60L

        // RN's TimerManager also numbers ids from 1; offsetting avoids collisions with ids a
        // pre-install caller (e.g. React's own scheduler) still holds against the original
        // clearTimeout, now replaced.
        private const val ID_OFFSET = 1_000_000_000L
    }

    private val handler = Handler(Looper.getMainLooper())
    private val timers = ConcurrentHashMap<Double, ScheduledTimer>()
    private val nextId = AtomicLong(ID_OFFSET)
    private val isTicking = AtomicBoolean(false)
    private val tickRunnable = TickRunnable(this)

    private fun ensureTicking() {
        if (isTicking.compareAndSet(false, true)) {
            handler.postDelayed(tickRunnable, FRAME_DURATION_MS)
        }
    }

    internal fun tick() {
        // elapsedRealtime(), not uptimeMillis(): both are immune to NTP/manual clock changes,
        // but unlike uptimeMillis() this one keeps counting through deep sleep.
        val now = SystemClock.elapsedRealtime()

        // Sort by (target, id): ConcurrentHashMap iteration order is unspecified, so
        // setTimeout(a, 0); setTimeout(b, 0) could otherwise fire b before a.
        val dueIds = timers.entries.filter { it.value.target <= now }
            .sortedWith(compareBy({ it.value.target }, { it.key }))
            .map { it.key }

        for (id in dueIds) {
            // Re-check membership: a same-tick callback may have cleared a later timer in
            // this snapshotted list (e.g. `clearTimeout(t); t = setTimeout(...)`).
            val timer = timers[id] ?: continue

            if (timer.repeats) {
                timer.target = now + timer.interval
            } else {
                timers.remove(id)
            }

            timer.callback()
        }

        if (timers.isNotEmpty()) {
            handler.postDelayed(tickRunnable, FRAME_DURATION_MS)
            return
        }

        isTicking.set(false)
        // Reclaim: a concurrent createTimer() may have inserted an entry and found `isTicking`
        // still true (skipping its own post) in the gap before the flag was cleared above.
        if (timers.isNotEmpty()) {
            ensureTicking()
        }
    }

    override fun createTimer(callback: () -> Unit, durationMs: Double, repeats: Boolean): Double {
        val interval = durationMs.toLong().coerceAtLeast(0)
        val id = nextId.getAndIncrement().toDouble()
        timers[id] = ScheduledTimer(
            callback = callback,
            interval = interval,
            repeats = repeats,
            target = SystemClock.elapsedRealtime() + interval,
        )
        ensureTicking()
        return id
    }

    override fun deleteTimer(id: Double) {
        timers.remove(id)
    }

    override fun dispose() {
        handler.removeCallbacks(tickRunnable)
        isTicking.set(false)
        timers.clear()
        super.dispose()
    }
}
