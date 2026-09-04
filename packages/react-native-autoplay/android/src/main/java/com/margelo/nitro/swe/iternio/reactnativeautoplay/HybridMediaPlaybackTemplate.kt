package com.margelo.nitro.swe.iternio.reactnativeautoplay

import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MediaPlaybackTemplate

class HybridMediaPlaybackTemplate : HybridMediaPlaybackTemplateSpec() {
    override fun createMediaPlaybackTemplate(config: MediaPlaybackTemplateConfig) {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("createMediaPlaybackTemplate failed, carContext not found")

        AndroidAutoTemplate.setTemplate(config.id, MediaPlaybackTemplate(context, config))
    }
}
