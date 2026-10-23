package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.SearchTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.TemplateUpdateQueue

class HybridSearchTemplate : HybridSearchTemplateSpec() {

    override fun createSearchTemplate(config: SearchTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createSearchTemplate failed, carContext not found")

        val template = SearchTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateSearchResults(templateId: String, results: NitroSection): Promise<Unit> {
        return TemplateUpdateQueue.enqueue {
            val template = AndroidAutoTemplate.getTemplate<SearchTemplate>(templateId)
            template.updateSearchResults(results)
        }
    }
}
