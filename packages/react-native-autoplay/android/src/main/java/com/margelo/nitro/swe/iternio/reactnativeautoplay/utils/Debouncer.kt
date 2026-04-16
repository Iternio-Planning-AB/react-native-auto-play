package com.margelo.nitro.swe.iternio.reactnativeautoplay.utils

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class Debouncer(private val delayMillis: Long = 300L) {
  private val scope = CoroutineScope(Dispatchers.Main)
  private var debounceJob: Job? = null

  fun submit(action: () -> Unit) {
    debounceJob?.cancel()
    debounceJob = scope.launch {
      delay(delayMillis)
      action()
    }
  }
}
