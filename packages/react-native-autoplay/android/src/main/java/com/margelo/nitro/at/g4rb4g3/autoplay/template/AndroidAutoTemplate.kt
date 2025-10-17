package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction

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

    fun applyConfigUpdate() {
        val screen = AndroidAutoScreen.getScreen(templateId)
        screen?.applyConfigUpdate(invalidate = true)
    }

    companion object {
        const val TAG = "AndroidAutoTemplate"
        val templates = mutableMapOf<String, AndroidAutoTemplate<*>>()

        fun <T> setTemplate(id: String, template: AndroidAutoTemplate<T>) {
            templates.put(id, template)
        }

        fun getTemplate(id: String): AndroidAutoTemplate<*>? {
            return templates[id]
        }

        inline fun <reified T> getTemplate(id: String): T {
            val template = templates[id] as? T
            return template ?: throw IllegalArgumentException()
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
    }
}