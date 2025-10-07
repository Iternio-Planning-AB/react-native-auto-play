package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.model.Template

object TemplateStore {
    private val templates = mutableMapOf<String, Template>()
    private val configs = mutableMapOf<String, Any>()

    fun setTemplate(id: String, template: Template, config: Any) {
        templates.put(id, template)
        configs.put(id, config)
    }

    fun getTemplate(id: String): Template? {
        return templates.get(id)
    }

    fun getConfig(id: String): Any? {
        return configs.get(id)
    }
}