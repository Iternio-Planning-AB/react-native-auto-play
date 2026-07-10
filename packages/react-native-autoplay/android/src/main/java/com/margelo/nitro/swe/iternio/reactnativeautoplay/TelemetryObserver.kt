package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.os.Handler
import android.os.HandlerThread
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.Executor

abstract class TelemetryObserver {
    abstract fun startTelemetryObserver(): Boolean
    abstract fun stopTelemetryObserver()

    var telemetryCallbacks: MutableList<(Telemetry?) -> Unit> = CopyOnWriteArrayList()
    val telemetryHolder = AndroidAutoTelemetryHolder()
    var isObserverRunning = false
    val handler: Handler
    val telemetryExecutor: Executor

    init {
        val thread = HandlerThread("AndroidTelemetryThread")
        thread.start()
        handler = Handler(thread.looper)

        telemetryExecutor = Executor { command ->
            handler.post(command)
        }
    }

    fun addListener(callback: (Telemetry?) -> Unit): () -> Unit {
        telemetryCallbacks.add(callback)

        // start is called every time a new listener is registered, so the single shot values are still requested and returned immediately
        val isInitialStart = startTelemetryObserver()

        if (isInitialStart) {
            handler.post(emitter)
        }

        return {
            telemetryCallbacks.remove(callback)

            if (telemetryCallbacks.isEmpty()) {
                stopTelemetryObserver()
                handler.removeCallbacks(emitter)
            }
        }
    }

    fun emit(tlm: Telemetry) {
        telemetryCallbacks.forEach { callback ->
            callback(tlm)
        }
    }

    private val emitter = object : Runnable {
        override fun run() {
            telemetryHolder.toTelemetry()?.let {
                emit(it)
            }
            handler.postDelayed(this, BuildConfig.TELEMETRY_UPDATE_INTERVAL)
        }
    }
}
