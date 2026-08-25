package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class ReactNativeAutoPlayPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
        when (name) {
            PointOfInterestModule.NAME -> PointOfInterestModule(reactContext)
            else -> null
        }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
        ReactModuleInfoProvider {
            hashMapOf(
                PointOfInterestModule.NAME to ReactModuleInfo(
                    PointOfInterestModule.NAME, PointOfInterestModule.NAME,
                    false, false, false, false
                ),
            )
        }

    companion object {
        init {
            ReactNativeAutoPlayOnLoad.initializeNative()
        }
    }
}