package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.app.Presentation
import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.os.Bundle
import android.os.SystemClock
import android.util.Log
import android.view.ContextThemeWrapper
import android.view.Display
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.FrameLayout
import android.widget.TextView
import androidx.annotation.MainThread
import androidx.car.app.AppManager
import androidx.car.app.CarContext
import androidx.car.app.SurfaceCallback
import androidx.car.app.SurfaceContainer
import com.facebook.react.ReactHost
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.runtime.ReactSurfaceImpl
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.NitroModules
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.AppInfo
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.Debouncer
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.floor

class VirtualRenderer(
    private val context: CarContext,
    private val moduleName: String,
    private val isCluster: Boolean = false
) {
    private var virtualDisplay: VirtualDisplay? = null
    private val pendingDisplays = mutableListOf<VirtualDisplay>()

    private var reactSurfaceImpl: ReactSurfaceImpl? = null
    private var reactSurfaceView: ReactSurfaceView? = null
    private var reactSurfaceId: Int? = null

    private var height: Int = 0
    private var width: Int = 0
    private var dpi: Int = 0

    private var splashWillDisappear = false

    /**
     * scale is the actual scale factor required to calculate proper insets and is passed in initialProperties to js side.
     * The density is derived from the surface container's dpi so it always matches the VirtualDisplay,
     * and is recomputed on every onSurfaceAvailable since the host may recreate the surface with new metrics.
     */
    private var virtualScreenDensity = context.resources.displayMetrics.density
    var scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity
        private set

    // For converting surface coordinates to ReactSurfaceView-local coordinates in onClick below.
    private var reactNativeScale: Float = 1.0f

    private fun isSurfaceReady(surfaceContainer: SurfaceContainer): Boolean {
        return surfaceContainer.surface != null && surfaceContainer.dpi != 0 && surfaceContainer.height != 0 && surfaceContainer.width != 0
    }

    init {
        virtualRenderer[moduleName] = this

        context.getCarService(AppManager::class.java).setSurfaceCallback(object : SurfaceCallback {
            val areaDebouncer = Debouncer(200)

            // 12dp seems to be the default margin on AA for the ETA widget and the maneuver so use it as fallback
            val defaultMargin get() = (12.0 * virtualScreenDensity).toInt()
            var minMargin = Int.MAX_VALUE
            var stableArea = Rect(0, 0, 0, 0)
            var visibleArea = Rect(0, 0, 0, 0)

            override fun onSurfaceAvailable(surfaceContainer: SurfaceContainer) {
                if (!isSurfaceReady(surfaceContainer)) {
                    return
                }

                applySurface(surfaceContainer)
            }

            override fun onSurfaceDestroyed(surfaceContainer: SurfaceContainer) {
                // the host re-emits visible/stable areas for the next surface, so drop state derived
                // from the old surface instead of combining it with the new dimensions
                minMargin = Int.MAX_VALUE
                stableArea = Rect(0, 0, 0, 0)
                visibleArea = Rect(0, 0, 0, 0)

                // Not releasing virtualDisplay here, and not relying on this firing at all (unreliable on
                // some Automotive devices) -- see applySurface/onDraw sweep for where the old display actually gets freed.
            }

            override fun onScroll(distanceX: Float, distanceY: Float) {
                getMapTemplateConfig()?.onDidPan?.let {
                    it(
                        Point((-distanceX / scale).toDouble(), (-distanceY / scale).toDouble()),
                        null
                    )
                }
            }

            override fun onScale(focusX: Float, focusY: Float, scaleFactor: Float) {
                val config = getMapTemplateConfig() ?: return
                val center = Point((focusX / scale).toDouble(), (focusY / scale).toDouble())

                if (scaleFactor == 2f) {
                    config.onDoubleClick?.let {
                        it(center)
                    }
                    return
                }

                getMapTemplateConfig()?.onDidUpdateZoomGestureWithCenter?.let {
                    it(
                        center, scaleFactor.toDouble()
                    )
                }
            }

            override fun onClick(x: Float, y: Float) {
                // The host's SurfaceCallback.onClick only carries coordinates — it doesn't
                // dispatch an actual touch event into the Fabric surface. Without forwarding
                // it, RN Pressable/TouchableOpacity components never see a real touch and
                // never fire their own handlers; only the config-level onClick below (already
                // present) worked. Dispatch a synthetic DOWN+UP into the ReactSurfaceView so
                // JS-side touch handling gets the same events a real touch would produce.
                reactSurfaceView?.let { view ->
                    val lx = x / reactNativeScale
                    val ly = y / reactNativeScale
                    UiThreadUtil.runOnUiThread {
                        val t = SystemClock.uptimeMillis()
                        val down = MotionEvent.obtain(t, t, MotionEvent.ACTION_DOWN, lx, ly, 0)
                        val up = MotionEvent.obtain(t, t + 100L, MotionEvent.ACTION_UP, lx, ly, 0)
                        val handled = view.dispatchTouchEvent(down) or view.dispatchTouchEvent(up)
                        if (!handled) {
                            Log.w(TAG, "onClick: touch dispatch unhandled — view has no size or its ReactHost isn't attached yet")
                        }
                        down.recycle()
                        up.recycle()
                    }
                }

                getMapTemplateConfig()?.onClick?.let {
                    it(Point((x / scale).toDouble(), (y / scale).toDouble()))
                }
            }

            override fun onVisibleAreaChanged(visibleArea: Rect) {
                this.visibleArea = visibleArea
                areaDebouncer.submit {
                    this.minMargin = minMargin.coerceAtMost(
                        minOf(
                            visibleArea.top, visibleArea.left, visibleArea.bottom, visibleArea.right
                        )
                    )
                    updateSafeAreaInsets()
                }
            }

            override fun onStableAreaChanged(stableArea: Rect) {
                this.stableArea = stableArea
                areaDebouncer.submit {
                    this.minMargin = minMargin.coerceAtMost(
                        minOf(
                            stableArea.top, stableArea.left, stableArea.bottom, stableArea.right
                        )
                    )
                    updateSafeAreaInsets()
                }
            }

            fun updateSafeAreaInsets() {
                if (maxOf(
                        stableArea.top, stableArea.left, stableArea.bottom, stableArea.right
                    ) == 0
                ) {
                    // wait for stable area to be initialized first
                    return
                }

                if (maxOf(
                        visibleArea.top, visibleArea.left, visibleArea.bottom, visibleArea.right
                    ) == 0
                ) {
                    // wait for visible area to be initialized first
                    return
                }

                if (minMargin == 0) {
                    // probably legacy AA layout
                    val additionalMarginLeft =
                        if (stableArea.left == visibleArea.left) defaultMargin else 0
                    val additionalMarginRight =
                        if (stableArea.right == visibleArea.right && visibleArea.right != width) 0 else defaultMargin
                    val additionalMarginTop =
                        if (visibleArea.top != stableArea.top || (visibleArea.top > 0 && visibleArea.right < width)) 0 else defaultMargin
                    val additionalMarginBottom =
                        if (stableArea.bottom == visibleArea.bottom) defaultMargin else 0

                    val top = floor((visibleArea.top + additionalMarginTop) / scale).toDouble()
                    val bottom =
                        floor((height - visibleArea.bottom + additionalMarginBottom) / scale).toDouble()
                    val left = floor((visibleArea.left + additionalMarginLeft) / scale).toDouble()
                    val right =
                        floor((width - visibleArea.right + additionalMarginRight) / scale).toDouble()
                    HybridAutoPlay.emitSafeAreaInsets(
                        moduleName = moduleName,
                        top = top,
                        bottom = bottom,
                        left = left,
                        right = right,
                        isLegacyLayout = true
                    )
                } else {
                    // material expression 3 seems to apply always some margin and never reports 0
                    val additionalMarginLeft =
                        if (stableArea.left == visibleArea.left) defaultMargin else 0
                    val additionalMarginRight =
                        if (stableArea.right == visibleArea.right) defaultMargin else 0

                    val top = floor(visibleArea.top.coerceAtLeast(defaultMargin) / scale).toDouble()
                    val bottom =
                        floor((height - visibleArea.bottom).coerceAtLeast(defaultMargin) / scale).toDouble()
                    val left =
                        floor((visibleArea.left + additionalMarginLeft).coerceAtLeast(defaultMargin) / scale).toDouble()
                    val right = floor(
                        (width - visibleArea.right + additionalMarginRight).coerceAtLeast(
                            defaultMargin
                        ) / scale
                    ).toDouble()
                    HybridAutoPlay.emitSafeAreaInsets(
                        moduleName = moduleName,
                        top = top,
                        bottom = bottom,
                        left = left,
                        right = right,
                        isLegacyLayout = false
                    )
                }
            }
        })
    }

    @MainThread
    private fun applySurface(surfaceContainer: SurfaceContainer) {
        val surfaceWidth = surfaceContainer.width
        val surfaceHeight = surfaceContainer.height

        // The host signals surface size changes only via onSurfaceDestroyed -> onSurfaceAvailable
        // with new dimensions, so all size-derived state (layout params, scale, Fabric measure
        // specs) must be recomputed when the metrics differ from the current ones. The react
        // surface itself is kept alive so JS state survives the resize; the JS side is informed
        // via the windowInformation listener since the window initial prop stays stale.
        val isResize = reactSurfaceView != null && (width != surfaceWidth
                || height != surfaceHeight || dpi != surfaceContainer.dpi)

        val manager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager

        virtualDisplay?.let {
            // released once its replacement (created below) has drawn
            pendingDisplays.add(it)
        }

        virtualDisplay = manager.createVirtualDisplay(
            moduleName,
            surfaceWidth,
            surfaceHeight,
            surfaceContainer.dpi,
            surfaceContainer.surface,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_PRESENTATION,
        )

        val display = virtualDisplay?.display ?: return
        height = surfaceHeight
        width = surfaceWidth
        dpi = surfaceContainer.dpi
        virtualScreenDensity = surfaceContainer.dpi / 160f
        scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

        initRenderer(display)

        if (isResize) {
            getWindowInformation(moduleName)?.let {
                HybridAndroidWindowInformation.emitWindowInformation(moduleName, it)
            }
        }
    }

    private fun getMapTemplateConfig(): MapTemplateConfig? {
        val screenManager = AndroidAutoScreen.getScreen(moduleName)?.screenManager ?: return null
        val marker = screenManager.top.marker ?: return null
        return AndroidAutoTemplate.getTypedConfig<MapTemplateConfig>(marker)
    }

    private fun initRenderer(display: Display) {
        val reactContext = NitroModules.applicationContext ?: return

        val fabricUiManager = UIManagerHelper.getUIManager(
            reactContext, UIManagerType.FABRIC
        ) as? FabricUIManager? ?: return

        val initialProperties = Bundle().apply {
            putString("id", moduleName)
            putString("colorScheme", if (context.isDarkMode) "dark" else "light")
            putBundle("window", Bundle().apply {
                putInt("height", (height / scale).toInt())
                putInt("width", (width / scale).toInt())
                putFloat("scale", scale)
            })
        }

        /**
         * since react-native renders everything with the density/scaleFactor from the main display
         * we have to adjust scaling on AA to take this into account
         */
        DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext)
        val mainScreenDensity = DisplayMetricsHolder.getScreenDisplayMetrics().density
        val reactNativeScale = virtualScreenDensity / mainScreenDensity * BuildConfig.SCALE_FACTOR
        this.reactNativeScale = reactNativeScale

        FabricMapPresentation(
            reactContext,
            display,
            fabricUiManager,
            height,
            width,
            initialProperties,
            reactNativeScale
        ).show()
    }

    inner class FabricMapPresentation(
        private val context: ReactContext,
        display: Display,
        private val fabricUiManager: FabricUIManager,
        private val height: Int,
        private val width: Int,
        private val initialProperties: Bundle,
        private val reactNativeScale: Float
    ) : Presentation(context, display) {
        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)

            // Wrap applicationContext with the app theme so AppCompat widgets (e.g. ReactTextView)
            // can resolve their required text-appearance attrs on OEM themes that don't define them
            // (notably Polestar/Volvo Android Automotive: Theme.DeviceDefault.Light.DarkActionBar).
            val appTheme = context.applicationContext.applicationInfo.theme
            val themedContext = ContextThemeWrapper(context.applicationContext, appTheme)

            val surfaceImpl = reactSurfaceImpl ?: ReactSurfaceImpl(
                themedContext, moduleName, initialProperties
            ).also {
                reactSurfaceImpl = it
            }

            // ReactSurfaceImpl only dispatches touch events to JS once attach(ReactHost) has
            // been called — otherwise dispatchTouchEvent (see onClick above) is a no-op. The
            // bridgeless ReactContext holds its ReactHostImpl as a private field with no public
            // accessor, so it's fetched via reflection and attached explicitly here. Calling
            // attach() again on an already-attached surface throws IllegalStateException,
            // which is expected on every onCreate after the first (e.g. on resize) and safely
            // ignored.
            try {
                var clazz: Class<*>? = context.javaClass
                var hostObj: Any? = null
                while (clazz != null && hostObj == null) {
                    try {
                        val f = clazz.getDeclaredField("reactHost")
                        f.isAccessible = true
                        hostObj = f.get(context)
                    } catch (_: NoSuchFieldException) {
                        clazz = clazz.superclass
                    }
                }
                val reactHostRef = hostObj as? ReactHost
                if (reactHostRef != null) {
                    surfaceImpl.attach(reactHostRef)
                } else {
                    Log.w(TAG, "FabricMapPresentation: no ReactHost found on ${context.javaClass.name} — touches won't reach JS")
                }
            } catch (_: IllegalStateException) {
                // already attached from a previous onCreate — expected, not an error
            } catch (e: Exception) {
                Log.w(TAG, "FabricMapPresentation: attach(ReactHost) failed: $e")
            }

            var splashScreenView: View? = null

            reactSurfaceView?.let {
                (it.parent as ViewGroup).removeView(it)

                // the surface may have been recreated with new dimensions, so reapply all
                // size-derived values and push the new layout specs into the running Fabric surface
                it.layoutParams = FrameLayout.LayoutParams(
                    (width / reactNativeScale).toInt(), (height / reactNativeScale).toInt()
                )
                it.scaleX = reactNativeScale
                it.scaleY = reactNativeScale

                reactSurfaceId?.let { surfaceId ->
                    fabricUiManager.updateRootLayoutSpecs(
                        surfaceId,
                        View.MeasureSpec.makeMeasureSpec(
                            (width / reactNativeScale).toInt(), View.MeasureSpec.EXACTLY
                        ),
                        View.MeasureSpec.makeMeasureSpec(
                            (height / reactNativeScale).toInt(), View.MeasureSpec.EXACTLY
                        ),
                        0,
                        0
                    )
                }
            } ?: run {
                // skip the splash when the surface is rebuilt after a resize, content is already loaded
                splashScreenView =
                    if (isCluster && !splashWillDisappear) {
                        getClusterSplashScreen(themedContext, height, width)
                    } else {
                        null
                    }

                val surfaceView = ReactSurfaceView(themedContext, surfaceImpl).apply {
                    layoutParams = FrameLayout.LayoutParams(
                        (width / reactNativeScale).toInt(), (height / reactNativeScale).toInt()
                    )
                    scaleX = reactNativeScale
                    scaleY = reactNativeScale
                    pivotX = 0f
                    pivotY = 0f
                    setBackgroundColor(Color.DKGRAY)

                    splashScreenView?.let {
                        removeClusterSplashScreen({ viewTreeObserver }, it)
                    }
                }

                reactSurfaceId = fabricUiManager.startSurface(
                    surfaceView,
                    moduleName,
                    Arguments.fromBundle(initialProperties),
                    View.MeasureSpec.makeMeasureSpec(
                        (width / reactNativeScale).toInt(), View.MeasureSpec.EXACTLY
                    ),
                    View.MeasureSpec.makeMeasureSpec(
                        (height / reactNativeScale).toInt(), View.MeasureSpec.EXACTLY
                    )
                )

                // remove ui-managers lifecycle listener to not stop rendering when app is not in foreground/phone screen is off
                context.removeLifecycleEventListener(fabricUiManager)
                // trigger ui-managers onHostResume to make sure the surface is rendered properly even when AA only is starting without the phone app
                fabricUiManager.onHostResume()

                reactSurfaceView = surfaceView
            }


            val rootContainer = FrameLayout(themedContext).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
                )
                clipChildren = false

                addView(reactSurfaceView)
            }

            splashScreenView?.let {
                rootContainer.addView(it)
            }

            rootContainer.viewTreeObserver.addOnDrawListener(object :
                ViewTreeObserver.OnDrawListener {
                override fun onDraw() {
                    rootContainer.post {
                        rootContainer.viewTreeObserver.removeOnDrawListener(this)
                        // Releasing here, only once a new display has drawn, avoids the window-absent gap that
                        // stops Choreographer. Releasing old displays any earlier reintroduces that suspension. It
                        // freezes the map (Mapbox ValueAnimator) and RN (setInterval/setTimeout) until the phone
                        // screen is woken.
                        pendingDisplays.forEach {
                            it.release()
                        }
                        pendingDisplays.clear()
                    }
                }
            })

            setContentView(rootContainer)
        }
    }

    private fun getClusterSplashScreen(
        context: Context, containerHeight: Int, containerWidth: Int
    ): View {
        val root = FrameLayout(context).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
            )
        }

        val layout =
            LayoutInflater.from(context).inflate(R.layout.cluster_splashscreen, root, false)
        val text = layout.findViewById<TextView>(R.id.splash_text)

        AppInfo.getApplicationIcon(context)?.let {
            val maxIconSize = minOf(64, (0.25 * maxOf(containerHeight, containerWidth)).toInt())

            it.setBounds(0, 0, maxIconSize, maxIconSize)
            text.setCompoundDrawables(null, it, null, null)
        }

        text.text = AppInfo.getApplicationLabel(context)

        return layout
    }

    private fun removeClusterSplashScreen(
        getViewTreeObserver: () -> ViewTreeObserver, splashScreenView: View
    ) {
        getViewTreeObserver().addOnGlobalLayoutListener(object :
            ViewTreeObserver.OnGlobalLayoutListener {
            override fun onGlobalLayout() {
                if (splashWillDisappear) {
                    return
                }
                splashWillDisappear = true

                splashScreenView.animate().alpha(0f)
                    .setStartDelay(BuildConfig.CLUSTER_SPLASH_DELAY_MS)
                    .setDuration(BuildConfig.CLUSTER_SPLASH_DURATION_MS).withEndAction {
                        (splashScreenView.parent as? ViewGroup)?.removeView(splashScreenView)
                        getViewTreeObserver().removeOnGlobalLayoutListener(this)
                    }
            }
        })
    }

    @MainThread
    private fun stopReactSurface() {
        val uiManager = NitroModules.applicationContext?.let {
            UIManagerHelper.getUIManager(
                it, UIManagerType.FABRIC
            ) as? FabricUIManager?
        }

        try {
            reactSurfaceId?.let {
                uiManager?.stopSurface(it)
            }
        } catch (_: AssertionError) {
            // Fabric already invalidated
        } finally {
            reactSurfaceId = null
            reactSurfaceView = null
            reactSurfaceImpl = null
        }
    }

    @MainThread
    private fun stop() {
        virtualDisplay?.release()
        virtualDisplay = null

        pendingDisplays.forEach {
            // make sure to release any pending displays in case
            // the new one did not draw yet but stop is called
            it.release()
        }
        pendingDisplays.clear()

        try {
            stopReactSurface()
        } finally {
            virtualRenderer.remove(moduleName)
        }
    }

    companion object {
        const val TAG = "VirtualRenderer"

        private val virtualRenderer = ConcurrentHashMap<String, VirtualRenderer>()

        fun hasRenderer(moduleId: String): Boolean {
            return virtualRenderer.contains(moduleId)
        }

        fun getWindowInformation(moduleId: String): WindowInformation? {
            val renderer = virtualRenderer[moduleId] ?: return null
            if (renderer.width == 0 || renderer.height == 0) {
                return null
            }

            return WindowInformation(
                width = (renderer.width / renderer.scale).toInt().toDouble(),
                height = (renderer.height / renderer.scale).toInt().toDouble(),
                scale = renderer.scale.toDouble()
            )
        }

        fun removeRenderer(moduleId: String) {
            virtualRenderer[moduleId]?.stop()
            virtualRenderer.remove(moduleId)
        }
    }
}
