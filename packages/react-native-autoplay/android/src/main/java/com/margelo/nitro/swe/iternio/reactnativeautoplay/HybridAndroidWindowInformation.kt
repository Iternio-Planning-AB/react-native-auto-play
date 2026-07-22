package com.margelo.nitro.swe.iternio.reactnativeautoplay

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CopyOnWriteArrayList

class HybridAndroidWindowInformation : HybridAndroidWindowInformationSpec() {
    init {
        windowInformationListeners.clear()
    }

    override fun addWindowInformationListener(
        moduleName: String, callback: (WindowInformation) -> Unit
    ): () -> Unit {
        val callbacks = windowInformationListeners.getOrPut(moduleName) {
            CopyOnWriteArrayList()
        }
        callbacks.add(callback)

        VirtualRenderer.getWindowInformation(moduleName)?.let {
            callback(it)
        }

        return {
            windowInformationListeners[moduleName]?.let {
                it.remove(callback)
                if (it.isEmpty()) {
                    windowInformationListeners.remove(moduleName)
                }
            }
        }
    }

    companion object {
        const val TAG = "HybridAndroidWindowInformation"

        private val windowInformationListeners =
            ConcurrentHashMap<String, CopyOnWriteArrayList<(WindowInformation) -> Unit>>()

        fun removeListeners(templateId: String) {
            windowInformationListeners.remove(templateId)
        }

        fun emitWindowInformation(moduleName: String, window: WindowInformation) {
            windowInformationListeners[moduleName]?.forEach {
                it(window)
            }
        }
    }
}
