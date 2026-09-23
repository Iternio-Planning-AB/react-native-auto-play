package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.os.Handler
import android.os.Looper
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

private class ScheduledTimer(
    val callback: () -> Unit,
    val interval: Long,
    val repeats: Boolean,
    var target: Long,
)

/**
 * Backs setTimeout/setInterval (see AutoPlayTimers.ts) with a scheduler driven by a plain
 * Handler loop on the main Looper -- deliberately not Choreographer, which is exactly what
 * JavaTimerManager itself uses, and which it only keeps ticking while the host is resumed or
 * a headless JS task is running. All due-time bookkeeping happens here, mirroring
 * JavaTimerManager's own architecture, so JS only crosses the bridge when a timer actually
 * fires. See AutoPlayTiming.nitro.ts.
 */
class HybridAutoPlayTiming : HybridAutoPlayTimingSpec() {
    companion object {
        // Matches JavaTimerManager's own frame cadence.
        private const val FRAME_DURATION_MS = 1000L / 60L
    }

    private val handler = Handler(Looper.getMainLooper())
    private val timers = ConcurrentHashMap<Double, ScheduledTimer>()
    private val nextId = AtomicLong(1)

    private val tickRunnable = object : Runnable {
        override fun run() {
            tick()
            handler.postDelayed(this, FRAME_DURATION_MS)
        }
    }

    init {
        handler.post(tickRunnable)
    }

    private fun tick() {
        val now = System.currentTimeMillis()
        val due = mutableListOf<ScheduledTimer>()

        // ConcurrentHashMap's iterators are weakly consistent, so removing entries (for
        // non-repeating timers) while iterating here is safe.
        for ((id, timer) in timers) {
            if (timer.target <= now) {
                due.add(timer)
                if (timer.repeats) {
                    timer.target = now + timer.interval
                } else {
                    timers.remove(id)
                }
            }
        }

        for (timer in due) {
            timer.callback()
        }
    }

    override fun createTimer(callback: () -> Unit, durationMs: Double, repeats: Boolean): Double {
        val interval = durationMs.toLong().coerceAtLeast(0)
        val id = nextId.getAndIncrement().toDouble()
        timers[id] = ScheduledTimer(
            callback = callback,
            interval = interval,
            repeats = repeats,
            target = System.currentTimeMillis() + interval,
        )
        return id
    }

    override fun deleteTimer(id: Double) {
        timers.remove(id)
    }
}
