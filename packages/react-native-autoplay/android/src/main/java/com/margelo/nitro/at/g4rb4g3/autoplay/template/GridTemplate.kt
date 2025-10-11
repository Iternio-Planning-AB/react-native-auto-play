package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.GridItem
import androidx.car.app.model.GridTemplate
import androidx.car.app.model.ItemList
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroGridButton
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroGridTemplateConfig

class GridTemplate(context: CarContext, config: NitroGridTemplateConfig) :
    AndroidAutoTemplate<NitroGridTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id

    override fun parse(): Template {
        return GridTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.actions))

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

    override fun setTemplateActions(actions: Array<NitroAction>?) {
        config = config.copy(actions = actions)
        super.applyConfigUpdate()
    }

    fun updateButtons(buttons: Array<NitroGridButton>) {
        config = config.copy(buttons = buttons)
        super.applyConfigUpdate()
    }
}