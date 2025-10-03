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
        val callbacks = templateStateListeners.getOrPut(templateId) {
            mutableListOf()
        }
        callbacks.add(callback)

        return {
            templateStateListeners[templateId]?.let {
                it.remove(callback)
                if (it.isEmpty()) {
                    templateStateListeners.remove(templateId)
                }
            }
        }
    }

    override fun addListenerRenderState(
        mapTemplateId: String, callback: (VisibilityState) -> Unit
    ): () -> Unit {
        val callbacks = renderStateListeners.getOrPut(mapTemplateId) {
            mutableListOf()
        }
        callbacks.add(callback)

        AndroidAutoSession.getState(mapTemplateId)?.let {
            callback(it)
        }

        return {
            renderStateListeners[mapTemplateId]?.let {
                it.remove(callback)
                if (it.isEmpty()) {
                    renderStateListeners.remove(mapTemplateId)
                }
            }
        }
    }

    override fun createAlertTemplate(config: AlertTemplateConfig) {
        // TODO
    }

    override fun presentTemplate(templateId: String) {
        // TODO
    }

    override fun dismissTemplate(templateId: String) {
        // TODO
    }

    override fun createMapTemplate(config: NitroMapTemplateConfig) {
        addListenerTemplateState(config.id) { state ->
            when (state.state) {
                VisibilityState.WILLAPPEAR -> config.onWillAppear?.let { it() }
                VisibilityState.DIDAPPEAR -> config.onDidAppear?.let { it() }
                VisibilityState.WILLDISAPPEAR -> config.onWillDisappear?.let { it() }
                VisibilityState.DIDDISAPPEAR -> config.onDidDisappear?.let { it() }
            }
        }
    }

    override fun setRootTemplate(templateId: String) {
        // TODO
    }

    companion object {
        val TAG = "HybridAutoPlay"
        private val listeners = mutableMapOf<EventName, MutableList<() -> Unit>>()
        private val didPressListeners = mutableListOf<(PressEventPayload) -> Unit>()
        private val didUpdatePinchGestureListeners =
            mutableListOf<(PinchGestureEventPayload) -> Unit>()
        private val didUpdatePanGestureWithTranslationListeners =
            mutableListOf<(PanGestureWithTranslationEventPayload) -> Unit>()

        private val templateStateListeners =
            mutableMapOf<String, MutableList<(TemplateEventPayload) -> Unit>>()
        private val renderStateListeners =
            mutableMapOf<String, MutableList<(VisibilityState) -> Unit>>()

        fun emit(event: EventName) {
            listeners[event]?.forEach { it() }
        }

        fun emitTemplateState(templateId: String, templateState: VisibilityState) {
            templateStateListeners[templateId]?.forEach {
                it(TemplateEventPayload(null, templateState))
            }
        }

        fun emitRenderState(mapTemplateId: String, state: VisibilityState) {
            renderStateListeners[mapTemplateId]?.forEach {
                it(state)
            }
        }
    }
}