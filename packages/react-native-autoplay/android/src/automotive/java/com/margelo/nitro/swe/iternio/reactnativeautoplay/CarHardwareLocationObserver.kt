package com.margelo.nitro.swe.iternio.reactnativeautoplay

import androidx.car.app.CarContext

/** No-op on Android Automotive: the platform location providers already are the car's. */
object CarHardwareLocationObserver {
    @Suppress("UNUSED_PARAMETER")
    fun start(context: CarContext): Boolean = false

    fun stop() {}

    @Suppress("UNUSED_PARAMETER")
    fun replayStatus(callback: (CarLocation) -> Unit) {}
}
