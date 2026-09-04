package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.media.MediaPlaybackManager
import androidx.car.app.media.model.MediaPlaybackTemplate as CarMediaPlaybackTemplate
import androidx.car.app.model.Template
import android.support.v4.media.session.MediaSessionCompat
import com.margelo.nitro.swe.iternio.reactnativeautoplay.MediaPlaybackTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction

class MediaPlaybackTemplate(context: CarContext, config: MediaPlaybackTemplateConfig) :
    AndroidAutoTemplate<MediaPlaybackTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs: Double?
        get() = config.autoDismissMs

    init {
        val session = sessions.getOrPut(templateId) {
            MediaSessionCompat(context, "ReactNativeAutoPlay:$templateId").apply {
                isActive = true
            }
        }
        context.getCarService(MediaPlaybackManager::class.java).registerMediaPlaybackToken(session.sessionToken)
    }

    override fun parse(): Template {
        return CarMediaPlaybackTemplate.Builder().apply {
            config.headerActions?.let { actions ->
                setHeader(Parser.parseHeader(context, null, actions))
            }
        }.build()
    }

    override fun setTemplateHeaderActions(headerActions: Array<NitroAction>?) {
        config = config.copy(headerActions = headerActions)
        super.applyConfigUpdate()
    }

    override fun onWillAppear() {
        config.onWillAppear?.let { it(null) }
    }

    override fun onWillDisappear() {
        config.onWillDisappear?.let { it(null) }
    }

    override fun onDidAppear() {
        config.onDidAppear?.let { it(null) }
    }

    override fun onDidDisappear() {
        config.onDidDisappear?.let { it(null) }
    }

    override fun onPopped() {
        config.onPopped?.let { it() }
        sessions.remove(templateId)?.release()
        templates.remove(templateId)
    }

    companion object {
        private val sessions = mutableMapOf<String, MediaSessionCompat>()
    }
}
