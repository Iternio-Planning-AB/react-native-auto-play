package com.margelo.nitro.at.g4rb4g3.autoplay

import com.margelo.nitro.at.g4rb4g3.autoplay.template.MapTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.TemplateStore
import com.margelo.nitro.core.Promise
import java.security.InvalidParameterException

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


    override fun addSafeAreaInsetsListener(
        moduleName: String, callback: (SafeAreaInsets) -> Unit
    ): () -> Unit {
        val callbacks = safeAreaInsetsListeners.getOrPut(moduleName) {
            mutableListOf()
        }
        callbacks.add(callback)

        return {
            safeAreaInsetsListeners[moduleName]?.let {
                it.remove(callback)
                if (it.isEmpty()) {
                    safeAreaInsetsListeners.remove(moduleName)
                }
            }
        }
    }

    override fun setMapButtons(
        templateId: String,
        buttons: Array<NitroMapButton>?
    ) {
        val template = TemplateStore.getTemplate(templateId)
            ?: throw InvalidParameterException("setMapButtons failed, template $templateId not found")
        val screen = AndroidAutoScreen.getScreen(AndroidAutoSession.ROOT_SESSION)
            ?: throw InvalidParameterException("setMapButtons failed, no screen found")

        if (template is MapTemplate) {
            val config = template.config.copy(mapButtons = buttons)
            val mapTemplate = MapTemplate(config)
            TemplateStore.addTemplate(templateId, mapTemplate)
            screen.setTemplate(mapTemplate.template, true,  true)
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

    override fun createMapTemplate(config: NitroMapTemplateConfig): () -> Unit {
        val removeTemplateStateListener = addListenerTemplateState(config.id) { state ->
            when (state) {
                VisibilityState.WILLAPPEAR -> config.onWillAppear?.let { it(null) }
                VisibilityState.DIDAPPEAR -> config.onDidAppear?.let { it(null) }
                VisibilityState.WILLDISAPPEAR -> config.onWillDisappear?.let { it(null) }
                VisibilityState.DIDDISAPPEAR -> config.onDidDisappear?.let { it(null) }
            }
        }

        val template = MapTemplate(config)
        TemplateStore.addTemplate(config.id, template)

        return {
            removeTemplateStateListener()
        }
    }

    override fun setRootTemplate(templateId: String): Promise<String?> {
        return Promise.async {
            val screen = AndroidAutoScreen.getScreen(AndroidAutoSession.ROOT_SESSION)
                ?: return@async "setRootTemplate failed, no screen found"
            val template = TemplateStore.getTemplate(templateId)
                ?: return@async "setRootTemplate failed, specified template not found"

            screen.setTemplate(template.template, true, true)
            return@async null
        }
    }

    companion object {
        val TAG = "HybridAutoPlay"
        private val listeners = mutableMapOf<EventName, MutableList<() -> Unit>>()

        private val templateStateListeners =
            mutableMapOf<String, MutableList<(VisibilityState) -> Unit>>()
        private val renderStateListeners =
            mutableMapOf<String, MutableList<(VisibilityState) -> Unit>>()
        private val safeAreaInsetsListeners =
            mutableMapOf<String, MutableList<(SafeAreaInsets) -> Unit>>()

        fun addListenerTemplateState(
            templateId: String, callback: (VisibilityState) -> Unit
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

        fun emit(event: EventName) {
            listeners[event]?.forEach { it() }
        }

        fun emitTemplateState(templateId: String, templateState: VisibilityState) {
            templateStateListeners[templateId]?.forEach {
                it(templateState)
            }
        }

        fun emitRenderState(mapTemplateId: String, state: VisibilityState) {
            renderStateListeners[mapTemplateId]?.forEach {
                it(state)
            }
        }

        fun emitSafeAreaInsets(
            moduleName: String,
            top: Double,
            bottom: Double,
            left: Double,
            right: Double,
            isLegacyLayout: Boolean
        ) {
            val insets = SafeAreaInsets(
                top = top,
                bottom = bottom,
                left = left,
                right = right,
                isLegacyLayout = isLegacyLayout
            )
            safeAreaInsetsListeners[moduleName]?.forEach {
                it(insets)
            }
        }
    }
}