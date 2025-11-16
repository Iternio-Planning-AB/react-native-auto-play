package com.margelo.nitro.swe.iternio.reactnativeautoplay

class HybridAndroidAutoTelemetry : HybridAndroidAutoTelemetrySpec() {
    override fun registerTelemetryListener(callback: (Telemetry?, String?) -> Unit): () -> Unit {
        return AndroidAutoTelemetryObserver.addListener(callback)
    }
}