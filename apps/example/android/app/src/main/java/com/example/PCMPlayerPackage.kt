package com.example

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class PCMPlayerPackage : TurboReactPackage() {
    override fun getModule(
        name: String,
        context: ReactApplicationContext,
    ): NativeModule? = if (name == PCMPlayerModule.NAME) PCMPlayerModule(context) else null

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            PCMPlayerModule.NAME to ReactModuleInfo(
                PCMPlayerModule.NAME,
                PCMPlayerModule.NAME,
                false,
                false,
                false,
                false,
                false,
            ),
        )
    }
}
