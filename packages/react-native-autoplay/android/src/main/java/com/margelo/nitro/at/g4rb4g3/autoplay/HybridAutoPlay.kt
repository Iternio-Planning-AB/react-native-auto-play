package com.margelo.nitro.at.g4rb4g3.autoplay

import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession.Companion.ROOT_SESSION
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.GridTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.ListTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.MapTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.RoutePreviewTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.TripPreviewTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ThreadUtil
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
        val template = AndroidAutoTemplate.getTemplate(templateId)
        if (template !is MapTemplate) {
            throw IllegalArgumentException("setTemplateMapButtons failed, template $templateId is not of type MapTemplate")
        }

        template.setMapActions(buttons)
    }

    override fun setTemplateActions(
        templateId: String, actions: Array<NitroAction>?
    ) {
        val template = AndroidAutoTemplate.getTemplate(templateId)
            ?: throw IllegalArgumentException("setTemplateActions failed, template $templateId not found")
        template.setTemplateActions(actions)
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

    override fun createMapTemplate(config: MapTemplateConfig) {
        val context = AndroidAutoSession.getCarContext(config.id) ?: throw IllegalArgumentException(
            "createMapTemplate failed, carContext found"
        )

        val template = MapTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun showNavigationAlert(templateId: String, alert: NitroNavigationAlert) {
        val template = AndroidAutoTemplate.getTemplate(templateId) as? MapTemplate
            ?: throw IllegalArgumentException(
                "showNavigationAlert failed, $templateId not of instance MapTemplate"
            )
        template.showAlert(alert)
    }

    override fun showTripSelector(
        templateId: String,
        trips: Array<TripConfig>,
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: (String, String?) -> Unit
    ) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("showTripSelector failed, carContext not found")
        val screenManager = AndroidAutoScreen.getScreenManager()
            ?: throw IllegalArgumentException("showTripSelector failed, screenManager not found")

        val screen = TripPreviewTemplate(context, trips, selectedTripId, textConfig, onTripSelected)

        UiThreadUtil.runOnUiThread {
            screenManager.push(screen)
        }
    }

    override fun hideTripSelector(templateId: String) {
        val screenManager = AndroidAutoScreen.getScreenManager()
            ?: throw IllegalArgumentException("hideTripSelector failed, screenManager not found")
        val screens = screenManager.screenStack.filter {
            it.marker == TripPreviewTemplate.TAG || it.marker === RoutePreviewTemplate.TAG
        }

        UiThreadUtil.runOnUiThread {
            screens.forEach {
                it.finish()
            }
        }
    }

    override fun createListTemplate(config: ListTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createListTemplate failed, carContext not found")

        val template = ListTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateListTemplateSections(
        templateId: String, sections: Array<NitroSection>?
    ) {
        val template = AndroidAutoTemplate.getTemplate(templateId)
            ?: throw IllegalArgumentException("updateListTemplateSections failed, template $templateId not found")

        if (template !is ListTemplate) {
            throw IllegalArgumentException("setTemplateMapButtons failed, template $templateId is not of type ListTemplate")
        }

        template.updateSections(sections)
    }

    override fun createGridTemplate(config: GridTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createListTemplate failed, carContext found")

        val template = GridTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateGridTemplateButtons(
        templateId: String, buttons: Array<NitroGridButton>
    ) {
        val template = AndroidAutoTemplate.getTemplate(templateId)
            ?: throw IllegalArgumentException("updateGridTemplateButtons failed, template $templateId not found")

        if (template !is GridTemplate) {
            throw IllegalArgumentException("updateGridTemplateButtons failed, template $templateId is not of type GridTemplate")
        }

        template.updateButtons(buttons)
    }

    override fun setRootTemplate(templateId: String): Promise<Unit> {
        return Promise.async {
            val template = AndroidAutoTemplate.getTemplate(templateId)
                ?: throw IllegalArgumentException("setRootTemplate failed, $templateId template not found")

            if (template.isRenderTemplate) {
                val screen = AndroidAutoScreen.getScreen(templateId)
                    ?: throw IllegalArgumentException("setRootTemplate failed, $templateId screen not found")
                val carContext = AndroidAutoSession.getCarContext(templateId)
                    ?: throw IllegalArgumentException("setRootTemplate failed, carContext for $templateId template not found")

                screen.applyConfigUpdate(invalidate = true)

                if (!VirtualRenderer.hasRenderer(templateId)) {
                    val result = ThreadUtil.postOnUiAndAwait {
                        VirtualRenderer(carContext, templateId)
                    }
                    if (result.isFailure) {
                        throw result.exceptionOrNull()
                            ?: UnknownError("unknown error initializing the virtual screen")
                    }
                }
            } else {
                val screenManager = AndroidAutoScreen.getScreenManager()
                    ?: throw IllegalArgumentException("setRootTemplate failed, screenManager not found")
                val carContext = AndroidAutoSession.getCarContext(ROOT_SESSION)
                    ?: throw IllegalArgumentException("setRootTemplate failed, carContext for $templateId template not found")

                val result = ThreadUtil.postOnUiAndAwait {
                    screenManager.popToRoot()
                    val previousRootScreen = screenManager.top

                    val screen = AndroidAutoScreen(carContext, templateId, template.parse())
                    screenManager.push(screen)

                    screenManager.remove(previousRootScreen)
                }

                if (result.isFailure) {
                    throw result.exceptionOrNull()
                        ?: UnknownError("unknown error setting root template")
                }
            }
        }
    }

    override fun pushTemplate(templateId: String): Promise<Unit> {
        return Promise.async {
            val context = AndroidAutoSession.getRootContext()
                ?: throw IllegalArgumentException("pushTemplate failed, carContext not found")
            val template = AndroidAutoTemplate.getTemplate(templateId)
                ?: throw IllegalArgumentException("pushTemplate failed, template $templateId not found")
            val screenManager = AndroidAutoScreen.getScreenManager()
                ?: throw IllegalArgumentException("pushTemplate failed, screenManager not found")

            val result = ThreadUtil.postOnUiAndAwait {
                val screen = AndroidAutoScreen(context, templateId, template.parse())
                screenManager.push(screen)
            }

            if (result.isFailure) {
                throw result.exceptionOrNull() ?: UnknownError("unknown error pushing template")
            }
        }
    }

    override fun popTemplate(): Promise<Unit> {
        return Promise.async {
            val screenManager = AndroidAutoScreen.getScreenManager()
                ?: throw IllegalArgumentException("popTemplate failed, screenManager not found")
            if (screenManager.stackSize == 0) {
                return@async
            }

            val result = ThreadUtil.postOnUiAndAwait {
                screenManager.pop()
            }

            if (result.isFailure) {
                throw result.exceptionOrNull() ?: UnknownError("unknown error popping template")
            }
        }
    }

    override fun popToRootTemplate(): Promise<Unit> {
        return Promise.async {
            val screenManager = AndroidAutoScreen.getScreenManager()
                ?: throw IllegalArgumentException("popToRootTemplate failed, screenManager not found")
            if (screenManager.stackSize == 0) {
                return@async
            }

            val result = ThreadUtil.postOnUiAndAwait {
                screenManager.popToRoot()
            }

            if (result.isFailure) {
                throw result.exceptionOrNull() ?: UnknownError("unknown error popping template")
            }
        }
    }

    override fun popToTemplate(templateId: String): Promise<Unit> {
        return Promise.async {
            val screenManager = AndroidAutoScreen.getScreenManager()
                ?: throw IllegalArgumentException("pushTemplate failed, screenManager not found")
            if (screenManager.stackSize == 0) {
                return@async
            }

            val result = ThreadUtil.postOnUiAndAwait {
                screenManager.popTo(templateId)
            }

            if (result.isFailure) {
                throw result.exceptionOrNull()
                    ?: UnknownError("unknown error popping template $templateId")
            }
        }
    }

    companion object {
        const val TAG = "HybridAutoPlay"

        private val listeners = mutableMapOf<EventName, MutableList<() -> Unit>>()

        private val renderStateListeners =
            mutableMapOf<String, MutableList<(VisibilityState) -> Unit>>()
        private val safeAreaInsetsListeners =
            mutableMapOf<String, MutableList<(SafeAreaInsets) -> Unit>>()


        fun removeListeners(templateId: String) {
            renderStateListeners.remove(templateId)
            safeAreaInsetsListeners.remove(templateId)
        }

        fun emit(event: EventName) {
            listeners[event]?.forEach { it() }
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