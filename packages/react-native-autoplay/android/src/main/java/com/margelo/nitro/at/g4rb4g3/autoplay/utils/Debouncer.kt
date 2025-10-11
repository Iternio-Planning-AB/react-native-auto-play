package com.margelo.nitro.at.g4rb4g3.autoplay.utils

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class Debouncer(private val delayMillis: Long = 300L) {
  private var debounceJob: Job? = null

  fun submit(action: () -> Unit) {
    debounceJob?.cancel()
    debounceJob = CoroutineScope(Dispatchers.Main).launch {
      delay(delayMillis)
      action()
    }
  }
}
