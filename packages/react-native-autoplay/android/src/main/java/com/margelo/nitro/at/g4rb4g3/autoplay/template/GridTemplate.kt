package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.GridItem
import androidx.car.app.model.GridTemplate
import androidx.car.app.model.ItemList
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroGridButton
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.GridTemplateConfig

class GridTemplate(context: CarContext, config: GridTemplateConfig) :
    AndroidAutoTemplate<GridTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id

    override fun parse(): Template {
        return GridTemplate.Builder().apply {
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
        }.build();
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