package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.location.Location
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.hardware.CarHardwareManager
import androidx.car.app.hardware.common.CarValue
import androidx.car.app.hardware.common.OnCarDataAvailableListener
import androidx.car.app.hardware.info.CarHardwareLocation
import androidx.car.app.hardware.info.CarSensors
import androidx.car.app.versioning.CarAppApiLevels
import java.util.concurrent.Executor

/**
 * Streams the head unit's own location (CarSensors), apart from the phone's location providers,
 * to HybridAutoPlay's car location listeners.
 */
object CarHardwareLocationObserver {
    private const val TAG = "CarHardwareLocation"

    // the context the listener is registered on, null while not registered
    private var carContext: CarContext? = null

    // the last non-success status, replayed to listeners added later; null while fixes arrive
    @Volatile
    private var lastStatus: CarLocationStatus? = null

    private val handler: Handler by lazy {
        Handler(HandlerThread("CarHardwareLocationThread").apply { start() }.looper)
    }
    private val executor = Executor { handler.post(it) }

    private val listener = OnCarDataAvailableListener<CarHardwareLocation> { carLocation ->
        val value = carLocation.location
        val location = value.value
        if (value.status != CarValue.STATUS_SUCCESS || location == null) {
            emitStatus(statusOf(value.status))
            return@OnCarDataAvailableListener
        }
        lastStatus = null
        HybridAutoPlay.emitCarLocation(location.toCarLocation(value.timestampMillis))
    }

    /**
     * Registers the listener on the given context unless it already is.
     * A failed registration is retried on the next call, e.g. after the location permission was granted.
     * @return true if a changed status was emitted to all listeners
     */
    @Synchronized
    fun start(context: CarContext): Boolean {
        if (carContext === context) {
            return false
        }
        // kept across the retry so a registration failing the same way again is not re-emitted
        val previousStatus = lastStatus
        stop()
        lastStatus = previousStatus
        if (context.carAppApiLevel < CarAppApiLevels.LEVEL_3) {
            return emitStatus(CarLocationStatus.UNSUPPORTEDAPILEVEL)
        }
        try {
            context.getCarService(CarHardwareManager::class.java).carSensors
                .addCarHardwareLocationListener(CarSensors.UPDATE_RATE_FASTEST, executor, listener)
            carContext = context
            lastStatus = null
        } catch (_: SecurityException) {
            return emitStatus(CarLocationStatus.PERMISSIONDENIED)
        } catch (e: Exception) {
            Log.w(TAG, "addCarHardwareLocationListener failed", e)
            return emitStatus(CarLocationStatus.ERROR)
        }
        return false
    }

    @Synchronized
    fun stop() {
        lastStatus = null
        val context = carContext ?: return
        carContext = null
        try {
            context.getCarService(CarHardwareManager::class.java).carSensors
                .removeCarHardwareLocationListener(listener)
        } catch (e: Exception) {
            Log.w(TAG, "removeCarHardwareLocationListener failed", e)
        }
    }

    fun replayStatus(callback: (CarLocation) -> Unit) {
        lastStatus?.let { callback(statusOnly(it)) }
    }

    private fun statusOf(status: Int) = when (status) {
        CarValue.STATUS_UNIMPLEMENTED -> CarLocationStatus.UNIMPLEMENTED
        CarValue.STATUS_UNAVAILABLE -> CarLocationStatus.UNAVAILABLE
        else -> CarLocationStatus.UNKNOWN
    }

    // the head unit keeps reporting e.g. unavailable on every update, only changes reach JS
    private fun emitStatus(status: CarLocationStatus): Boolean {
        if (status == lastStatus) {
            return false
        }
        lastStatus = status
        HybridAutoPlay.emitCarLocation(statusOnly(status))
        return true
    }

    private fun statusOnly(status: CarLocationStatus) = CarLocation(
        status = status,
        latitude = null,
        longitude = null,
        accuracy = null,
        altitude = null,
        speed = null,
        heading = null,
        timestamp = null,
        fixAgeMs = null,
        carValueAgeMs = null
    )

    // the ages are measured on the phone's monotonic clock, the head unit's wall clock can be far off
    private fun Location.toCarLocation(carValueTimestampMillis: Long): CarLocation {
        val now = SystemClock.elapsedRealtime()

        return CarLocation(
            status = CarLocationStatus.SUCCESS,
            latitude = latitude,
            longitude = longitude,
            accuracy = if (hasAccuracy()) accuracy.toDouble() else null,
            altitude = if (hasAltitude()) altitude else null,
            speed = if (hasSpeed()) speed.toDouble() else null,
            heading = if (hasBearing()) bearing.toDouble() else null,
            timestamp = time.toDouble(),
            fixAgeMs = if (elapsedRealtimeNanos > 0) {
                (now - elapsedRealtimeNanos / 1_000_000).toDouble()
            } else {
                null
            },
            carValueAgeMs = if (carValueTimestampMillis > 0) {
                (now - carValueTimestampMillis).toDouble()
            } else {
                null
            }
        )
    }
}
