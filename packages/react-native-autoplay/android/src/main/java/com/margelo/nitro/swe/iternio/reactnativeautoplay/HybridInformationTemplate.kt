package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.InformationTemplate

class HybridInformationTemplate : HybridInformationTemplateSpec() {
    override fun createInformationTemplate(config: InformationTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createInformationTemplate failed, carContext not found")

        val template = InformationTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateInformationTemplateSections(
        templateId: String, section: NitroSection
    ): Promise<Unit> {
        return Promise.async {
            val template = AndroidAutoTemplate.getTemplate<InformationTemplate>(templateId)
            template.updateSection(section)
        }
    }
}