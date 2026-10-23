package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.SectionedItemTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.TemplateUpdateQueue

class HybridSectionedItemTemplate : HybridSectionedItemTemplateSpec() {

    override fun createSectionedItemTemplate(config: SectionedItemTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createSectionedItemTemplate failed, carContext not found")

        val template = SectionedItemTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateSectionedItemTemplateSections(
        templateId: String, sections: Array<NitroSectionedItemSection>?
    ): Promise<Unit> {
        return TemplateUpdateQueue.enqueue {
            val template = AndroidAutoTemplate.getTemplate<SectionedItemTemplate>(templateId)
            template.updateSections(sections)
        }
    }
}
