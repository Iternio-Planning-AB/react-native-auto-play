package com.margelo.nitro.at.g4rb4g3.autoplay

class HybridAutoPlay : HybridAutoPlaySpec() {
    override fun addListener(
        eventType: EventName, callback: () -> Unit
    ): () -> Unit {
        val callbacks = listeners.getOrPut(eventType) { mutableListOf() }
        callbacks.add(callback)

        if (eventType == EventName.DIDCONNECT && AndroidAutoSession.getIsConnected()) {
            callback()
        }

        return {
            listeners[eventType]?.removeAll { it === callback }
        }
    }

    override fun addListenerDidPress(callback: (PressEvent) -> Unit): () -> Unit {
        didPressListeners.add(callback)

        return {
            didPressListeners.removeAll { it === callback }
        }
    }

    override fun addListenerDidUpdatePinchGesture(callback: (PinchGestureEvent) -> Unit): () -> Unit {
        didUpdatePinchGestureListeners.add(callback)

        return {
            didUpdatePinchGestureListeners.removeAll { it === callback }
        }
    }

    override fun addListenerDidUpdatePanGestureWithTranslation(callback: (PanGestureWithTranslationEvent) -> Unit): () -> Unit {
        didUpdatePanGestureWithTranslationListeners.add(callback)

        return {
            didUpdatePanGestureWithTranslationListeners.removeAll { it === callback }
        }
    }

    override fun addListenerWillAppear(
        templateId: String, callback: (TemplateEvent?) -> Unit
    ): () -> Unit {
        val callbacks = willAppearListeners.getOrPut(templateId) { mutableListOf() }
        callbacks.add(callback)

        return {
            willAppearListeners[templateId]?.removeAll { it === callback }
            if (willAppearListeners[templateId]?.isEmpty() == true) {
                willAppearListeners.remove(templateId)
            }
        }
    }

    override fun addListenerDidAppear(
        templateId: String, callback: (TemplateEvent?) -> Unit
    ): () -> Unit {
        val callbacks = didAppearListeners.getOrPut(templateId) { mutableListOf() }
        callbacks.add(callback)

        return {
            didAppearListeners[templateId]?.removeAll { it === callback }
            if (didAppearListeners[templateId]?.isEmpty() == true) {
                didAppearListeners.remove(templateId)
            }
        }
    }

    override fun addListenerWillDisappear(
        templateId: String, callback: (TemplateEvent?) -> Unit
    ): () -> Unit {
        val callbacks = willDisappearListeners.getOrPut(templateId) { mutableListOf() }
        callbacks.add(callback)

        return {
            willDisappearListeners[templateId]?.removeAll { it === callback }
            if (willDisappearListeners[templateId]?.isEmpty() == true) {
                willDisappearListeners.remove(templateId)
            }
        }
    }

    override fun addListenerDidDisappear(
        templateId: String, callback: (TemplateEvent?) -> Unit
    ): () -> Unit {
        val callbacks = didDisappearListeners.getOrPut(templateId) { mutableListOf() }
        callbacks.add(callback)

        return {
            didDisappearListeners[templateId]?.removeAll { it === callback }
            if (didDisappearListeners[templateId]?.isEmpty() == true) {
                didDisappearListeners.remove(templateId)
            }
        }
    }

    companion object {
        private val listeners = mutableMapOf<EventName, MutableList<() -> Unit>>()
        private val didPressListeners = mutableListOf<(PressEvent) -> Unit>()
        private val didUpdatePinchGestureListeners = mutableListOf<(PinchGestureEvent) -> Unit>()
        private val didUpdatePanGestureWithTranslationListeners =
            mutableListOf<(PanGestureWithTranslationEvent) -> Unit>()

        private val willAppearListeners =
            mutableMapOf<String, MutableList<(TemplateEvent?) -> Unit>>()
        private val didAppearListeners =
            mutableMapOf<String, MutableList<(TemplateEvent?) -> Unit>>()
        private val willDisappearListeners =
            mutableMapOf<String, MutableList<(TemplateEvent?) -> Unit>>()
        private val didDisappearListeners =
            mutableMapOf<String, MutableList<(TemplateEvent?) -> Unit>>()

        fun emit(event: EventName) {
            listeners[event]?.forEach { it() }
        }

        fun emitWillAppear(templateId: String) {
            willAppearListeners[templateId]?.forEach { it(null) }
        }

        fun emitDidAppear(templateId: String) {
            didAppearListeners[templateId]?.forEach { it(null) }
        }

        fun emitWillDisappear(templateId: String) {
            willDisappearListeners[templateId]?.forEach { it(null) }
        }

        fun emitDidDisappear(templateId: String) {
            didDisappearListeners[templateId]?.forEach { it(null) }
        }
    }
}