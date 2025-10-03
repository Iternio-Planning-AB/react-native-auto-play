package com.margelo.nitro.at.g4rb4g3.autoplay

import android.content.Intent
import android.content.res.Configuration
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.ScreenManager
import androidx.car.app.Session
import androidx.car.app.SessionInfo
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.appregistry.AppRegistry
import com.margelo.nitro.at.g4rb4g3.autoplay.template.MapTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.TemplateStore
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ReactContextResolver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.UUID
import java.util.WeakHashMap

class AndroidAutoSession(sessionInfo: SessionInfo, private val reactApplication: ReactApplication) :
    Session() {

    private val isCluster = sessionInfo.displayType == SessionInfo.DISPLAY_TYPE_CLUSTER
    private val clusterTemplateId = if (isCluster) UUID.randomUUID().toString() else null
    private val marker = clusterTemplateId ?: ROOT_SESSION

    override fun onCreateScreen(intent: Intent): Screen {
        val screen = AndroidAutoScreen(carContext, isCluster, marker)

        sessions.put(
            marker, ScreenContext(carContext = carContext, session = this, state = VisibilityState.DIDDISAPPEAR)
        )

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
        val template = TemplateStore.getTemplate(marker) ?: return

        if (template is MapTemplate && template.config.onAppearanceDidChange != null) {
            val colorScheme = if (carContext.isDarkMode) ColorScheme.DARK else ColorScheme.LIGHT
            template.config.onAppearanceDidChange(colorScheme)
        }
    }

    private val sessionLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onCreate(owner: LifecycleOwner) {
            sessions[marker]?.state = VisibilityState.WILLAPPEAR
            HybridAutoPlay.emitRenderState(marker, VisibilityState.WILLAPPEAR)
        }

        override fun onResume(owner: LifecycleOwner) {
            sessions[marker]?.state = VisibilityState.DIDAPPEAR
            HybridAutoPlay.emitRenderState(marker, VisibilityState.DIDAPPEAR)
        }

        override fun onPause(owner: LifecycleOwner) {
            sessions[marker]?.state = VisibilityState.WILLDISAPPEAR
            HybridAutoPlay.emitRenderState(marker, VisibilityState.WILLDISAPPEAR)
        }

        override fun onStop(owner: LifecycleOwner) {
            sessions[marker]?.state = VisibilityState.DIDDISAPPEAR
            HybridAutoPlay.emitRenderState(marker, VisibilityState.DIDDISAPPEAR)
        }

        override fun onDestroy(owner: LifecycleOwner) {
            sessions.remove(marker)

            if (isCluster) {
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
        private val sessions: WeakHashMap<String, ScreenContext> = WeakHashMap(4, 0.5f)

        fun getIsConnected(): Boolean {
            return sessions[ROOT_SESSION] != null
        }

        fun getState(marker: String): VisibilityState? {
            return sessions[marker]?.state
        }

        fun getCarContext(marker: String): CarContext? {
            return sessions.get(marker)?.carContext
        }

        fun getRootContext(): CarContext? {
            return sessions.get(ROOT_SESSION)?.carContext
        }
    }
}