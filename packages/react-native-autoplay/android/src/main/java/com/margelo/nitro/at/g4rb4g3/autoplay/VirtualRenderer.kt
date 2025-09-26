package com.margelo.nitro.at.g4rb4g3.autoplay

import android.app.Presentation
import android.content.Context
import android.hardware.display.DisplayManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Display
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.car.app.AppManager
import androidx.car.app.CarContext
import androidx.car.app.SurfaceCallback
import androidx.car.app.SurfaceContainer
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.runtime.ReactSurfaceImpl
import com.facebook.react.runtime.ReactSurfaceView
import com.facebook.react.uimanager.ReactRoot
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ReactContextResolver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Runnable
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicInteger

class VirtualRenderer(
    private val context: CarContext, private val moduleName: String, private val isCluster: Boolean
) {
    private lateinit var uiManager: FabricUIManager
    private lateinit var display: Display
    private lateinit var reactContext: ReactContext

    private var height: Int = 0
    private var width: Int = 0

    private var initDone = false

    init {
        CoroutineScope(Dispatchers.Main).launch {
            reactContext =
                ReactContextResolver.getReactContext(context.applicationContext as ReactApplication)
            uiManager =
                UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as FabricUIManager

            init()
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

                init()
            }
        })
    }

    private fun init() {
        if (initDone || !this::display.isInitialized || !this::uiManager.isInitialized) {
            return
        }

        initDone = true

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

        val scale = /*BuildConfig.CARPLAY_SCALE_FACTOR*/
            1.5f * context.resources.displayMetrics.density

        private lateinit var surfaceView: ReactSurfaceView
        private var surfaceId: Int? = null

        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)

            if (!this::surfaceView.isInitialized) {
                val initialProperties = Bundle().apply {
                    putString("id", moduleName)
                    putString("colorScheme", if (context.isDarkMode) "dark" else "light")
                    putBundle("window", Bundle().apply {
                        putInt("height", (height / scale).toInt())
                        putInt("width", (width / scale).toInt())
                        putFloat("scale", scale)
                    })
                }

                val surface = ReactSurfaceImpl(context, moduleName, initialProperties)
                surfaceView = ReactSurfaceView(context, surface)

                surfaceId = uiManager.startSurface(
                    surfaceView, moduleName, Arguments.fromBundle(initialProperties), width, height
                )

                // remove ui-managers lifecycle listener to not stop rendering when app is not in foreground/phone screen is off
                reactContext.removeLifecycleEventListener(uiManager)
                // trigger ui-managers onHostResume to make sure the surface is rendered properly even when AA only is starting without the phone app
                uiManager.onHostResume()
            }

            setContentView(surfaceView)
        }
    }
}