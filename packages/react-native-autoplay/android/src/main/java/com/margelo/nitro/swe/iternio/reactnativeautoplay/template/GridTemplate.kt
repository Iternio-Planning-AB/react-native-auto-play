package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.GridSection
import androidx.car.app.model.ItemList
import androidx.car.app.model.SectionedItemTemplate
import androidx.car.app.model.Template
import androidx.car.app.versioning.CarAppApiLevels
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AutoText
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GridImageSize
import com.margelo.nitro.swe.iternio.reactnativeautoplay.GridTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroGridButton
import androidx.car.app.model.GridTemplate as CarGridTemplate

class GridTemplate(context: CarContext, config: GridTemplateConfig) :
    AndroidAutoTemplate<GridTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        val imageSize = config.imageSize
        val template = when {
            // a sized grid in MapWithContentTemplate crashes Android Auto, see
            // https://issuetracker.google.com/issues/572287914
            config.mapConfig != null -> createGridTemplate()
            // SectionedItemTemplate requires Car API 8, older hosts get the default sized grid.
            context.carAppApiLevel < CarAppApiLevels.LEVEL_8 -> createGridTemplate()
            imageSize == null || imageSize == GridImageSize.UNSET -> createGridTemplate()
            else -> createSizedGridTemplate(imageSize)
        }

        return Parser.parseMapWithContentConfig(context, config.mapConfig, template)
    }

    private fun createGridTemplate(): Template =
        parse(context, config.title, config.headerActions, config.buttons)

    private fun createSizedGridTemplate(imageSize: GridImageSize): Template =
        SectionedItemTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.headerActions))

            if (config.buttons.isEmpty()) {
                setLoading(true)
                return@apply
            }

            addSection(GridSection.Builder().apply {
                setItemSize(imageSize.toItemSize())
                config.buttons.forEach { button -> addItem(Parser.parseGridItem(context, button)) }
            }.build())
        }.build()

    private fun GridImageSize.toItemSize(): Int = when (this) {
        GridImageSize.LARGE -> GridSection.ITEM_SIZE_LARGE
        GridImageSize.MEDIUM -> GridSection.ITEM_SIZE_MEDIUM
        GridImageSize.SMALL -> GridSection.ITEM_SIZE_SMALL
        GridImageSize.UNSET -> error("An unset grid image size has no item size")
    }

    override fun setTemplateHeaderActions(headerActions: Array<NitroAction>?) {
        updateConfig { it.copy(headerActions = headerActions) }
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
        updateConfig { it.copy(buttons = buttons) }
    }

    companion object {
        /** a GridTemplate with a single grid, loading while there are no buttons */
        fun parse(
            context: CarContext,
            title: AutoText,
            headerActions: Array<NitroAction>?,
            buttons: Array<NitroGridButton>
        ): Template = CarGridTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, title, headerActions))

            if (buttons.isEmpty()) {
                setLoading(true)
                return@apply
            }

            setSingleList(ItemList.Builder().apply {
                buttons.forEach { button -> addItem(Parser.parseGridItem(context, button)) }
            }.build())
        }.build()
    }
}
