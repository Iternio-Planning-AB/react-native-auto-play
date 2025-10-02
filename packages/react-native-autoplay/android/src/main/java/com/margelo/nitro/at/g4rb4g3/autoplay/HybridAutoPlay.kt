package com.margelo.nitro.at.g4rb4g3.autoplay

import android.util.Log

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

    override fun addListenerDidPress(callback: (PressEventPayload) -> Unit): () -> Unit {
        didPressListeners.add(callback)

        return {
            didPressListeners.removeAll { it === callback }
        }
    }

    override fun addListenerDidUpdatePinchGesture(callback: (PinchGestureEventPayload) -> Unit): () -> Unit {
        didUpdatePinchGestureListeners.add(callback)

        return {
            didUpdatePinchGestureListeners.removeAll { it === callback }
        }
    }

    override fun addListenerDidUpdatePanGestureWithTranslation(callback: (PanGestureWithTranslationEventPayload) -> Unit): () -> Unit {
        didUpdatePanGestureWithTranslationListeners.add(callback)

        return {
            didUpdatePanGestureWithTranslationListeners.removeAll { it === callback }
        }
    }

    override fun addListenerTemplateState(
        templateId: String, callback: (TemplateEventPayload) -> Unit
    ): () -> Unit {
        templateStateListeners[templateId] = callback

        return {
            templateStateListeners.remove(templateId)
        }
    }

    override fun addListenerRenderState(
        mapTemplateId: String, callback: (VisibilityState) -> Unit
    ): () -> Unit {
        renderStateListeners[mapTemplateId] = callback

        AndroidAutoSession.getState(mapTemplateId)?.let {
            callback(it)
        }

        return {
            renderStateListeners.remove(mapTemplateId)
        }
    }

    override fun createAlertTemplate(config: AlertTemplateConfig) {
        TODO("Not yet implemented")
    }

    override fun presentTemplate(templateId: String) {
        TODO("Not yet implemented")
    }

    override fun dismissTemplate(templateId: String) {
        TODO("Not yet implemented")
    }

    override fun createMapTemplate(config: NitroMapTemplateConfig) {
        TODO("Not yet implemented")
    }

    override fun setRootTemplate(templateId: String) {
        TODO("Not yet implemented")
    }

    companion object {
        val TAG = "HybridAutoPlay"
        private val listeners = mutableMapOf<EventName, MutableList<() -> Unit>>()
        private val didPressListeners = mutableListOf<(PressEventPayload) -> Unit>()
        private val didUpdatePinchGestureListeners =
            mutableListOf<(PinchGestureEventPayload) -> Unit>()
        private val didUpdatePanGestureWithTranslationListeners =
            mutableListOf<(PanGestureWithTranslationEventPayload) -> Unit>()

        private val templateStateListeners = mutableMapOf<String, (TemplateEventPayload) -> Unit>()
        private val renderStateListeners = mutableMapOf<String, (VisibilityState) -> Unit>()

        fun emit(event: EventName) {
            listeners[event]?.forEach { it() }
        }

        fun emitTemplateState(templateId: String, templateState: VisibilityState) {
            templateStateListeners[templateId]?.let {
                it(TemplateEventPayload(null, templateState))
            }
        }

        fun emitRenderState(mapTemplateId: String, state: VisibilityState) {
            renderStateListeners[mapTemplateId]?.let {
                it(state)
            }
        }
    }
}