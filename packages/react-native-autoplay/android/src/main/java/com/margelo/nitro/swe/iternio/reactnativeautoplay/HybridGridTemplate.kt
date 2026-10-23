package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.GridTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.TemplateUpdateQueue

class HybridGridTemplate : HybridGridTemplateSpec() {
    override fun createGridTemplate(config: GridTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createGridTemplate failed, carContext found")

        val template = GridTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updateGridTemplateButtons(
        templateId: String, buttons: Array<NitroGridButton>
    ): Promise<Unit> {
        return TemplateUpdateQueue.enqueue {
            val template = AndroidAutoTemplate.getTemplate<GridTemplate>(templateId)
            template.updateButtons(buttons)
        }
    }
}
