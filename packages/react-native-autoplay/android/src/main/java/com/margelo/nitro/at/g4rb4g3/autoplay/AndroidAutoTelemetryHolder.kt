package com.margelo.nitro.at.g4rb4g3.autoplay

import androidx.car.app.hardware.common.CarValue
import androidx.car.app.hardware.info.Model
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NumericTelemetryItem
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.StringTelemetryItem
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.Telemetry
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.VehicleTelemetryItem

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
    private var year: Int? = null;

    fun updateVehicle(model: Model) = synchronized(lock) {
        name = if (model.name.status == CarValue.STATUS_SUCCESS) {
            model.name.value ?: null
        } else null

        manufacturer = if (model.manufacturer.status == CarValue.STATUS_SUCCESS) {
            model.manufacturer.value ?: null
        } else null

        year = if (model.year.status == CarValue.STATUS_SUCCESS) {
            model.year.value ?: null
        } else null

        isDirty = true
    }

    fun updateBatteryLevel(value: Float?) = synchronized(lock) {
        batteryLevel = value
        batteryLevelTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateFuelLevel(value: Float?) = synchronized(lock) {
        fuelLevel = value
        fuelLevelTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateRange(value: Float?) = synchronized(lock) {
        range = value
        rangeTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateSpeed(value: Float?) = synchronized(lock) {
        speed = value
        speedTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateOdometer(value: Float?) = synchronized(lock) {
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
                    name = createStringTelemetryItem(name, 0),
                    manufacturer = createStringTelemetryItem(manufacturer, 0),
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

private fun createStringTelemetryItem(value: String?, timestamp: Int?): StringTelemetryItem? {
    if (value == null || timestamp == null) {
        return null
    }

    return StringTelemetryItem(timestamp.toDouble(), value)
}