package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MessageTemplate

class HybridMessageTemplate : HybridMessageTemplateSpec() {

    override fun createMessageTemplate(config: MessageTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createMessageTemplate failed, carContext not found")

        val template = MessageTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }
}