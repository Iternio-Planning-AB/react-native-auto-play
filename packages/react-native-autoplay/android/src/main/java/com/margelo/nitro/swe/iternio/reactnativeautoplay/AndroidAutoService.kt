package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.ApplicationInfo
import android.os.IBinder
import androidx.car.app.CarAppService
import androidx.car.app.Session
import androidx.car.app.SessionInfo
import androidx.car.app.validation.HostValidator
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.ReactContextResolver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AndroidAutoService : CarAppService() {
    private lateinit var reactContext: ReactContext

    private var isServiceBound = false
    private var isSessionStarted = false
    private var isReactAppStarted = false

    @SuppressLint("PrivateResource")
    override fun createHostValidator(): HostValidator {
        return if ((applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
        } else {
            HostValidator.Builder(applicationContext)
                .addAllowedHosts(androidx.car.app.R.array.hosts_allowlist_sample).build()
        }
    }

    override fun onCreate() {
        super.onCreate()

        CoroutineScope(Dispatchers.Main).launch {
            reactContext = ReactContextResolver.getReactContext(application as ReactApplication)
            reactContext.addLifecycleEventListener(reactLifecycleObserver)
        }
    }

    override fun onCreateSession(sessionInfo: SessionInfo): Session {
        val session = AndroidAutoSession(sessionInfo, application as ReactApplication)

        if (sessionInfo.displayType == SessionInfo.DISPLAY_TYPE_CLUSTER) {
            return session
        }

        session.lifecycle.addObserver(sessionLifecycleObserver)

        return session
    }

    override fun onDestroy() {
        super.onDestroy()

        stopForeground(STOP_FOREGROUND_REMOVE)

        if (!this::reactContext.isInitialized) {
            return
        }

        reactContext.removeLifecycleEventListener(reactLifecycleObserver)
    }

    private val reactLifecycleObserver = object : LifecycleEventListener {
        override fun onHostResume() {
            isReactAppStarted = true
        }

        override fun onHostPause() {
            isReactAppStarted = false
        }

        override fun onHostDestroy() {
            stopSelf()
        }
    }

    private val sessionLifecycleObserver = object : DefaultLifecycleObserver {
        override fun onCreate(owner: LifecycleOwner) {
            val serviceIntent = Intent(applicationContext, HeadlessTaskService::class.java)
            bindService(serviceIntent, connection, BIND_AUTO_CREATE)
        }

        override fun onResume(owner: LifecycleOwner) {
            isSessionStarted = true
        }

        override fun onPause(owner: LifecycleOwner) {
            isSessionStarted = false
        }

        override fun onDestroy(owner: LifecycleOwner) {
            if (isServiceBound) {
                unbindService(connection)
                isServiceBound = false
            }

            this@AndroidAutoService.stopForeground(STOP_FOREGROUND_REMOVE)
        }
    }

    private val connection: ServiceConnection = object : ServiceConnection {
        override fun onServiceConnected(
            className: ComponentName, service: IBinder
        ) {
            isServiceBound = true
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
            isServiceBound = false
        }
    }

    companion object {
        const val TAG = "AndroidAutoService"
    }
}