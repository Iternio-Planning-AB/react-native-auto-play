package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.content.Intent
import android.content.res.Configuration
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.SessionInfo
import androidx.car.app.model.CarIcon
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.LifecycleEventListener
import com.margelo.nitro.NitroModules
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MapTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.AppInfo
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

class AndroidAutoSession(sessionInfo: SessionInfo) :
    Session() {

    private val isCluster = sessionInfo.displayType == SessionInfo.DISPLAY_TYPE_CLUSTER
    private val clusterId = if (isCluster) UUID.randomUUID().toString() else null
    private val moduleName = clusterId ?: ROOT_SESSION

    private fun getInitialTemplate(): Template {
        if (isCluster) {

            // clusters can not display any actions but still need one to not crash...
            val action =
                NitroAction(null, null, null, {}, NitroActionType.APPICON, null, null, null)

            // clusters can host NavigationTemplate only which is a MapTemplate on AutoPlay
            val config = MapTemplateConfig(
                moduleName,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                {},
                null,
                null,
                arrayOf(action),
                null,
                null
            )

            val template = MapTemplate(context = carContext, config, initNavigationManager = false)
            AndroidAutoTemplate.setTemplate(moduleName, template)

            return template.parse()
        }

        val appName = AppInfo.getApplicationLabel(carContext)

        return MessageTemplate.Builder(appName).apply {
            setIcon(CarIcon.APP_ICON)
        }.build()
    }

    override fun onCreateScreen(intent: Intent): Screen {
        val initialTemplate = getInitialTemplate()
        val screen = AndroidAutoScreen(carContext, moduleName, initialTemplate)

        sessions[moduleName] = ScreenContext(
            carContext = carContext, session = this, state = VisibilityState.DIDDISAPPEAR
        )

        clusterId?.let {
            clusterSessions.add(it)
        }

        lifecycle.addObserver(sessionLifecycleObserver)
        NitroModules.applicationContext?.addLifecycleEventListener(reactLifecycleObserver)

        if (clusterId == null) {
            HybridAutoPlay.emit(EventName.DIDCONNECT)
        } else {
            HybridCluster.emit(ClusterEventName.DIDCONNECTWITHWINDOW, clusterId)
        }

        return screen

        // TODO this is not required for templates that host a component, check if we need this for non-rendering templates
        /*
        val appRegistry = reactContext.getJSModule(AppRegistry::class.java)
            ?: throw ClassNotFoundException("could not get AppRegistry instance")
        val jsAppModuleName = if (isCluster) "AndroidAutoCluster" else "AndroidAuto"
        val appParams = WritableNativeMap().apply {
            putMap("initialProps", Arguments.createMap().apply {
                putString("id", clusterTemplateId)
            })
        }

        appRegistry.runApplication(jsAppModuleName, appParams)
        */
    }

    override fun onCarConfigurationChanged(configuration: Configuration) {
        val colorScheme = if (carContext.isDarkMode) ColorScheme.DARK else ColorScheme.LIGHT

        if (clusterId != null) {
            HybridCluster.emitColorScheme(clusterId, colorScheme)
            AndroidAutoScreen.getScreen(clusterId)?.applyConfigUpdate(invalidate = true)
            return
        }

        val marker = AndroidAutoScreen.getScreen(ROOT_SESSION)?.marker ?: return
        val config = AndroidAutoTemplate.getConfig(marker) as? MapTemplateConfig? ?: return

        if (config.onAppearanceDidChange != null) {
            config.onAppearanceDidChange(colorScheme)
        }

        AndroidAutoScreen.invalidateScreens()
    }

    override fun onNewIntent(intent: Intent) {
        val action = intent.action ?: return

        if (action == CarContext.ACTION_NAVIGATE) {
            intent.data?.schemeSpecificPart?.let { schemeSpecificPart ->
                try {
                    // Parse the geo URI format: lat,lon?q=query&mode=x&intent=y
                    val queryIndex = schemeSpecificPart.indexOf("?q=")

                    val location = if (queryIndex > 0) {
                        val coordinatesPart = schemeSpecificPart.substring(0, queryIndex)
                        parseCoordinates(coordinatesPart)
                    } else {
                        null
                    }

                    val query = if (queryIndex >= 0) {
                        val queryPart = schemeSpecificPart.substring(queryIndex + 3) // Skip "?q="
                        val additionalParamsIndex = queryPart.indexOf('&')

                        if (additionalParamsIndex >= 0) {
                            val rawQuery = queryPart.substring(0, additionalParamsIndex)
                            java.net.URLDecoder.decode(rawQuery, "UTF-8")
                        } else {
                            java.net.URLDecoder.decode(queryPart, "UTF-8")
                        }
                    } else {
                        java.net.URLDecoder.decode(schemeSpecificPart, "UTF-8")
                    }

                    HybridAutoPlay.emitVoiceInput(location, query)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse navigation intent: ${e.message}")
                }
            }
        }
    }

    /**
     * Parses coordinates from a string in format "lat,lon".
     * Returns null for invalid formats or 0,0 coordinates (which indicate "use geocoding").
     */
    private fun parseCoordinates(coordinatesPart: String): Location? {
        val parts = coordinatesPart.split(",")
        if (parts.size != 2) return null

        val lat = parts[0].toDoubleOrNull() ?: return null
        val lon = parts[1].toDoubleOrNull() ?: return null

        // Treat 0,0 as "no coordinates" - it means use geocoding for the query
        if (lat == 0.0 && lon == 0.0) {
            return null
        }

        return Location(lat, lon)
    }

    private val sessionLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onCreate(owner: LifecycleOwner) {
            sessions[moduleName]?.state = VisibilityState.WILLAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.WILLAPPEAR)
        }

        override fun onResume(owner: LifecycleOwner) {
            sessions[moduleName]?.state = VisibilityState.DIDAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.DIDAPPEAR)
        }

        override fun onPause(owner: LifecycleOwner) {
            sessions[moduleName]?.state = VisibilityState.WILLDISAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.WILLDISAPPEAR)
        }

        override fun onStop(owner: LifecycleOwner) {
            sessions[moduleName]?.state = VisibilityState.DIDDISAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.DIDDISAPPEAR)
        }

        override fun onDestroy(owner: LifecycleOwner) {
            sessions.remove(moduleName)
            clusterId?.let {
                HybridCluster.emit(ClusterEventName.DIDDISCONNECT, clusterId)
                clusterSessions.remove(it)
                return
            }

            HybridAutoPlay.emit(EventName.DIDDISCONNECT)
        }
    }

    private val reactLifecycleObserver = object : LifecycleEventListener {
        override fun onHostResume() {}

        override fun onHostPause() {}

        override fun onHostDestroy() {
            carContext.finishCarApp()
        }
    }

    data class ScreenContext(
        val carContext: CarContext, val session: AndroidAutoSession, var state: VisibilityState
    )

    companion object {
        const val TAG = "AndroidAutoSession"
        const val ROOT_SESSION = "AutoPlayRoot"

        private val sessions = ConcurrentHashMap<String, ScreenContext>()

        private val clusterSessions = CopyOnWriteArrayList<String>()

        fun getIsConnected(): Boolean {
            return sessions.containsKey(ROOT_SESSION)
        }

        fun getState(marker: String): VisibilityState? {
            return sessions[marker]?.state
        }

        fun getCarContext(marker: String): CarContext? {
            return sessions[marker]?.carContext
        }

        fun getRootContext(): CarContext? {
            return sessions[ROOT_SESSION]?.carContext
        }

        fun getClusterSessions(): Array<String> {
            return clusterSessions.toTypedArray()
        }
    }
}
