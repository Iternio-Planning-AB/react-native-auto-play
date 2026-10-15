package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.Header
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.ParkedOnlyOnClickListener
import androidx.car.app.model.Template
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.LifecycleOwner
import com.margelo.nitro.swe.iternio.reactnativeautoplay.PermissionRequestResult
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.AppInfo

class AutomotivePermissionRequestTemplate(
    carContext: CarContext,
    private val permissions: Array<String>,
    private val message: String,
    private val grantButtonText: String,
    private val cancelButtonText: String?,
) : Screen(carContext) {

    var destroyed = false

    init {
        val handler = Handler(Looper.getMainLooper())

        val permissionChecker = object : Runnable {
            // this runnable makes sure we catch granted permissions from other templates or react-native PermissionAndroid.requestMultiple
            override fun run() {
                val granted = permissions.all {
                    ContextCompat.checkSelfPermission(
                        carContext, it
                    ) == PackageManager.PERMISSION_GRANTED
                }

                if (granted) {
                    setResult(PermissionRequestResult(permissions, arrayOf()))
                    finish()
                    return
                }

                if (destroyed) {
                    return
                }

                handler.postDelayed(this, 1000)
            }
        }

        lifecycle.addObserver(object : LifecycleEventObserver {
            override fun onStateChanged(source: LifecycleOwner, event: Lifecycle.Event) {
                when (event) {
                    Lifecycle.Event.ON_CREATE -> {
                        handler.postDelayed(permissionChecker, 1000)
                    }

                    Lifecycle.Event.ON_DESTROY -> {
                        destroyed = true
                    }

                    else -> {}
                }
            }
        })
    }

    override fun onGetTemplate(): Template {
        return MessageTemplate.Builder(message).apply {
            setHeader(Header.Builder().apply {
                setStartHeaderAction(Action.APP_ICON)
                setTitle(AppInfo.getApplicationLabel(carContext))
            }.build()).addAction(Action.Builder().apply {
                setTitle(grantButtonText)
                setOnClickListener(ParkedOnlyOnClickListener.create {
                    carContext.requestPermissions(permissions.toList(), { granted: List<String>, denied: List<String> ->
                        setResult(
                            PermissionRequestResult(
                                granted.toTypedArray(), denied.toTypedArray()
                            )
                        )
                        finish()
                    })
                })
                cancelButtonText?.let {
                    addAction(Action.Builder().apply {
                        setTitle(it)
                        setOnClickListener(ParkedOnlyOnClickListener.create {
                            setResult(PermissionRequestResult(arrayOf(), permissions))
                            finish()
                        })
                    }.build())
                }
            }.build())
        }.build()
    }
}
