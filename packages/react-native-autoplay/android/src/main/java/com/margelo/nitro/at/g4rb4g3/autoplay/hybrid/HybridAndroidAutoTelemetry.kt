package com.margelo.nitro.at.g4rb4g3.autoplay.hybrid

import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoTelemetryObserver

class HybridAndroidAutoTelemetry : HybridHybridAndroidAutoTelemetrySpec() {
    override fun registerTelemetryListener(callback: (Telemetry?, String?) -> Unit): () -> Unit {
        return AndroidAutoTelemetryObserver.addListener(callback)
    }
}