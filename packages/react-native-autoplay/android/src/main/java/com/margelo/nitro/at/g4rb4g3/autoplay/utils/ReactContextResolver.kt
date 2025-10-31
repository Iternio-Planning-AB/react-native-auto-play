package com.margelo.nitro.at.g4rb4g3.autoplay.utils

import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.ReactContext
import com.margelo.nitro.BuildConfig
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object ReactContextResolver {
    suspend fun getReactContext(application: ReactApplication): ReactContext {
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            val host =
                application.reactHost ?: throw IllegalArgumentException("application host null")
            return suspendCancellableCoroutine { continuation ->
                host.currentReactContext?.let {
                    continuation.resume(it)
                    return@suspendCancellableCoroutine
                }

                val listener = object : ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: ReactContext) {
                        host.removeReactInstanceEventListener(this)
                        continuation.resume(context)
                    }
                }
                host.addReactInstanceEventListener(listener)

                continuation.invokeOnCancellation {
                    host.removeReactInstanceEventListener(listener)
                }

                host.start()
            }
        } else {
            val reactInstanceManager = application.reactNativeHost.reactInstanceManager
            return suspendCancellableCoroutine { continuation ->
                reactInstanceManager.currentReactContext?.let {
                    continuation.resume(it)
                    return@suspendCancellableCoroutine
                }

                val listener = object : ReactInstanceManager.ReactInstanceEventListener {
                    override fun onReactContextInitialized(context: ReactContext) {
                        reactInstanceManager.removeReactInstanceEventListener(this)
                        continuation.resume(context)
                    }
                }
                reactInstanceManager.addReactInstanceEventListener(listener)

                continuation.invokeOnCancellation {
                    reactInstanceManager.removeReactInstanceEventListener(listener)
                }

                reactInstanceManager.createReactContextInBackground()
            }
        }
    }
}