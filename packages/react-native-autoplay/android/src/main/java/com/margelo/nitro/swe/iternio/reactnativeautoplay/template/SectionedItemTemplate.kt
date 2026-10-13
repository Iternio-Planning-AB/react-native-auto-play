package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import android.util.Log
import androidx.car.app.CarContext
import androidx.car.app.model.GridSection
import androidx.car.app.model.ItemList
import androidx.car.app.model.Row
import androidx.car.app.model.RowSection
import androidx.car.app.model.SectionedItemTemplate
import androidx.car.app.model.Template
import androidx.car.app.versioning.CarAppApiLevels
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AndroidAutoScreen
import com.margelo.nitro.swe.iternio.reactnativeautoplay.BuildConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroGridSection
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroSection
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroSectionedItemSection
import com.margelo.nitro.swe.iternio.reactnativeautoplay.SectionedItemTemplateConfig

class SectionedItemTemplate(context: CarContext, config: SectionedItemTemplateConfig) :
    AndroidAutoTemplate<SectionedItemTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        // SectionedItemTemplate needs Car API 8, older hosts get a ListTemplate with grid rows.
        // As map content it crashes Android Auto, https://issuetracker.google.com/issues/572287914
        val isApiLevel8 = context.carAppApiLevel >= CarAppApiLevels.LEVEL_8
        val hasMapConfig = config.mapConfig != null
        val singleGridSection = config.sections?.singleOrNull()?.asSecondOrNull()
        val template = when {
            !hasMapConfig && isApiLevel8 -> createSectionedItemTemplate()
            // a GridTemplate keeps the grid on the map, but has no section title
            hasMapConfig && singleGridSection != null -> GridTemplate.parse(
                context, config.title, config.headerActions, singleGridSection.buttons
            )

            else -> createListTemplate()
        }

        if (BuildConfig.DEBUG && hasMapConfig && isApiLevel8 && !loggedMapContentWorkaround) {
            loggedMapContentWorkaround = true
            Log.w(
                TAG,
                "SectionedItemTemplate with mapConfig is rendered as a GridTemplate for a single " +
                    "grid section, otherwise as a ListTemplate (grid buttons as rows). Android " +
                    "Auto crashes on a SectionedItemTemplate as map content: " +
                    "https://issuetracker.google.com/issues/572287914"
            )
        }

        return Parser.parseMapWithContentConfig(context, config.mapConfig, template)
    }

    private fun createSectionedItemTemplate(): Template = SectionedItemTemplate.Builder().apply {
        setHeader(Parser.parseHeader(context, config.title, config.headerActions))

        val sections = config.sections
        if (sections.isNullOrEmpty()) {
            setLoading(true)
            return@apply
        }

        sections.forEach { section ->
            section.match(
                first = { listSection -> addSection(createRowSection(listSection)) },
                second = { gridSection -> addSection(createGridSection(gridSection)) }
            )
        }
    }.build()

    private fun createRowSection(section: NitroSection): RowSection = RowSection.Builder().apply {
        section.title?.let { setTitle(it) }
        setItems(createRows(section))
    }.build()

    private fun createGridSection(section: NitroGridSection): GridSection =
        GridSection.Builder().apply {
            section.title?.let { setTitle(it) }
            section.buttons.forEach { button -> addItem(Parser.parseGridItem(context, button)) }
        }.build()

    private fun createListTemplate(): Template {
        val sections = config.sections?.map { section ->
            getTitle(section) to section.match(
                first = { listSection -> createItemList(listSection) },
                second = { gridSection -> createGridItemList(gridSection) }
            )
        }

        return ListTemplate.parse(context, config.title, config.headerActions, sections)
    }

    private fun createItemList(section: NitroSection): ItemList = ItemList.Builder().apply {
        createRows(section).forEach { row -> addItem(row) }
    }.build()

    private fun createGridItemList(section: NitroGridSection): ItemList =
        ItemList.Builder().apply {
            section.buttons.forEach { button ->
                addItem(Row.Builder().apply {
                    setTitle(Parser.parseText(button.title))
                    setImage(Parser.parseImage(context, button.image))
                    setOnClickListener(button.onPress)
                }.build())
            }
        }.build()

    private fun createRows(section: NitroSection): List<Row> =
        section.items.mapIndexed { itemIndex, row ->
            Parser.parseRow(
                context,
                row,
                onToggle = { isChecked ->
                    // onPress is always defined on toggle rows
                    row.onPress!!(isChecked)
                    section.items[itemIndex] = row.copy(checked = isChecked)
                    AndroidAutoScreen.getScreen(templateId)?.applyConfigUpdate()
                },
                onClick = row.onPress?.let { onPress -> { onPress(null) } }
            )
        }

    private fun getTitle(section: NitroSectionedItemSection): String? =
        section.match(first = { it.title }, second = { it.title })

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

    fun updateSections(sections: Array<NitroSectionedItemSection>?) {
        config = config.copy(sections = sections)
        super.applyConfigUpdate()
    }

    companion object {
        // the screen recreates this class on every update, log the map content workaround only once
        private var loggedMapContentWorkaround = false
    }
}
