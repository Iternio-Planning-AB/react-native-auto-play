package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.ItemList
import androidx.car.app.model.SectionedItemList
import androidx.car.app.model.Template
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AutoText
import com.margelo.nitro.swe.iternio.reactnativeautoplay.ListTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroSection
import androidx.car.app.model.ListTemplate as CarListTemplate

class ListTemplate(context: CarContext, config: ListTemplateConfig) :
    AndroidAutoTemplate<ListTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        val sections = config.sections?.mapIndexed { index, section ->
            val rows = Parser.parseRows(context, section.items, index, config.id, section.type)
            section.title to rows
        }
        val template = parse(context, config.title, config.headerActions, sections)

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

    fun updateSections(sections: Array<NitroSection>?) {
        config = config.copy(sections = sections)
        super.applyConfigUpdate()
    }

    companion object {
        /** a ListTemplate, loading without sections, a single untitled section has no header */
        fun parse(
            context: CarContext,
            title: AutoText,
            headerActions: Array<NitroAction>?,
            sections: List<Pair<String?, ItemList>>?
        ): Template = CarListTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, title, headerActions))

            if (sections.isNullOrEmpty()) {
                setLoading(true)
                return@apply
            }

            val singleSection = sections.singleOrNull()
            if (singleSection != null && singleSection.first == null) {
                setSingleList(singleSection.second)
                return@apply
            }

            sections.forEach { (sectionTitle, itemList) ->
                // empty headers are rejected, a blank one shows an empty line like on CarPlay
                val header = sectionTitle?.takeUnless { it.isEmpty() } ?: " "
                addSectionedList(SectionedItemList.create(itemList, header))
            }
        }.build()
    }
}
