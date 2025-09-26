package com.margelo.nitro.at.g4rb4g3.autoplay

import android.content.Intent
import androidx.car.app.CarContext
import androidx.car.app.Screen
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
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ReactContextResolver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import java.util.UUID

class AndroidAutoSession(sessionInfo: SessionInfo, private val reactApplication: ReactApplication) :
    Session() {
    private lateinit var reactContext: ReactContext

    private val isCluster = sessionInfo.displayType == SessionInfo.DISPLAY_TYPE_CLUSTER
    private val clusterTemplateId = if (isCluster) UUID.randomUUID().toString() else null

    private lateinit var screen: AndroidAutoScreen

    override fun onCreateScreen(intent: Intent): Screen {
        screen = AndroidAutoScreen(carContext)
        screen.marker = clusterTemplateId ?: "root"

        if (!isCluster) {
            lifecycle.addObserver(sessionLifecycleObserver)
            rootCarContext = carContext
        }

        CoroutineScope(Dispatchers.Main).launch {
            reactContext = ReactContextResolver.getReactContext(reactApplication)
            reactContext.addLifecycleEventListener(reactLifecycleObserver)

            invokeStartTask()
        }

        return screen
    }

    private fun invokeStartTask() {
        val appRegistry = reactContext.getJSModule(AppRegistry::class.java)
            ?: throw ClassNotFoundException("could not get AppRegistry instance")
        val jsAppModuleName = if (isCluster) "AndroidAutoCluster" else "AndroidAuto"
        val appParams = WritableNativeMap().apply {
            putMap("initialProps", Arguments.createMap().apply {
                putString("id", clusterTemplateId)
            })
        }

        appRegistry.runApplication(jsAppModuleName, appParams)
    }

    private val reactLifecycleObserver = object : LifecycleEventListener {
        override fun onHostResume() {}

        override fun onHostPause() {}

        override fun onHostDestroy() {
            carContext.finishCarApp()
        }
    }

    private val sessionLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onCreate(owner: LifecycleOwner) {
            super.onCreate(owner)

            lifecycleObservers.forEach {
                it.get()?.onCreate(owner)
            }
        }

        override fun onStart(owner: LifecycleOwner) {
            super.onStart(owner)

            lifecycleObservers.forEach {
                it.get()?.onStart(owner)
            }
        }

        override fun onResume(owner: LifecycleOwner) {
            super.onResume(owner)

            lifecycleObservers.forEach {
                it.get()?.onResume(owner)
            }
        }

        override fun onPause(owner: LifecycleOwner) {
            super.onPause(owner)

            lifecycleObservers.forEach {
                it.get()?.onPause(owner)
            }
        }

        override fun onStop(owner: LifecycleOwner) {
            super.onStop(owner)

            lifecycleObservers.forEach {
                it.get()?.onStop(owner)
            }
        }

        override fun onDestroy(owner: LifecycleOwner) {
            super.onDestroy(owner)

            lifecycleObservers.forEach {
                it.get()?.onDestroy(owner)
            }
        }
    }

    companion object {
        const val TAG = "AndroidAutoSession"

        private var rootCarContext: CarContext? = null
        private var lifecycleObservers: ArrayList<WeakReference<DefaultLifecycleObserver>> =
            arrayListOf()

        /**
         * attach an observer for the main screen session lifecycle
         */
        fun addLifecycleObserver(observer: WeakReference<DefaultLifecycleObserver>) {
            lifecycleObservers.add(observer)
        }

        fun removeLifecycleObserver(observer: WeakReference<DefaultLifecycleObserver>) {
            lifecycleObservers.remove(observer)
        }

        fun getRootCarContext(): CarContext? = rootCarContext
    }
}