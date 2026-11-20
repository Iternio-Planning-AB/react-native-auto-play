package com.margelo.nitro.swe.iternio.reactnativeautoplay

import java.util.concurrent.CopyOnWriteArrayList

class HybridAndroidAutoNavigation : HybridAndroidAutoNavigationSpec() {
    init {
        // a React reload drops the old listeners without calling their cleanup
        navigationIntentListeners.clear()
        navigationActionListeners.clear()
    }

    override fun addListenerNavigationIntent(callback: (NavigationIntent) -> Unit): () -> Unit {
        val pending = synchronized(navigationIntentLock) {
            navigationIntentListeners.add(callback)
            pendingNavigationIntent.also { pendingNavigationIntent = null }
        }
        pending?.let { callback(it) }

        return {
            navigationIntentListeners.remove(callback)
        }
    }

    override fun addListenerNavigationAction(callback: (NavigationAction) -> Unit): () -> Unit {
        navigationActionListeners.add(callback)

        return {
            navigationActionListeners.remove(callback)
        }
    }

    companion object {
        private val navigationIntentListeners = CopyOnWriteArrayList<(NavigationIntent) -> Unit>()

        private val navigationIntentLock = Any()

        private val navigationActionListeners = CopyOnWriteArrayList<(NavigationAction) -> Unit>()

        // The intent that cold-starts the app arrives before JS registers a listener, so the last
        // one nobody received is held for the first listener. Not cleared in init for that reason,
        // only on disconnect so a stale intent does not start a trip on the next connect.
        private var pendingNavigationIntent: NavigationIntent? = null

        fun emitNavigationIntent(intent: NavigationIntent) {
            val hasListeners = synchronized(navigationIntentLock) {
                val hasListeners = navigationIntentListeners.isNotEmpty()
                pendingNavigationIntent = if (hasListeners) null else intent
                hasListeners
            }
            if (!hasListeners) {
                return
            }

            navigationIntentListeners.forEach { it(intent) }
        }

        fun emitNavigationAction(action: NavigationAction) {
            navigationActionListeners.forEach { it(action) }
        }

        fun clearPendingNavigationIntent() {
            synchronized(navigationIntentLock) {
                pendingNavigationIntent = null
            }
        }
    }
}
