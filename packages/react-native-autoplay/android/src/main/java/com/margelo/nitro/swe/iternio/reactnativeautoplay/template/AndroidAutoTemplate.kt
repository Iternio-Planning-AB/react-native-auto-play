package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Template
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AndroidAutoScreen
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.TemplateNotFoundException
import java.util.concurrent.ConcurrentHashMap

abstract class AndroidAutoTemplate<T>(val context: CarContext, var config: T) {
    abstract fun parse(): Template
    abstract fun setTemplateHeaderActions(headerActions: Array<NitroAction>?)

    abstract fun onWillAppear()
    abstract fun onWillDisappear()
    abstract fun onDidAppear()
    abstract fun onDidDisappear()
    abstract fun onPopped()

    abstract val isRenderTemplate: Boolean
    abstract val templateId: String
    abstract val autoDismissMs: Double?

    fun applyConfigUpdate() {
        val screen = AndroidAutoScreen.getScreen(templateId)
        screen?.applyConfigUpdate(invalidate = true)
    }

    companion object {
        const val TAG = "AndroidAutoTemplate"
        val templates = ConcurrentHashMap<String, AndroidAutoTemplate<*>>()

        fun <T> setTemplate(id: String, template: AndroidAutoTemplate<T>) {
            templates[id] = template
        }

        fun getTemplate(id: String): AndroidAutoTemplate<*>? {
            return templates[id]
        }

        inline fun <reified T> getTemplate(id: String): T {
            val template = templates[id] as? T
            return template ?: throw TemplateNotFoundException(id)
        }

        inline fun <reified T> hasTemplate(id: String): Boolean {
            return templates[id] is T
        }

        fun getConfig(id: String): Any? {
            return templates[id]?.config
        }

        inline fun <reified T> getTypedConfig(id: String): T? {
            val config = templates[id]?.config
            if (config is T) {
                return config
            }
            return null
        }

        /**
         * returns the top screen hosting a MessageTemplate, null in case none is available
         */
        fun getTopMessageTemplate(): Screen? {
            val screenManager = AndroidAutoScreen.getScreenManager()
                ?: throw IllegalArgumentException("getMessageTemplate failed, screenManager not found")

            var topMessageScreen: Screen? = null

            if (screenManager.screenStack.isNotEmpty()) {
                screenManager.top.marker?.let {
                    if (hasTemplate<MessageTemplate>(it)) {
                        topMessageScreen = screenManager.top
                    }
                }
            }

            return topMessageScreen
        }
    }
}