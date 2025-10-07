package com.margelo.nitro.at.g4rb4g3.autoplay.template

object TemplateStore {
    private val templates = mutableMapOf<String, AndroidAutoTemplate>()

    fun addTemplate(id: String, template: AndroidAutoTemplate) {
        templates.put(id, template)
    }

    fun getTemplate(id: String): AndroidAutoTemplate? {
        return templates.get(id)
    }
}