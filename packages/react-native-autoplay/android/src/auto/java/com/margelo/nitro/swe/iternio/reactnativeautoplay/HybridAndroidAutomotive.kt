package com.margelo.nitro.swe.iternio.reactnativeautoplay

class InvalidPlatformException(message: String) : Exception(message)

class HybridAndroidAutomotive : HybridAndroidAutomotiveSpec() {
    override fun registerCarUxRestrictionsListener(callback: (restrictions: ActiveCarUxRestrictions) -> Unit): () -> Unit {
        throw InvalidPlatformException("registerCarUxRestrictionsListener is supported on Android Automotive only!")
    }

    override fun getCarUxRestrictions(): ActiveCarUxRestrictions {
        throw InvalidPlatformException("getCarUxRestrictions is supported on Android Automotive only!")
    }

    override fun registerAppFocusListener(callback: (state: AppFocusState) -> Unit): () -> Unit {
        throw InvalidPlatformException("registerAppFocusListener is supported on Android Automotive only!")
    }

    override fun getAppFocusState(): AppFocusState {
        throw InvalidPlatformException("getAppFocusState is supported on Android Automotive only!")
    }

    override fun requestAppFocus(): () -> Unit {
        throw InvalidPlatformException("requestAppFocus is supported on Android Automotive only!")
    }
}
