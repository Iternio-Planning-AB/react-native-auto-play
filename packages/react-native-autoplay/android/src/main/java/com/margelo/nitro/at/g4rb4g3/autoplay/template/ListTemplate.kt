package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.SectionedItemList
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.ListTemplateConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroSection

class ListTemplate(context: CarContext, config: ListTemplateConfig) :
    AndroidAutoTemplate<ListTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id

    override fun parse(): Template {
        return ListTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.headerActions))

            config.sections?.let { sections ->
                if (sections.isEmpty()) {
                    setLoading(true)
                } else if (sections.size == 1 && sections.first().title == null) {
                    val section = sections[0]
                    setSingleList(
                        Parser.parseRows(
                            context, section.items, 0, section.selectedIndex, config.id
                        )
                    )
                } else {
                    sections.forEachIndexed { index, section ->
                        addSectionedList(
                            SectionedItemList.create(
                                Parser.parseRows(
                                    context, section.items, index, section.selectedIndex, config.id
                                ), section.title!!
                            )
                        )
                    }
                }
            } ?: run {
                setLoading(true)
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
        templates.remove(templateId)
    }

    fun updateSections(sections: Array<NitroSection>?) {
        config = config.copy(sections = sections)
        super.applyConfigUpdate()
    }

    companion object {

    }
}