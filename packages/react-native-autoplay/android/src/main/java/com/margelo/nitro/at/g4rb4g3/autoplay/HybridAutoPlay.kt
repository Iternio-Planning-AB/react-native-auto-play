package com.margelo.nitro.at.g4rb4g3.autoplay

import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession.Companion.ROOT_SESSION
import com.margelo.nitro.at.g4rb4g3.autoplay.template.ListTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.MapTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.TemplateStore
import com.margelo.nitro.at.g4rb4g3.autoplay.template.ThreadUtil
import com.margelo.nitro.core.Promise

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

    override fun setTemplateMapButtons(
        templateId: String, buttons: Array<NitroMapButton>?
    ) {
        val config = TemplateStore.getConfig(templateId) as NitroMapTemplateConfig?
            ?: throw IllegalArgumentException("setMapButtons failed, template $templateId not found or not of type MapTemplate")
        val screen = AndroidAutoScreen.getScreen(ROOT_SESSION)
            ?: throw IllegalArgumentException("setMapButtons failed, no screen found")
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("setMapButtons failed, carContext found")

        val mapTemplate = MapTemplate(context, config.copy(mapButtons = buttons))
        TemplateStore.setTemplate(templateId, mapTemplate)
        screen.setTemplate(mapTemplate.parse(), true)
    }

    override fun setTemplateActions(
        templateId: String, actions: Array<NitroAction>?
    ) {
        val config = TemplateStore.getConfig(templateId)
            ?: throw IllegalArgumentException("setTemplateActions failed, template $templateId not found")
        val screen = AndroidAutoScreen.getScreen(ROOT_SESSION)
            ?: throw IllegalArgumentException("setTemplateActions failed, no screen found")
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("setTemplateActions failed, carContext found")

        val template = if (config is NitroMapTemplateConfig) {
            MapTemplate(context, config.copy(actions = actions))
        } else if (config is NitroListTemplateConfig) {
            ListTemplate(context, config.copy(actions = actions))
        } else {
            null
        } ?: throw ClassNotFoundException("failed to map ${config::class.simpleName}")

        TemplateStore.setTemplate(templateId, template)
        screen.setTemplate(template.parse(), true)
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

    fun addTemplateStateListener(
        templateId: String,
        onWillAppear: Func_void_std__optional_bool_?,
        onDidAppear: Func_void_std__optional_bool_?,
        onWillDisappear: Func_void_std__optional_bool_?,
        onDidDisappear: Func_void_std__optional_bool_?
    ): () -> Unit {
        return addListenerTemplateState(templateId) { state ->
            when (state) {
                VisibilityState.WILLAPPEAR -> onWillAppear?.let { it(null) }
                VisibilityState.DIDAPPEAR -> onDidAppear?.let { it(null) }
                VisibilityState.WILLDISAPPEAR -> onWillDisappear?.let { it(null) }
                VisibilityState.DIDDISAPPEAR -> onDidDisappear?.let { it(null) }
            }
        }
    }

    override fun createMapTemplate(config: NitroMapTemplateConfig): () -> Unit {
        val removeTemplateStateListener = addTemplateStateListener(
            config.id,
            config.onWillAppear,
            config.onDidAppear,
            config.onWillDisappear,
            config.onDidDisappear
        )

        val context = AndroidAutoSession.getCarContext(config.id)
            ?: throw IllegalArgumentException("createMapTemplate failed, carContext found")

        val template = MapTemplate(context, config)
        TemplateStore.setTemplate(config.id, template)

        return {
            removeTemplateStateListener()
        }
    }

    override fun createListTemplate(config: NitroListTemplateConfig): () -> Unit {
        val removeTemplateStateListener = addTemplateStateListener(
            config.id,
            config.onWillAppear,
            config.onDidAppear,
            config.onWillDisappear,
            config.onDidDisappear
        )

        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createListTemplate failed, carContext found")

        val template = ListTemplate(context, config)
        TemplateStore.setTemplate(config.id, template)

        return {
            removeTemplateStateListener()
        }
    }

    override fun setRootTemplate(templateId: String): Promise<String?> {
        return Promise.async {
            val screen = AndroidAutoScreen.getScreen(templateId)
                ?: return@async "setRootTemplate failed, $templateId screen found"
            val template = TemplateStore.getTemplate(templateId)
                ?: return@async "setRootTemplate failed, $templateId template not found"
            val isCluster = templateId != ROOT_SESSION
            val carContext = AndroidAutoSession.getCarContext(templateId)
                ?: return@async "setRootTemplate failed, carContext for $templateId template not found"

            if (virtualScreens[templateId] == null) {
                val result = ThreadUtil.postOnUiAndAwait {
                    virtualScreens[templateId] = VirtualRenderer(carContext, templateId, isCluster)
                }
                if (result.isFailure) {
                    return@async result.exceptionOrNull()?.message
                        ?: "unknown error initializing the virtual screen"
                }
            }

            screen.setTemplate(template, true)
            return@async null
        }
    }

    override fun pushTemplate(templateId: String): Promise<String?> {
        return Promise.async {
            val context = AndroidAutoSession.getRootContext()
                ?: return@async "pushTemplate failed, carContext not found"
            val template = TemplateStore.getTemplate(templateId)
                ?: return@async "pushTemplate failed, template $templateId not found"
            val screenManager = AndroidAutoScreen.getScreenManager(ROOT_SESSION)
                ?: return@async "pushTemplate failed, screenManager not found"

            return@async ThreadUtil.postOnUiAndAwait {
                val screen = AndroidAutoScreen(context, false, templateId, template)
                screenManager.push(screen)
            }.exceptionOrNull()?.message
        }
    }

    override fun popTemplate(): Promise<String?> {
        return Promise.async {
            val screenManager = AndroidAutoScreen.getScreenManager(ROOT_SESSION)
                ?: return@async "pushTemplate failed, screenManager not found"
            if (screenManager.stackSize == 0) {
                return@async null
            }

            return@async ThreadUtil.postOnUiAndAwait {
                screenManager.pop()
            }.exceptionOrNull()?.message
        }
    }

    companion object {
        val TAG = "HybridAutoPlay"
        private val virtualScreens = mutableMapOf<String, VirtualRenderer>()

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