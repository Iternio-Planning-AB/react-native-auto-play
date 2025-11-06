package com.margelo.nitro.at.g4rb4g3.autoplay.hybrid

import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.InformationTemplate

class HybridInformationTemplate : HybridHybridInformationTemplateSpec() {
    override fun createInformationTemplate(config: InformationTemplateConfig) {
        val context = AndroidAutoSession.Companion.getRootContext()
            ?: throw IllegalArgumentException("createInformationTemplate failed, carContext not found")

        val template = InformationTemplate(context, config)
        AndroidAutoTemplate.Companion.setTemplate(config.id, template)
    }

    override fun updateInformationTemplateSections(
        templateId: String,
        section: NitroSection
    ) {
        val template = AndroidAutoTemplate.Companion.getTemplate<InformationTemplate>(templateId)
        template.updateSection(section)
    }
}