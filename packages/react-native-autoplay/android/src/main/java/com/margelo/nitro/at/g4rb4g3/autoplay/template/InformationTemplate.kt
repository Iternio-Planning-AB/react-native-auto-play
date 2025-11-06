package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.Pane
import androidx.car.app.model.PaneTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.MapController
import androidx.car.app.navigation.model.MapWithContentTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.InformationTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroSection
import com.margelo.nitro.at.g4rb4g3.autoplay.template.Parser.parseText

class InformationTemplate(context: CarContext, config: InformationTemplateConfig) :
    AndroidAutoTemplate<InformationTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id


    override fun parse(): Template {
        val pane = Pane.Builder().apply {
            if (config.section.items.isEmpty()) {
                setLoading(true)
            } else {
                config.section.items.forEach { item ->
                    addRow(Row.Builder().apply {
                        setTitle(parseText(item.title))
                        item.detailedText?.let { detailedText ->
                            addText(parseText(detailedText))
                        }
                        item.image?.let {
                            setImage(Parser.parseImage(context, item.image))
                        }
                    }.build())
                }
            }

            config.actions?.let {
                it.forEach { action ->
                    addAction(Parser.parseAction(context, action))
                }
            }
        }

        val template = PaneTemplate.Builder(pane.build()).apply {
            setHeader(Parser.parseHeader(context, config.title, config.headerActions))
        }.build()

        return this.config.mapConfig?.let {
            MapWithContentTemplate.Builder().apply {
                setContentTemplate(template)
                it.mapButtons?.let { mapButtons ->
                    setMapController(
                        MapController.Builder()
                            .setMapActionStrip(Parser.parseMapActions(context, mapButtons)).build()
                    )
                }
                it.headerActions?.let { headerActions ->
                    setActionStrip(Parser.parseMapHeaderActions(context, headerActions))
                }
            }.build()
        } ?: template
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
        templates.remove(templateId)
    }

    fun updateSection(section: NitroSection) {
        config = config.copy(section = section)
        super.applyConfigUpdate()
    }
}