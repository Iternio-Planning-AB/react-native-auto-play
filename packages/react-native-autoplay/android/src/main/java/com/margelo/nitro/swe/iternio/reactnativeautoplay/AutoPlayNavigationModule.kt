package com.margelo.nitro.swe.iternio.reactnativeautoplay

import androidx.car.app.CarContext
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Starts Android Auto navigation via [CarContext.ACTION_NAVIGATE], for apps that need to
 * trigger navigation from JS while running headless in a `CarAppService` — a plain
 * `Linking.openURL` can't work there since it internally requires an Activity context.
 */
class AutoPlayNavigationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AutoPlayNavigation"
    }

    override fun getName() = NAME

    @ReactMethod
    fun navigate(lat: Double, long: Double, label: String, promise: Promise) {
        val carContext = AndroidAutoSession.getRootContext()
            ?: return promise.reject("NO_CAR_CONTEXT", "Android Auto not connected")
        try {
            val encodedLabel = android.net.Uri.encode(label)
            val uri = android.net.Uri.parse("geo:$lat,$long?q=$encodedLabel")
            val intent = android.content.Intent(CarContext.ACTION_NAVIGATE, uri)
            carContext.startCarApp(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("NAVIGATE_ERROR", e.message ?: "Navigation failed")
        }
    }
}
