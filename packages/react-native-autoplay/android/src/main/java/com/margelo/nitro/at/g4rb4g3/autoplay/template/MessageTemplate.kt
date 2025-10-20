package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.CarText
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.MessageTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction

class MessageTemplate(context: CarContext, config: MessageTemplateConfig) :
    AndroidAutoTemplate<MessageTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id

    override fun parse(): Template {
        return MessageTemplate.Builder(config.message.text).apply {
            // Additional configuration can be added here in the future
            config.title?.let { title ->
                setHeader(Parser.parseHeader(context, title, config.headerActions))
            }

            config.actions?.let { actions ->
                actions.forEach { action ->
                    addAction(Parser.parseAction(context, action))
                }
            }
        }.build()
    }

    override fun onDidAppear() {
        config.onDidAppear?.let { it(null) }
    }

    override fun onDidDisappear() {
        config.onDidDisappear?.let { it(null) }
    }

    override fun onPopped() {
        config.onPopped?.let { it() }
        templates.remove(templateId)
    }

    override fun onWillAppear() {
        config.onWillAppear?.let { it(null) }
    }

    override fun onWillDisappear() {
        config.onWillDisappear?.let { it(null) }
    }

    override fun setTemplateHeaderActions(headerActions: Array<NitroAction>?) {
        config = config.copy(headerActions = headerActions)
        super.applyConfigUpdate()
    }

    companion object {

    }
}