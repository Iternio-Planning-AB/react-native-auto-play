package com.margelo.nitro.at.g4rb4g3.autoplay.hybrid

import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.VirtualRenderer
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.ThreadUtil
import com.margelo.nitro.core.Promise

class HybridAutoPlay : HybridHybridAutoPlaySpec() {
    override fun addListener(
        eventType: EventName, callback: () -> Unit
    ): () -> Unit {
        val callbacks = listeners.getOrPut(eventType) { mutableListOf() }
        callbacks.add(callback)

        if (eventType == EventName.DIDCONNECT && AndroidAutoSession.Companion.getIsConnected()) {
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

        AndroidAutoSession.Companion.getState(mapTemplateId)?.let {
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

    override fun setTemplateHeaderActions(
        templateId: String, headerActions: Array<NitroAction>?
    ) {
        val template =
            AndroidAutoTemplate.Companion.getTemplate(templateId) ?: throw IllegalArgumentException(
                "setTemplateHeaderActions failed, template $templateId not found"
            )
        template.setTemplateHeaderActions(headerActions)
    }

    override fun setRootTemplate(templateId: String): Promise<Unit> {
        return Promise.Companion.async {
            val template = AndroidAutoTemplate.Companion.getTemplate(templateId)
                ?: throw IllegalArgumentException("setRootTemplate failed, $templateId template not found")

            if (template.isRenderTemplate) {
                val screen = AndroidAutoScreen.Companion.getScreen(templateId)
                    ?: throw IllegalArgumentException("setRootTemplate failed, $templateId screen not found")
                val carContext = AndroidAutoSession.Companion.getCarContext(templateId)
                    ?: throw IllegalArgumentException("setRootTemplate failed, carContext for $templateId template not found")

                screen.applyConfigUpdate(invalidate = true)

                if (!VirtualRenderer.Companion.hasRenderer(templateId)) {
                    val result = ThreadUtil.postOnUiAndAwait {
                        VirtualRenderer(carContext, templateId)
                    }
                    if (result.isFailure) {
                        throw result.exceptionOrNull()
                            ?: UnknownError("unknown error initializing the virtual screen")
                    }
                }
            } else {
                val screenManager = AndroidAutoScreen.Companion.getScreenManager()
                    ?: throw IllegalArgumentException("setRootTemplate failed, screenManager not found")
                val carContext =
                    AndroidAutoSession.Companion.getCarContext(AndroidAutoSession.Companion.ROOT_SESSION)
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
        return Promise.Companion.async {
            val context = AndroidAutoSession.Companion.getRootContext()
                ?: throw IllegalArgumentException("pushTemplate failed, carContext not found")
            val template = AndroidAutoTemplate.Companion.getTemplate(templateId)
                ?: throw IllegalArgumentException("pushTemplate failed, template $templateId not found")
            val screenManager = AndroidAutoScreen.Companion.getScreenManager()
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

    override fun popTemplate(animate: Boolean?): Promise<Unit> {
        return Promise.Companion.async {
            val screenManager = AndroidAutoScreen.Companion.getScreenManager()
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

    override fun popToRootTemplate(animate: Boolean?): Promise<Unit> {
        return Promise.Companion.async {
            val screenManager = AndroidAutoScreen.Companion.getScreenManager()
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

    override fun popToTemplate(templateId: String, animate: Boolean?): Promise<Unit> {
        return Promise.Companion.async {
            val screenManager = AndroidAutoScreen.Companion.getScreenManager()
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