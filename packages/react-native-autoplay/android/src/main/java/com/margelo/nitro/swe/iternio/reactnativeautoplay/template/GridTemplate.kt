package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.GridItem
import androidx.car.app.model.GridTemplate
import androidx.car.app.model.ItemList
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.MapController
import androidx.car.app.navigation.model.MapWithContentTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GridTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroGridButton

class GridTemplate(context: CarContext, config: GridTemplateConfig) :
    AndroidAutoTemplate<GridTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        val template = GridTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.headerActions))

            if (config.buttons.isEmpty()) {
                setLoading(true)
                return@apply
            }

            setSingleList(ItemList.Builder().apply {
                config.buttons.forEachIndexed { index, button ->
                    addItem(GridItem.Builder().apply {
                        setTitle(Parser.parseText(button.title))
                        setOnClickListener(button.onPress)
                        button.image.let { image ->
                            setImage(Parser.parseImage(context, image))
                        }
                    }.build())
                }
            }.build())
        }.build()

        return Parser.parseMapWithContentConfig(context, config.mapConfig, template)
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

    fun updateButtons(buttons: Array<NitroGridButton>) {
        config = config.copy(buttons = buttons)
        super.applyConfigUpdate()
    }
}