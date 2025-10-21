package com.margelo.nitro.at.g4rb4g3.autoplay.hybrid

import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.ListTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.MessageTemplate

class HybridMessageTemplate : HybridHybridMessageTemplateSpec() {

    override fun createMessageTemplate(config: MessageTemplateConfig) {
        val context = AndroidAutoSession.Companion.getRootContext()
            ?: throw IllegalArgumentException("createMessageTemplate failed, carContext not found")

        val template = MessageTemplate(context, config)
        AndroidAutoTemplate.Companion.setTemplate(config.id, template)
    }
}