package com.margelo.nitro.at.g4rb4g3.autoplay

import android.app.Presentation
import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.view.Display
import android.view.View.MeasureSpec
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.car.app.AppManager
import androidx.car.app.CarContext
import androidx.car.app.SurfaceCallback
import androidx.car.app.SurfaceContainer
import com.facebook.react.ReactApplication
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.runtime.ReactSurfaceImpl
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.HybridAutoPlay
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.MapTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.Point
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.Debouncer
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ReactContextResolver
import com.margelo.nitro.autoplay.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.floor

class VirtualRenderer(
    private val context: CarContext, private val moduleName: String
) {
    private lateinit var uiManager: FabricUIManager
    private lateinit var display: Display
    private lateinit var reactContext: ReactContext

    private lateinit var reactSurfaceImpl: ReactSurfaceImpl
    private lateinit var reactSurfaceView: ReactSurfaceView
    private var reactSurfaceId: Int? = null

    private lateinit var reactRootView: ReactRootView

    private var height: Int = 0
    private var width: Int = 0

    /**
     * scale is the actual scale factor required to calculate proper insets and is passed in initialProperties to js side
     */
    private val virtualScreenDensity = context.resources.displayMetrics.density
    val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

    init {
        virtualRenderer.put(moduleName, this)

        CoroutineScope(Dispatchers.Main).launch {
            reactContext =
                ReactContextResolver.getReactContext(context.applicationContext as ReactApplication)

            if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
                uiManager = UIManagerHelper.getUIManager(
                    reactContext, UIManagerType.FABRIC
                ) as FabricUIManager
            }

            initRenderer()
        }

        context.getCarService(AppManager::class.java).setSurfaceCallback(object : SurfaceCallback {
            val areaDebouncer = Debouncer(200)

            // 12dp seems to be the default margin on AA for the ETA widget and the maneuver so use it as fallback
            val defaultMargin = (12.0 * context.resources.displayMetrics.density).toInt()
            var minMargin = Int.MAX_VALUE
            var stableArea = Rect(0, 0, 0, 0)
            var visibleArea = Rect(0, 0, 0, 0)

            override fun onSurfaceAvailable(surfaceContainer: SurfaceContainer) {
                val manager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
                val virtualDisplay = manager.createVirtualDisplay(
                    moduleName,
                    surfaceContainer.width,
                    surfaceContainer.height,
                    surfaceContainer.dpi,
                    surfaceContainer.surface,
                    DisplayManager.VIRTUAL_DISPLAY_FLAG_PRESENTATION,
                )

                display = virtualDisplay.display
                height = surfaceContainer.height
                width = surfaceContainer.width

                initRenderer()
            }

            override fun onScroll(distanceX: Float, distanceY: Float) {
                getMapTemplateConfig()?.onDidUpdatePanGestureWithTranslation?.let {
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
                        center, scaleFactor.toDouble(), null
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
                        if (visibleArea.top != stableArea.top || (visibleArea.top > 0 && stableArea.top > 0 && visibleArea.right < width)) 0 else defaultMargin
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
        return AndroidAutoTemplate.getConfig(marker) as MapTemplateConfig?
    }

    private fun initRenderer() {
        if (!this::display.isInitialized) {
            return
        }

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

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            if (!this::uiManager.isInitialized) {
                // this makes sure we have all required instances
                // no matter if the app is launched on the phone or AA first
                return
            }

            FabricMapPresentation(
                context, display, height, width, initialProperties, reactNativeScale
            ).show()
        } else {
            MapPresentation(
                context, display, height, width, initialProperties, reactNativeScale
            ).show()
        }
    }

    inner class MapPresentation(
        private val context: CarContext,
        display: Display,
        private val height: Int,
        private val width: Int,
        private val initialProperties: Bundle,
        private val reactNativeScale: Float,
    ) : Presentation(context, display) {
        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)

            if (!this@VirtualRenderer::reactRootView.isInitialized) {
                val instanceManager =
                    (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
                reactRootView = ReactRootView(context.applicationContext).apply {
                    layoutParams = FrameLayout.LayoutParams(
                        (this@MapPresentation.width / reactNativeScale).toInt(), (this@MapPresentation.height / reactNativeScale).toInt()
                    )
                    scaleX = reactNativeScale
                    scaleY = reactNativeScale
                    pivotX = 0f
                    pivotY = 0f
                    setBackgroundColor(Color.DKGRAY)

                    startReactApplication(instanceManager, moduleName, initialProperties)
                    runApplication()
                }
            } else {
                (reactRootView.parent as? ViewGroup)?.removeView(reactRootView)
            }

            val rootContainer = FrameLayout(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
                )
                clipChildren = false
            }

            rootContainer.addView(reactRootView)

            setContentView(rootContainer)
        }
    }

    inner class FabricMapPresentation(
        private val context: CarContext,
        display: Display,
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

            if (!this@VirtualRenderer::reactSurfaceView.isInitialized) {
                reactSurfaceView = ReactSurfaceView(context, reactSurfaceImpl).apply {
                    layoutParams = FrameLayout.LayoutParams(
                        (width / reactNativeScale).toInt(), (height / reactNativeScale).toInt()
                    )
                    scaleX = reactNativeScale
                    scaleY = reactNativeScale
                    pivotX = 0f
                    pivotY = 0f
                    setBackgroundColor(Color.DKGRAY)
                }

                reactSurfaceId = uiManager.startSurface(
                    reactSurfaceView,
                    moduleName,
                    Arguments.fromBundle(initialProperties),
                    MeasureSpec.makeMeasureSpec(
                        (width / reactNativeScale).toInt(), MeasureSpec.EXACTLY
                    ),
                    MeasureSpec.makeMeasureSpec(
                        (height / reactNativeScale).toInt(), MeasureSpec.EXACTLY
                    )
                )

                // remove ui-managers lifecycle listener to not stop rendering when app is not in foreground/phone screen is off
                reactContext.removeLifecycleEventListener(uiManager)
                // trigger ui-managers onHostResume to make sure the surface is rendered properly even when AA only is starting without the phone app
                uiManager.onHostResume()
            } else {
                (reactSurfaceView.parent as ViewGroup).removeView(reactSurfaceView)
            }

            setContentView(FrameLayout(context).apply {
                layoutParams = FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
                )
                clipChildren = false

                addView(reactSurfaceView)
            })
        }
    }

    companion object {
        const val TAG = "VirtualRenderer"

        private val virtualRenderer = mutableMapOf<String, VirtualRenderer>()

        fun hasRenderer(moduleId: String): Boolean {
            return virtualRenderer.contains(moduleId)
        }

        fun removeRenderer(moduleId: String) {
            val renderer = virtualRenderer[moduleId]

            if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
                renderer?.reactSurfaceId?.let {
                    renderer.uiManager.stopSurface(it)
                }
            }

            virtualRenderer.remove(moduleId)
        }
    }
}