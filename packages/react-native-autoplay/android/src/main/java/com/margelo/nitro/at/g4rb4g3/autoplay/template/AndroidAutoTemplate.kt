package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.Template

abstract class AndroidAutoTemplate<T>(val context: CarContext, var config: T) {
    abstract fun parse(): Template

    companion object {
        const val TAG = "AndroidAutoTemplate"
        val templates = mutableMapOf<String, AndroidAutoTemplate<*>>()

        fun <T> setTemplate(id: String, template: AndroidAutoTemplate<T>,) {
            templates.put(id, template)
        }

        fun getTemplate(id: String): Template? {
            return templates[id]?.parse()
        }

        fun getConfig(id: String): Any? {
            return templates[id]?.config
        }

        fun removeTemplate(id: String) {
            templates.remove(id)
        }
    }
}