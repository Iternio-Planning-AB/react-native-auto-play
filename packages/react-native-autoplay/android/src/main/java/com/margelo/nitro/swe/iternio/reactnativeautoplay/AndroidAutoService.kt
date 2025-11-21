package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.IBinder
import android.util.Log
import androidx.car.app.CarAppService
import androidx.car.app.Session
import androidx.car.app.SessionInfo
import androidx.car.app.notification.CarAppExtender
import androidx.car.app.validation.HostValidator
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactContext
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.AppInfo
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.ReactContextResolver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class AndroidAutoService : CarAppService() {
    private lateinit var reactContext: ReactContext
    private lateinit var notificationManager: NotificationManager

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
        instance = this

        CoroutineScope(Dispatchers.Main).launch {
            reactContext = ReactContextResolver.getReactContext(application as ReactApplication)
            reactContext.addLifecycleEventListener(reactLifecycleObserver)
        }

        notificationManager = getSystemService(NotificationManager::class.java)
        val appLabel = AppInfo.getApplicationLabel(this)

        getSystemService(NotificationManager::class.java).createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID, appLabel, NotificationManager.IMPORTANCE_DEFAULT
            )
        )
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
        instance = null

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

    private fun createNotification(
        title: String?, text: String?, largeIcon: Bitmap?
    ): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification).setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_NAVIGATION).setOnlyAlertOnce(true)
            .setWhen(System.currentTimeMillis()).setPriority(NotificationManager.IMPORTANCE_LOW)
            .extend(
                CarAppExtender.Builder().setImportance(NotificationManagerCompat.IMPORTANCE_LOW)
                    .build()
            ).apply {
                title?.let {
                    setContentTitle(it)
                }
                text?.let {
                    setContentText(it)
                    setTicker(it)
                }
                largeIcon?.let {
                    setLargeIcon(it)
                }
            }.build()
    }

    fun startForeground() {
        val isLocationPermissionGranted =
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED || checkSelfPermission(
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

        if (!isLocationPermissionGranted) {
            Log.w(TAG, "location permission not granted, unable to start foreground service!")
            return
        }

        try {
            startForeground(
                NOTIFICATION_ID, createNotification(null, null, null)
            )
        } catch (e: SecurityException) {
            Log.e(TAG, "failed to start foreground service", e)
        }
    }

    fun notify(title: String?, text: String?, icon: Bitmap?) {
        val notification = createNotification(title, text, icon)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }

    companion object {
        const val TAG = "AndroidAutoService"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "AutoPlayServiceChannel"

        var instance: AndroidAutoService? = null
            private set
    }
}