package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.os.Handler
import android.os.Looper
import androidx.car.app.ScreenManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.ActionStripConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.PointOfInterestScreen
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

/**
 * Bridges JS's [PointOfInterestTemplate] to a native [PointOfInterestScreen]
 * ([androidx.car.app.model.PlaceListMapTemplate]) on Android Auto.
 */
class PointOfInterestModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "PointOfInterestModule"
    }

    override fun getName() = NAME

    private val activeScreens = ConcurrentHashMap<String, PointOfInterestScreen>()

    @ReactMethod
    fun push(params: ReadableMap, promise: Promise) {
        val carContext = AndroidAutoSession.getRootContext()
            ?: return promise.reject("NO_CAR_CONTEXT", "Android Auto not connected")
        val templateId = params.getString("id") ?: UUID.randomUUID().toString()
        val title = params.getString("title") ?: ""
        val itemsArray = params.getArray("items")
        val items = if (itemsArray != null) PointOfInterestScreen.parseItems(itemsArray) else emptyList()
        val actionStripConfig = parseActionStripConfig(params)
        val screen = PointOfInterestScreen(carContext, title, items, reactApplicationContext, templateId, actionStripConfig)
        activeScreens[templateId] = screen
        Handler(Looper.getMainLooper()).post {
            try {
                carContext.getCarService(ScreenManager::class.java).push(screen)
                promise.resolve(templateId)
            } catch (e: Exception) {
                activeScreens.remove(templateId)
                promise.reject("PUSH_ERROR", e.message ?: "Failed to push template")
            }
        }
    }

    @ReactMethod
    fun update(params: ReadableMap, promise: Promise) {
        val templateId = params.getString("id")
            ?: return promise.reject("INVALID", "Missing templateId")
        val screen = activeScreens[templateId]
            ?: return promise.reject("NOT_FOUND", "Template not found: $templateId")
        val itemsArray = if (params.hasKey("items")) params.getArray("items") else null
        if (itemsArray != null) {
            screen.updateItems(PointOfInterestScreen.parseItems(itemsArray))
        }
        if (params.hasKey("actionStrip")) {
            screen.updateActionStrip(parseActionStripConfig(params))
        }
        promise.resolve(null)
    }

    private fun parseActionStripConfig(params: ReadableMap): ActionStripConfig? {
        if (!params.hasKey("actionStrip") || params.isNull("actionStrip")) return null
        val map = params.getMap("actionStrip") ?: return null
        val label = map.getString("label") ?: return null
        return ActionStripConfig(label, map.getString("toastMessage") ?: "")
    }

    @ReactMethod
    fun pop(params: ReadableMap, promise: Promise) {
        val templateId = params.getString("id") ?: return promise.reject("INVALID", "Missing id")
        activeScreens.remove(templateId)
        val carContext = AndroidAutoSession.getRootContext()
            ?: return promise.reject("NO_CAR_CONTEXT", "Android Auto not connected")
        Handler(Looper.getMainLooper()).post {
            try {
                carContext.getCarService(ScreenManager::class.java).pop()
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("POP_ERROR", e.message ?: "Failed to pop template")
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
