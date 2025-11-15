package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.SearchTemplate

class HybridSearchTemplate : HybridSearchTemplateSpec() {

    override fun createSearchTemplate(config: SearchTemplateConfig) {
        val context = AndroidAutoSession.Companion.getRootContext()
            ?: throw IllegalArgumentException("createSearchTemplate failed, carContext not found")

        val template = SearchTemplate(context, config)
        AndroidAutoTemplate.Companion.setTemplate(config.id, template)
    }

    override fun updateSearchResults(templateId: String, results: NitroSection) {
        val template = AndroidAutoTemplate.Companion.getTemplate<SearchTemplate>(templateId)
        template.updateSearchResults(results)
    }
}