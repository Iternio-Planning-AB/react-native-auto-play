package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.SectionedItemList
import androidx.car.app.model.Template
import com.margelo.nitro.swe.iternio.reactnativeautoplay.ListTemplateConfig
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroSection

class ListTemplate(context: CarContext, config: ListTemplateConfig) :
    AndroidAutoTemplate<ListTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        val template = ListTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.headerActions))

            config.sections?.let { sections ->
                if (sections.isEmpty()) {
                    setLoading(true)
                } else if (sections.size == 1 && sections.first().title == null) {
                    val section = sections[0]
                    setSingleList(
                        Parser.parseRows(
                            context, section.items, 0, config.id, section.type
                        )
                    )
                } else {
                    sections.forEachIndexed { index, section ->
                        addSectionedList(
                            SectionedItemList.create(
                                Parser.parseRows(
                                    context, section.items, index, config.id, section.type
                                ), section.title!!
                            )
                        )
                    }
                }
            } ?: run {
                setLoading(true)
            }
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

    fun updateSections(sections: Array<NitroSection>?) {
        config = config.copy(sections = sections)
        super.applyConfigUpdate()
    }

    companion object {

    }
}