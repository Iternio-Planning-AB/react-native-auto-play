package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.PointOfInterestTemplate

class HybridPointOfInterestTemplate : HybridPointOfInterestTemplateSpec() {

    override fun createPointOfInterestTemplate(config: PointOfInterestTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createPointOfInterestTemplate failed, carContext not found")

        val template = PointOfInterestTemplate(context, config)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun updatePointOfInterestTemplateItems(
        templateId: String, items: Array<PointOfInterest>
    ): Promise<Unit> {
        return Promise.async {
            val template = AndroidAutoTemplate.getTemplate<PointOfInterestTemplate>(templateId)
            template.updateItems(items)
        }
    }
}
