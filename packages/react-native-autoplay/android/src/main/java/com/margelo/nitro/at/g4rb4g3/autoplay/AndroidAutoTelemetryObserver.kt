package com.margelo.nitro.at.g4rb4g3.autoplay


import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.hardware.CarHardwareManager
import androidx.car.app.hardware.common.CarValue
import androidx.car.app.hardware.common.OnCarDataAvailableListener
import androidx.car.app.hardware.info.EnergyLevel
import androidx.car.app.hardware.info.Mileage
import androidx.car.app.hardware.info.Model
import androidx.car.app.hardware.info.Speed
import androidx.car.app.versioning.CarAppApiLevels
import androidx.core.content.ContextCompat
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.Telemetry
import com.margelo.nitro.autoplay.BuildConfig

object AndroidAutoTelemetryObserver {
    private var telemetryCallbacks: MutableList<(telemetry: Telemetry?, error: String?) -> Unit> =
        ArrayList();

    private var isRunning = false
    private var carContext: CarContext? = null

    private val telemetryHolder = AndroidAutoTelemetryHolder()
    private val handler = Handler(Looper.getMainLooper())

    private val mModelListener = OnCarDataAvailableListener<Model> {
        telemetryHolder.updateVehicle(it)

        val tlm = telemetryHolder.toTelemetry()
        tlm?.let {
            telemetryCallbacks.forEach { callback ->
                callback(tlm, null)
            }
        }
    }

    private val mEnergyLevelListener = OnCarDataAvailableListener<EnergyLevel> { carEnergyLevel ->
        if (carEnergyLevel.batteryPercent.status == CarValue.STATUS_SUCCESS) {
            carEnergyLevel.batteryPercent.value?.let {
                telemetryHolder.updateBatteryLevel(it)
            }
        }

        if (carEnergyLevel.fuelPercent.status == CarValue.STATUS_SUCCESS) {
            carEnergyLevel.fuelPercent.value?.let {
                telemetryHolder.updateFuelLevel(it)
            }
        }

        if (carEnergyLevel.rangeRemainingMeters.status == CarValue.STATUS_SUCCESS) {
            carEnergyLevel.rangeRemainingMeters.value?.let {
                telemetryHolder.updateRange(it.div(1000f)) //m->km
            }
        }
    }

    private val mSpeedListener = OnCarDataAvailableListener<Speed> { carSpeed ->
        if (carSpeed.displaySpeedMetersPerSecond.status == CarValue.STATUS_SUCCESS) {
            telemetryHolder.updateSpeed(carSpeed.displaySpeedMetersPerSecond.value?.times(3.6f)) //m/s->km/h
        }
    }

    private val mMileageListener = OnCarDataAvailableListener<Mileage> { carMileage ->
        if (carMileage.odometerMeters.status == CarValue.STATUS_SUCCESS) {
            // although this property is called Meters, it is actually km, see https://android-review.googlesource.com/c/platform/frameworks/support/+/3490009
            // will be fixed properly with 1.8.0
            telemetryHolder.updateOdometer(carMileage.odometerMeters.value)
        }
    }

    private val emitter = object : Runnable {
        override fun run() {
            val tlm = telemetryHolder.toTelemetry()

            if (tlm != null) {
                telemetryCallbacks.forEach { callback ->
                    callback(tlm, null)
                }
            }

            handler.postDelayed(this, BuildConfig.TELEMETRY_UPDATE_INTERVAL)
        }
    }

    fun addListener(callback: (Telemetry?, String?) -> Unit): () -> Unit {
        telemetryCallbacks.add(callback)


        // start is called every time a new listener is registered, so the single shot values are still requested and returned immediately
        try {
            startTelemetryObserver()
        } catch (err: Exception) {
            callback(null, err.message)
        }


        return {
            telemetryCallbacks.remove(callback)
            if (telemetryCallbacks.isEmpty()) {
                stopTelemetryObserver()
            }
        }
    }


    fun startTelemetryObserver(
    ) {
        val carContext =
            AndroidAutoSession.Companion.getCarContext(AndroidAutoSession.Companion.ROOT_SESSION)
                ?: throw IllegalArgumentException(
                    "Car context not available, failed to start telemetry"
                )


        AndroidAutoTelemetryObserver.carContext = carContext
        if (carContext.carAppApiLevel < CarAppApiLevels.LEVEL_3) {
            throw UnsupportedOperationException("Telemetry not supported for this API level ${carContext.carAppApiLevel}")
        }

        val carHardwareExecutor = ContextCompat.getMainExecutor(carContext)

        val carHardwareManager = carContext.getCarService(
            CarHardwareManager::class.java
        )
        val carInfo = carHardwareManager.carInfo

        // Request any single shot values.
        try {
            carInfo.fetchModel(carHardwareExecutor, mModelListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        if (isRunning) {
            // we stop here to not re-register multiple listeners, only the single shot values can be requested multiple times by registering another tlm listener on RN side
            Log.d(
                AndroidAutoTelemetryObserver.javaClass.name,
                "Telemetry observer is already running"
            )
            return
        }

        try {
            carInfo.addEnergyLevelListener(carHardwareExecutor, mEnergyLevelListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        try {
            carInfo.addSpeedListener(carHardwareExecutor, mSpeedListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        try {
            carInfo.addMileageListener(carHardwareExecutor, mMileageListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        handler.post(emitter)

        isRunning = true

        Log.d(AndroidAutoTelemetryObserver.javaClass.name, "Telemetry observer started")
    }

    fun stopTelemetryObserver() {
        if (!isRunning) {
            return
        }

        isRunning = false

        carContext?.let {
            val carHardwareManager = it.getCarService(
                CarHardwareManager::class.java
            )
            val carInfo = carHardwareManager.carInfo

            try {
                carInfo.removeEnergyLevelListener(mEnergyLevelListener)
            } catch (_: SecurityException) {
            }

            try {
                carInfo.removeSpeedListener(mSpeedListener)
            } catch (_: SecurityException) {
            }

            try {
                carInfo.removeMileageListener(mMileageListener)
            } catch (_: SecurityException) {
            }
        }

        handler.removeCallbacks(emitter)
    }
}
