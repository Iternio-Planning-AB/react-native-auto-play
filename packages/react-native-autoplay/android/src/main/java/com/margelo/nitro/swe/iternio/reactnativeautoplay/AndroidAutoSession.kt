package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.content.Intent
import android.content.res.Configuration
import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.SessionInfo
import androidx.car.app.isTornDown
import androidx.car.app.model.CarIcon
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.bridge.LifecycleEventListener
import com.margelo.nitro.NitroModules
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MapTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.AppInfo
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.NavigationIntentParser
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.TemplateUpdateQueue
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.atomic.AtomicInteger

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
            // named arguments, nitrogen reorders the generated fields whenever the spec changes
            val config = MapTemplateConfig(
                id = moduleName,
                onWillAppear = null,
                onWillDisappear = null,
                onDidAppear = null,
                onDidDisappear = null,
                onPopped = null,
                autoDismissMs = null,
                onDidChangePanningInterface = null,
                visibleTravelEstimate = null,
                hideControls = null,
                onDidPan = null,
                onDidUpdateZoomGestureWithCenter = null,
                onClick = null,
                onDoubleClick = null,
                onAppearanceDidChange = null,
                onStopNavigation = {},
                onAutoDriveEnabled = null,
                mapButtons = null,
                headerActions = arrayOf(action),
                defaultGuidanceBackgroundColor = null,
                panButtonScrollPercentage = null
            )

            val template = MapTemplate(context = carContext, config, initNavigationManager = false)
            AndroidAutoTemplate.setTemplate(moduleName, template)

            return template.render()
        }

        val appName = AppInfo.getApplicationLabel(carContext)

        return MessageTemplate.Builder(appName).apply {
            setIcon(CarIcon.APP_ICON)
        }.build()
    }

    override fun onCreateScreen(intent: Intent): Screen {
        val initialTemplate = getInitialTemplate()
        val screen = AndroidAutoScreen(carContext, moduleName, initialTemplate)
        // clusters hold no templates, only the head unit session needs an id
        val sessionId = if (clusterId == null) lastSessionId.incrementAndGet() else null

        sessions[moduleName] = ScreenContext(
            carContext = carContext,
            session = this,
            state = VisibilityState.DIDDISAPPEAR,
            sessionId = sessionId
        )

        clusterId?.let {
            clusterSessions.addIfAbsent(it)
        }

        lifecycle.addObserver(sessionLifecycleObserver)
        NitroModules.applicationContext?.addLifecycleEventListener(reactLifecycleObserver)

        if (clusterId != null) {
            HybridCluster.emit(ClusterEventName.DIDCONNECTWITHWINDOW, clusterId)
        } else if (sessionId != null) {
            HybridAutoPlay.emit(EventName.DIDCONNECT, sessionId)
            if (HybridAutoPlay.hasCarLocationListeners()) {
                CarHardwareLocationObserver.start(carContext)
            }
        }

        handleNavigationIntent(intent)

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

        // This display's native backdrop (root or cluster) must follow the car's day/night
        // (car-app quality MR-1). Forwarded before the early returns below — the root template
        // may not be a MapTemplate yet (e.g. a pre-trip MessageTemplate) and must still switch.
        VirtualRenderer.onColorSchemeChanged(moduleName, carContext.isDarkMode)

        if (clusterId != null) {
            HybridCluster.emitColorScheme(clusterId, colorScheme)
            TemplateUpdateQueue.post {
                AndroidAutoScreen.getScreen(clusterId)?.applyConfigUpdate(invalidate = true)
            }
            return
        }

        val marker = AndroidAutoScreen.getScreen(ROOT_SESSION)?.marker ?: return
        val config = AndroidAutoTemplate.getConfig(marker) as? MapTemplateConfig? ?: return

        if (config.onAppearanceDidChange != null) {
            config.onAppearanceDidChange(colorScheme)
        }

        TemplateUpdateQueue.post { AndroidAutoScreen.invalidateScreens() }
    }

    override fun onNewIntent(intent: Intent) {
        handleNavigationIntent(intent)
    }

    /**
     * NAVIGATE carries either a destination (geo:) or a custom action (act parameter, see
     * NavigationIntentParser.parseAction). On Android Automotive the car Assistant sends custom
     * actions as Google documents them, VIEW geo.action:?act=<name>, to CarAppActivity, which
     * passes the intent on to the session. A VIEW geo: intent is a search ("find charging
     * stations"), reported with the search intent type.
     * NAVIGATE arrives in onCreateScreen when it starts the session (cold start, e.g. by voice
     * with the app not running) and in onNewIntent while the session runs.
     */
    private fun handleNavigationIntent(intent: Intent) {
        if (isCluster) {
            return
        }
        val data = intent.data ?: return
        val isView = intent.action == Intent.ACTION_VIEW
        val isGeoAction = isView && data.scheme == "geo.action"
        val isSearch = isView && data.scheme == "geo"
        if (intent.action != CarContext.ACTION_NAVIGATE && !isGeoAction && !isSearch) {
            return
        }

        try {
            val action = NavigationIntentParser.parseAction(data.toString())
            if (action != null) {
                HybridAndroidAutoNavigation.emitNavigationAction(action)
                return
            }
            // the host forwards Assistant intents it could not convert, e.g. google.maps:// URLs
            if (data.scheme != "geo") {
                Log.w(TAG, "Ignoring navigation intent with unsupported data: $data")
                return
            }
            val navigationIntent =
                NavigationIntentParser.parse(data.encodedSchemeSpecificPart ?: "", isSearch)
            // nothing to navigate to, and it must not replace a pending cold-start intent
            if (navigationIntent.location == null && navigationIntent.query == null) {
                Log.w(TAG, "Ignoring navigation intent without location and query: $data")
                return
            }
            HybridAndroidAutoNavigation.emitNavigationIntent(navigationIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse navigation intent: ${e.message}")
        }
    }

    /**
     * Sessions are keyed by module name only: once a new session for the same name registered, the
     * lifecycle of this (ended) one must neither change its state, report it disconnected nor drop it.
     */
    private fun isCurrentSession(): Boolean {
        return sessions[moduleName]?.carContext === carContext
    }

    private val sessionLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onCreate(owner: LifecycleOwner) {
            if (!isCurrentSession()) {
                return
            }
            sessions[moduleName]?.state = VisibilityState.WILLAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.WILLAPPEAR)
        }

        override fun onResume(owner: LifecycleOwner) {
            if (!isCurrentSession()) {
                return
            }
            sessions[moduleName]?.state = VisibilityState.DIDAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.DIDAPPEAR)
        }

        override fun onPause(owner: LifecycleOwner) {
            if (!isCurrentSession()) {
                return
            }
            sessions[moduleName]?.state = VisibilityState.WILLDISAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.WILLDISAPPEAR)
        }

        override fun onStop(owner: LifecycleOwner) {
            if (!isCurrentSession()) {
                return
            }
            sessions[moduleName]?.state = VisibilityState.DIDDISAPPEAR
            HybridAutoPlay.emitRenderState(moduleName, VisibilityState.DIDDISAPPEAR)
        }

        override fun onDestroy(owner: LifecycleOwner) {
            VirtualRenderer.removeRenderer(moduleName, carContext)

            if (!isCurrentSession()) {
                Log.i(TAG, "$moduleName: a newer session took over, skipping session teardown")
                return
            }

            val sessionId = sessions.remove(moduleName)?.sessionId
            clusterId?.let {
                HybridCluster.emit(ClusterEventName.DIDDISCONNECT, clusterId)
                clusterSessions.remove(it)
                return
            }

            CarHardwareLocationObserver.stop()
            HybridAndroidAutoNavigation.clearPendingNavigationIntent()
            sessionId?.let { HybridAutoPlay.emit(EventName.DIDDISCONNECT, it) }
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
        val carContext: CarContext,
        val session: AndroidAutoSession,
        var state: VisibilityState,
        val sessionId: Int?
    )

    companion object {
        const val TAG = "AndroidAutoSession"
        const val ROOT_SESSION = "AutoPlayRoot"

        private val sessions = ConcurrentHashMap<String, ScreenContext>()

        private val clusterSessions = CopyOnWriteArrayList<String>()

        private val lastSessionId = AtomicInteger(0)

        fun getIsConnected(): Boolean {
            return sessions[ROOT_SESSION]?.let { !it.session.isTornDown } ?: false
        }

        /**
         * Assigned on every head unit connect, so JS can tell a listener that was suspended across a
         * disconnect from one called for the current session. Removed together with the session, which
         * the isCurrentSession check keeps an older session's late onDestroy from doing. Hidden during
         * teardown like getIsConnected, so a getCurrentSessionId() guard in onPopped fails too.
         */
        fun getSessionId(): Int? {
            return sessions[ROOT_SESSION]?.takeUnless { it.session.isTornDown }?.sessionId
        }

        fun getState(marker: String): VisibilityState? {
            return sessions[marker]?.state
        }

        /**
         * Null during teardown like getRootContext, so a root MapTemplate or cluster renderer is not
         * created on a destroyed context. Teardown code gets its context passed in instead.
         */
        fun getCarContext(marker: String): CarContext? {
            return sessions[marker]?.takeUnless { it.session.isTornDown }?.carContext
        }

        fun getLifecycle(marker: String): Lifecycle? {
            return sessions[marker]?.session?.lifecycle
        }

        fun getRootContext(): CarContext? {
            return sessions[ROOT_SESSION]?.takeUnless { it.session.isTornDown }?.carContext
        }

        fun getClusterSessions(): Array<String> {
            return clusterSessions.toTypedArray()
        }
    }
}
