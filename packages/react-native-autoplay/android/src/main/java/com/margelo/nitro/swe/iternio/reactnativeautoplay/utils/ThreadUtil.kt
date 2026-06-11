package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object ThreadUtil {
    suspend fun <T> postOnUiAndAwait(block: suspend () -> T): Result<T> = runCatching {
        withContext(Dispatchers.Main) {
            block()
        }
    }
}