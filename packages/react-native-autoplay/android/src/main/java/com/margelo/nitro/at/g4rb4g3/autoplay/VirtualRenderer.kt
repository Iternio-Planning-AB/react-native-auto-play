package com.margelo.nitro.at.g4rb4g3.autoplay

import android.app.Presentation
import android.content.Context
import android.graphics.Color
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.view.Display
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.car.app.AppManager
import androidx.car.app.CarContext
import androidx.car.app.SurfaceCallback
import androidx.car.app.SurfaceContainer
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.runtime.ReactSurfaceImpl
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ReactContextResolver
import com.margelo.nitro.autoplay.BuildConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class VirtualRenderer(
    private val context: CarContext, private val isCluster: Boolean
) {
    private lateinit var uiManager: FabricUIManager
    private lateinit var display: Display
    private lateinit var reactContext: ReactContext

    private lateinit var reactSurfaceImpl: ReactSurfaceImpl
    private lateinit var reactSurfaceView: ReactSurfaceView
    private var reactSurfaceId: Int? = null

    private var height: Int = 0
    private var width: Int = 0

    /**
     * scale is the actual scale factor required to calculate proper insets and is passed in initialProperties to js side
     */
    private val virtualScreenDensity = context.resources.displayMetrics.density
    val scale = BuildConfig.SCALE_FACTOR * virtualScreenDensity

    init {
        CoroutineScope(Dispatchers.Main).launch {
            reactContext =
                ReactContextResolver.getReactContext(context.applicationContext as ReactApplication)
            uiManager =
                UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as FabricUIManager

            initRenderer()
        }

        context.getCarService(AppManager::class.java).setSurfaceCallback(object : SurfaceCallback {
            override fun onSurfaceAvailable(surfaceContainer: SurfaceContainer) {
                val name =
                    if (isCluster) "AndroidAutoClusterMapTemplate" else "AndroidAutoMapTemplate"
                val manager = context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
                val virtualDisplay = manager.createVirtualDisplay(
                    name,
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
        })
    }

    private fun initRenderer() {
        if (!this::display.isInitialized || !this::uiManager.isInitialized) {
            // this makes sure we have all required instances
            // no matter if the app is launched on the phone or AA first
            return
        }

        MapPresentation(
            context, display, height, width
        ).show()
    }

    inner class MapPresentation(
        private val context: CarContext,
        display: Display,
        private val height: Int,
        private val width: Int
    ) : Presentation(context, display) {
        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)

            val initialProperties = Bundle().apply {
                putString("id", moduleName)
                putString("colorScheme", if (context.isDarkMode) "dark" else "light")
                putBundle("window", Bundle().apply {
                    putInt("height", (height / scale).toInt())
                    putInt("width", (width / scale).toInt())
                    putFloat("scale", scale)
                })
            }

            if (!this@VirtualRenderer::reactSurfaceImpl.isInitialized) {
                reactSurfaceImpl = ReactSurfaceImpl(context, moduleName, initialProperties)
            }

            if (!this@VirtualRenderer::reactSurfaceView.isInitialized) {
                /**
                 * since react-native renders everything with the density/scaleFactor from the main display
                 * we have to adjust scaling on AA to take this into account
                 */
                DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(reactContext)
                val mainScreenDensity = DisplayMetricsHolder.getScreenDisplayMetrics().density
                val reactNativeScale =
                    virtualScreenDensity / mainScreenDensity * BuildConfig.SCALE_FACTOR

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
                    width,
                    height
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
        val moduleName = "AutoPlayRoot"
    }
}