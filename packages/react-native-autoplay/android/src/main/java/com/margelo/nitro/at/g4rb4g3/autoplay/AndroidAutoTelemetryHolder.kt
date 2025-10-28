package com.margelo.nitro.at.g4rb4g3.autoplay

import androidx.car.app.hardware.common.CarValue
import androidx.car.app.hardware.info.Model
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NumericTelemetryItem
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.StringTelemetryItem
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.Telemetry
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.VehicleTelemetryItem
import kotlin.math.abs

class AndroidAutoTelemetryHolder {
    private var isDirty = false
    private val lock = Any()

    private var batteryLevel: Float? = null
    private var batteryLevelTimestamp: Int? = null

    private var fuelLevel: Float? = null
    private var fuelLevelTimestamp: Int? = null

    private var range: Float? = null
    private var rangeTimestamp: Int? = null

    private var speed: Float? = null
    private var speedTimestamp: Int? = null

    private var odometer: Float? = null
    private var odometerTimestamp: Int? = null

    private var name: String? = null
    private var manufacturer: String? = null
    private var year: Int? = null

    fun updateVehicle(model: Model) = synchronized(lock) {
        name = if (model.name.status == CarValue.STATUS_SUCCESS) {
            model.name.value
        } else null

        manufacturer = if (model.manufacturer.status == CarValue.STATUS_SUCCESS) {
            model.manufacturer.value
        } else null

        year = if (model.year.status == CarValue.STATUS_SUCCESS) {
            model.year.value
        } else null

        isDirty = true
    }

    fun updateBatteryLevel(value: Float) = synchronized(lock) {
        if (batteryLevel == value) {
            return
        }

        batteryLevel = value
        batteryLevelTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateFuelLevel(value: Float) = synchronized(lock) {
        if (fuelLevel == value) {
            return
        }

        fuelLevel = value
        fuelLevelTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateRange(value: Float) = synchronized(lock) {
        if (range == value) {
            return
        }

        range = value
        rangeTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateSpeed(value: Float?) = synchronized(lock) {
        if (speed == value) {
            return
        }

        speed = value
        speedTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateOdometer(value: Float?) = synchronized(lock) {
        if (odometer == value) {
            return
        }

        odometer = value
        odometerTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun toTelemetry(): Telemetry? {
        synchronized(lock) {
            if (!isDirty) {
                return null
            }

            isDirty = false

            return Telemetry(
                batteryLevel = createNumericTelemetryItem(batteryLevel, batteryLevelTimestamp),
                fuelLevel = createNumericTelemetryItem(fuelLevel, fuelLevelTimestamp),
                range = createNumericTelemetryItem(range, rangeTimestamp),
                speed = createNumericTelemetryItem(speed, speedTimestamp),
                odometer = createNumericTelemetryItem(odometer, odometerTimestamp),
                vehicle = VehicleTelemetryItem(
                    name = createStringTelemetryItem(name),
                    manufacturer = createStringTelemetryItem(manufacturer),
                    year = createNumericTelemetryItem(year?.toFloat(), 0)
                )
            )
        }
    }
}

private fun createNumericTelemetryItem(value: Float?, timestamp: Int?): NumericTelemetryItem? {
    if (value == null || timestamp == null) {
        return null
    }

    return NumericTelemetryItem(timestamp.toDouble(), value.toDouble())
}

private fun createStringTelemetryItem(value: String?): StringTelemetryItem? {
    if (value == null) {
        return null
    }

    return StringTelemetryItem(0.0, value)
}