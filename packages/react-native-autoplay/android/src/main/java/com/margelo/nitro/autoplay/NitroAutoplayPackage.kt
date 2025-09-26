package com.margelo.nitro.autoplay

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.TurboReactPackage
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAutoplayOnLoad

class NitroAutoplayPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? = null

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider = ReactModuleInfoProvider { HashMap() }

    companion object {
        init {
            NitroAutoplayOnLoad.initializeNative()
        }
    }
}
