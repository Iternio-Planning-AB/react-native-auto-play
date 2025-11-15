package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import com.facebook.react.bridge.UiThreadUtil
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object ThreadUtil {
    suspend fun <T> postOnUiAndAwait(block: () -> T): Result<T> =
        suspendCancellableCoroutine { cont ->
            UiThreadUtil.runOnUiThread {
                try {
                    val result = block()
                    cont.resume(Result.success(result))
                } catch (e: Exception) {
                    cont.resume(Result.failure(e))
                }
            }
        }
}