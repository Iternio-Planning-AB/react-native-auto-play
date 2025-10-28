package com.margelo.nitro.at.g4rb4g3.autoplay.hybrid

import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.SearchTemplate

class HybridSearchTemplate : HybridHybridSearchTemplateSpec() {

    override fun createSearchTemplate(config: SearchTemplateConfig) {
        val context = AndroidAutoSession.Companion.getRootContext()
            ?: throw IllegalArgumentException("createSearchTemplate failed, carContext not found")

        val template = SearchTemplate(context, config)
        AndroidAutoTemplate.Companion.setTemplate(config.id, template)
    }

    override fun updateSearchResults(templateId: String, results: NitroSection?) {
        val template = AndroidAutoTemplate.Companion.getTemplate<SearchTemplate>(templateId)
        template.updateSearchResults(results)
    }
}