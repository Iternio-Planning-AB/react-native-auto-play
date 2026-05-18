package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.app.Presentation
import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.os.Bundle
import android.view.Display
import android.view.LayoutInflater
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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
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

    private lateinit var reactSurfaceImpl: ReactSurfaceImpl
    private var reactSurfaceView: ReactSurfaceView? = null
    private var reactSurfaceId: Int? = null

    private var height: Int = 0
    private var width: Int = 0

    private var splashWillDisappear = false

    /**
     * scale is the actual scale factor required to calculate proper insets and is passed in initialProperties to js side
     */
    private val virtualScreenDensity = context.resources.displayMetrics.density
    val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

    private fun isSurfaceReady(surfaceContainer: SurfaceContainer): Boolean {
        return surfaceContainer.surface != null && surfaceContainer.dpi != 0 && surfaceContainer.height != 0 && surfaceContainer.width != 0
    }

    init {
        virtualRenderer[moduleName] = this

        context.getCarService(AppManager::class.java).setSurfaceCallback(object : SurfaceCallback {
            val areaDebouncer = Debouncer(200)

            // 12dp seems to be the default margin on AA for the ETA widget and the maneuver so use it as fallback
            val defaultMargin = (12.0 * context.resources.displayMetrics.density).toInt()
            var minMargin = Int.MAX_VALUE
            var stableArea = Rect(0, 0, 0, 0)
            var visibleArea = Rect(0, 0, 0, 0)

            override fun onSurfaceAvailable(surfaceContainer: SurfaceContainer) {
                if (!isSurfaceReady(surfaceContainer)) {
                    return
                }

                val manager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
                virtualDisplay?.release()
                virtualDisplay = manager.createVirtualDisplay(
                    moduleName,
                    surfaceContainer.width,
                    surfaceContainer.height,
                    surfaceContainer.dpi,
                    surfaceContainer.surface,
                    DisplayManager.VIRTUAL_DISPLAY_FLAG_PRESENTATION,
                )

                val display = virtualDisplay?.display ?: return
                height = surfaceContainer.height
                width = surfaceContainer.width

                initRenderer(display)
            }

            override fun onSurfaceDestroyed(surfaceContainer: SurfaceContainer) {
                virtualDisplay?.release()
                virtualDisplay = null
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

            if (!this@VirtualRenderer::reactSurfaceImpl.isInitialized) {
                reactSurfaceImpl = ReactSurfaceImpl(context, moduleName, initialProperties)
            }

            var splashScreenView: View? = null

            reactSurfaceView?.let {
                (it.parent as ViewGroup).removeView(it)
            } ?: run {
                splashScreenView =
                    if (isCluster) getClusterSplashScreen(context, height, width) else null

                val surfaceView = ReactSurfaceView(context, reactSurfaceImpl).apply {
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


            val rootContainer = FrameLayout(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
                )
                clipChildren = false

                addView(reactSurfaceView)
            }

            splashScreenView?.let {
                rootContainer.addView(it)
            }

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
    private fun stop() {
        virtualDisplay?.release()
        virtualDisplay = null

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
            virtualRenderer.remove(moduleName)
        }
    }

    companion object {
        const val TAG = "VirtualRenderer"

        private val virtualRenderer = ConcurrentHashMap<String, VirtualRenderer>()

        fun hasRenderer(moduleId: String): Boolean {
            return virtualRenderer.contains(moduleId)
        }

        fun removeRenderer(moduleId: String) {
            virtualRenderer[moduleId]?.stop()
            virtualRenderer.remove(moduleId)
        }
    }
}
