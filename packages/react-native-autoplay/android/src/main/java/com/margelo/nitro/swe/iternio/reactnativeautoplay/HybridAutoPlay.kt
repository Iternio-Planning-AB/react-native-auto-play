package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MessageTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.ThreadUtil

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

    override fun isConnected(): Boolean {
        return AndroidAutoSession.getIsConnected()
    }

    override fun addListenerRenderState(
        moduleName: String, callback: (VisibilityState) -> Unit
    ): () -> Unit {
        val callbacks = renderStateListeners.getOrPut(moduleName) {
            mutableListOf()
        }
        callbacks.add(callback)

        if (moduleName == "main") {
            callback(ActivityRenderStateProvider.currentState)
        } else {
            AndroidAutoSession.getState(moduleName)?.let {
                callback(it)
            }
        }

        return {
            renderStateListeners[moduleName]?.let {
                it.remove(callback)
                if (it.isEmpty()) {
                    renderStateListeners.remove(moduleName)
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
    ): Promise<Unit> {
        return Promise.async {
            val template =
                AndroidAutoTemplate.getTemplate(templateId) ?: throw IllegalArgumentException(
                    "setTemplateHeaderActions failed, template $templateId not found"
                )
            template.setTemplateHeaderActions(headerActions)
        }
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
                val carContext = AndroidAutoSession.getCarContext(AndroidAutoSession.ROOT_SESSION)
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
                val topMessageScreen = AndroidAutoTemplate.getTopMessageTemplate()

                val screen = AndroidAutoScreen(context, templateId, template.parse())
                screenManager.push(screen)

                template.autoDismissMs?.let {
                    UiThreadUtil.runOnUiThread({
                        val screen =
                            if (screenManager.screenStack.isNotEmpty()) screenManager.top else null
                        if (screen?.marker == templateId) {
                            screenManager.remove(screen)
                        }
                    }, it.toLong())
                }

                topMessageScreen?.let {
                    if (AndroidAutoTemplate.hasTemplate<MessageTemplate>(templateId)) {
                        screenManager.remove(topMessageScreen)
                    } else {
                        screenManager.push(topMessageScreen)
                    }
                }
            }

            if (result.isFailure) {
                throw result.exceptionOrNull() ?: UnknownError("unknown error pushing template")
            }
        }
    }

    override fun popTemplate(animate: Boolean?): Promise<Unit> {
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

    override fun popToRootTemplate(animate: Boolean?): Promise<Unit> {
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

    override fun popToTemplate(templateId: String, animate: Boolean?): Promise<Unit> {
        return Promise.async {
            val screenManager = AndroidAutoScreen.getScreenManager()
                ?: throw IllegalArgumentException("popToTemplate failed, screenManager not found")
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

        fun emitRenderState(moduleName: String, state: VisibilityState) {
            renderStateListeners[moduleName]?.forEach {
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