package com.margelo.nitro.at.g4rb4g3.autoplay

import android.content.Intent
import android.content.res.Configuration
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.SessionInfo
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.NavigationTemplate
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.ColorScheme
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.EventName
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.HybridAutoPlay
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.MapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.VisibilityState
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.AppInfo
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ReactContextResolver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID

class AndroidAutoSession(sessionInfo: SessionInfo, private val reactApplication: ReactApplication) :
    Session() {

    private val isCluster = sessionInfo.displayType == SessionInfo.DISPLAY_TYPE_CLUSTER
    private val clusterTemplateId = if (isCluster) UUID.randomUUID().toString() else null
    private val moduleName = clusterTemplateId ?: ROOT_SESSION

    private fun getInitialTemplate(): Template {
        if (isCluster) {
            return NavigationTemplate.Builder().apply {
                setActionStrip(ActionStrip.Builder().apply { addAction(Action.APP_ICON) }
                    .build()).build()
            }.build()
        }

        val appName = AppInfo.getApplicationLabel(carContext)

        return MessageTemplate.Builder(appName).apply {
            setIcon(CarIcon.APP_ICON)
        }.build()
    }

    override fun onCreateScreen(intent: Intent): Screen {
        val initialTemplate = getInitialTemplate()
        val screen = AndroidAutoScreen(carContext, moduleName, initialTemplate)

        sessions.put(
            moduleName, ScreenContext(
                carContext = carContext, session = this, state = VisibilityState.DIDDISAPPEAR
            )
        )

        clusterTemplateId?.let {
            clusterSessions.add(it)
        }

        lifecycle.addObserver(sessionLifecycleObserver)

        CoroutineScope(Dispatchers.Main).launch {
            reactContext = ReactContextResolver.getReactContext(reactApplication)
            reactContext.addLifecycleEventListener(reactLifecycleObserver)

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

            if (isCluster) {
                return@launch
            }

            HybridAutoPlay.emit(EventName.DIDCONNECT)
        }

        return screen
    }

    override fun onCarConfigurationChanged(configuration: Configuration) {
        val marker = AndroidAutoScreen.getScreen(ROOT_SESSION)?.marker ?: return
        val config = AndroidAutoTemplate.getConfig(marker) as MapTemplateConfig? ?: return

        if (config.onAppearanceDidChange != null) {
            val colorScheme = if (carContext.isDarkMode) ColorScheme.DARK else ColorScheme.LIGHT
            config.onAppearanceDidChange(colorScheme)
        }

        AndroidAutoScreen.invalidateScreens()
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
            VirtualRenderer.removeRenderer(moduleName)
            clusterTemplateId?.let {
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

        private lateinit var reactContext: ReactContext
        private val sessions = mutableMapOf<String, ScreenContext>()

        private val clusterSessions = mutableListOf<String>()

        fun getIsConnected(): Boolean {
            return sessions.containsKey(ROOT_SESSION)
        }

        fun getState(marker: String): VisibilityState? {
            return sessions[marker]?.state
        }

        fun getCarContext(marker: String): CarContext? {
            return sessions.get(marker)?.carContext
        }

        fun getRootContext(): CarContext? {
            return sessions[ROOT_SESSION]?.carContext
        }

        fun getClusterSessions(): Array<String> {
            return clusterSessions.toTypedArray()
        }
    }
}
