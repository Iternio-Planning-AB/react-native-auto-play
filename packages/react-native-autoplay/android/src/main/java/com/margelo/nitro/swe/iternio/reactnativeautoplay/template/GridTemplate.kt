package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.annotations.ExperimentalCarApi
import androidx.car.app.model.GridItem
import androidx.car.app.model.GridSection
import androidx.car.app.model.GridTemplate
import androidx.car.app.model.ItemList
import androidx.car.app.model.SectionedItemTemplate
import androidx.car.app.model.Template
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GridTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GridImageSize
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroGridButton

@OptIn(ExperimentalCarApi::class)
class GridTemplate(context: CarContext, config: GridTemplateConfig) :
    AndroidAutoTemplate<GridTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        val imageSize = config.imageSize
        val template = when (imageSize) {
            null, GridImageSize.UNSET -> createGridTemplate()
            GridImageSize.LARGE, GridImageSize.MEDIUM, GridImageSize.SMALL ->
                createSizedGridTemplate(imageSize)
        }

        return Parser.parseMapWithContentConfig(context, config.mapConfig, template)
    }

    private fun createGridTemplate(): Template = GridTemplate.Builder().apply {
        setHeader(Parser.parseHeader(context, config.title, config.headerActions))

        if (config.buttons.isEmpty()) {
            setLoading(true)
            return@apply
        }

        setSingleList(ItemList.Builder().apply {
            config.buttons.forEach { button -> addItem(createGridItem(button)) }
        }.build())
    }.build()

    private fun createSizedGridTemplate(imageSize: GridImageSize): Template =
        SectionedItemTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.headerActions))

            if (config.buttons.isEmpty()) {
                setLoading(true)
                return@apply
            }

            addSection(GridSection.Builder().apply {
                setItemSize(imageSize.toItemSize())
                config.buttons.forEach { button -> addItem(createGridItem(button)) }
            }.build())
        }.build()

    private fun createGridItem(button: NitroGridButton): GridItem = GridItem.Builder().apply {
        setTitle(Parser.parseText(button.title))
        setOnClickListener(button.onPress)
        setImage(Parser.parseImage(context, button.image))
    }.build()

    private fun GridImageSize.toItemSize(): Int = when (this) {
        GridImageSize.LARGE -> GridSection.ITEM_SIZE_LARGE
        GridImageSize.MEDIUM -> GridSection.ITEM_SIZE_MEDIUM
        GridImageSize.SMALL -> GridSection.ITEM_SIZE_SMALL
        GridImageSize.UNSET -> error("An unset grid image size has no item size")
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
