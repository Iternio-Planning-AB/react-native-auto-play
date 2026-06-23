package com.margelo.nitro.swe.iternio.reactnativeautoplay

import androidx.car.app.CarContext
import androidx.car.app.hardware.CarHardwareManager
import androidx.car.app.hardware.common.CarValue
import androidx.car.app.hardware.common.OnCarDataAvailableListener
import androidx.car.app.hardware.info.EnergyLevel
import androidx.car.app.hardware.info.Mileage
import androidx.car.app.hardware.info.Model
import androidx.car.app.hardware.info.Speed
import androidx.car.app.versioning.CarAppApiLevels

object AndroidTelemetryObserver : TelemetryObserver() {
    private var carContext: CarContext? = null

    private val mModelListener = OnCarDataAvailableListener<Model> { model ->
        val name = if (model.name.status == CarValue.STATUS_SUCCESS) {
            model.name.value
        } else null

        val manufacturer = if (model.manufacturer.status == CarValue.STATUS_SUCCESS) {
            model.manufacturer.value
        } else null

        val year = if (model.year.status == CarValue.STATUS_SUCCESS) {
            model.year.value
        } else null

        telemetryHolder.updateVehicle(name, manufacturer, year, null)

        telemetryHolder.toTelemetry()?.let {
            telemetryCallbacks.forEach { callback ->
                callback(it)
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

    override fun startTelemetryObserver(): Boolean {
        val carContext = AndroidAutoSession.getRootContext() ?: throw IllegalArgumentException(
            "Car context not available, failed to start telemetry"
        )


        AndroidTelemetryObserver.carContext = carContext
        if (carContext.carAppApiLevel < CarAppApiLevels.LEVEL_3) {
            throw UnsupportedOperationException("Telemetry not supported for this API level ${carContext.carAppApiLevel}")
        }

        val carHardwareManager = carContext.getCarService(
            CarHardwareManager::class.java
        )
        val carInfo = carHardwareManager.carInfo

        // Request any single shot values.
        try {
            carInfo.fetchModel(telemetryExecutor, mModelListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        if (isObserverRunning) {
            // we stop here to not re-register multiple listeners
            // only the single shot values can be requested multiple times by registering another tlm listener on RN side
            return false
        }

        try {
            carInfo.addEnergyLevelListener(telemetryExecutor, mEnergyLevelListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        try {
            carInfo.addSpeedListener(telemetryExecutor, mSpeedListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }

        try {
            carInfo.addMileageListener(telemetryExecutor, mMileageListener)
        } catch (_: SecurityException) {
        } catch (_: NullPointerException) {
        }


        isObserverRunning = true
        return true
    }

    override fun stopTelemetryObserver() {
        if (!isObserverRunning) {
            return
        }

        isObserverRunning = false

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
    }
}