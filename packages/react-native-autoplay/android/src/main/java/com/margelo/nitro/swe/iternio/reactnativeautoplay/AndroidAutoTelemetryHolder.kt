package com.margelo.nitro.swe.iternio.reactnativeautoplay

import kotlin.math.floor

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

    private var selectedGear: Int? = null
    private var selectedGearTimestamp: Int? = null

    private var envOutsideTemperature: Float? = null
    private var envOutsideTemperatureTimestamp: Int? = null

    private var evChargePortConnected: Boolean? = null
    private var evChargePortConnectedTimestamp: Int? = null

    private var evBatteryInstantaneousChargeRate: Float? = null
    private var evBatteryInstantaneousChargeRateTimeStamp: Int? = null

    private var parkingBrakeOn: Boolean? = null
    private var parkingBrakeOnTimestamp: Int? = null

    private var soe: Float? = null
    private var soeTimestamp: Int? = null

    private var name: String? = null
    private var manufacturer: String? = null
    private var year: Int? = null
    private var batteryCapacity: Float? = null

    fun updateVehicle(name: String?, manufacturer: String?, year: Int?, batteryCapacity: Float?) =
        synchronized(lock) {
            this.name = name
            this.manufacturer = manufacturer
            this.year = year
            this.batteryCapacity = batteryCapacity

            isDirty = true
        }

    fun updateBatteryLevel(value: Float) = synchronized(lock) {
        batteryLevel = value
        batteryLevelTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateFuelLevel(value: Float) = synchronized(lock) {
        fuelLevel = value
        fuelLevelTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateRange(value: Float) = synchronized(lock) {
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

    fun updateSelectedGear(value: Int?) = synchronized(lock) {
        selectedGear = value
        selectedGearTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateEnvOutsideTemperature(value: Float?) = synchronized(lock) {
        envOutsideTemperature = value
        envOutsideTemperatureTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateEvChargePortConnected(value: Boolean?) = synchronized(lock) {
        evChargePortConnected = value
        evChargePortConnectedTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateEvBatteryInstantaneousChargeRate(value: Float?) = synchronized(lock) {
        evBatteryInstantaneousChargeRate = value
        evBatteryInstantaneousChargeRateTimeStamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateParkingBrakeOn(value: Boolean?) = synchronized(lock) {
        parkingBrakeOn = value
        parkingBrakeOnTimestamp = (System.currentTimeMillis() / 1000L).toInt()
        isDirty = true
    }

    fun updateBatteryLevel(levelWh: Float, capacityWh: Float) = synchronized(lock) {
        if (soe == levelWh) {
            soeTimestamp = (System.currentTimeMillis() / 1000L).toInt()
            batteryLevelTimestamp = soeTimestamp

            isDirty = true
            return
        }

        if (capacityWh <= 0f) {
            throw Exception("got invalid battery capacity $capacityWh")
        }

        val soc = levelWh / capacityWh * 100
        if (!soc.isFinite() || floor(soc) < 0 || floor(soc) > 100) {
            throw Exception("got invalid soc $soc, expecting value from 0 to 100 EV_BATTERY_LEVEL: $levelWh, evBatteryCapacity: $capacityWh")
        }

        soe = levelWh
        batteryLevel = soc

        val timestamp = (System.currentTimeMillis() / 1000L).toInt()
        soeTimestamp = timestamp
        batteryLevelTimestamp = timestamp

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
                selectedGear = createNumericTelemetryItem(selectedGear, selectedGearTimestamp),
                parkingBrakeOn = createBooleanTelemetryItem(
                    parkingBrakeOn, parkingBrakeOnTimestamp
                ),
                envOutsideTemperature = createNumericTelemetryItem(
                    envOutsideTemperature, envOutsideTemperatureTimestamp
                ),
                evChargePortConnected = createBooleanTelemetryItem(
                    evChargePortConnected, evChargePortConnectedTimestamp
                ),
                evBatteryInstantaneousChargeRate = createNumericTelemetryItem(
                    evBatteryInstantaneousChargeRate, evBatteryInstantaneousChargeRateTimeStamp
                ),
                soe = createNumericTelemetryItem(
                    soe, soeTimestamp
                ),
                vehicle = VehicleTelemetryItem(
                    name = createStringTelemetryItem(name),
                    manufacturer = createStringTelemetryItem(manufacturer),
                    year = createNumericTelemetryItem(year?.toFloat(), 0),
                    batteryCapacity = createNumericTelemetryItem(batteryCapacity, 0)
                )
            )
        }
    }
}

private fun <T : Number> createNumericTelemetryItem(
    value: T?, timestamp: Int?
): NumericTelemetryItem? {
    if (value == null || timestamp == null) {
        return null
    }

    return NumericTelemetryItem(timestamp.toDouble(), value.toDouble())
}

private fun createStringTelemetryItem(value: String?, timestamp: Int = 0): StringTelemetryItem? {
    if (value == null) {
        return null
    }

    return StringTelemetryItem(timestamp.toDouble(), value)
}

private fun createBooleanTelemetryItem(value: Boolean?, timestamp: Int?): BooleanTelemetryItem? {
    if (value == null) {
        return null
    }

    return BooleanTelemetryItem(timestamp?.toDouble() ?: 0.0, value)
}
