package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.SearchTemplate
import androidx.car.app.model.SearchTemplate.SearchCallback
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroAction
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.NitroSection
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.SearchTemplateConfig

class SearchTemplate(context: CarContext, config: SearchTemplateConfig) :
    AndroidAutoTemplate<SearchTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id

    override fun parse(): Template {
        return SearchTemplate.Builder(object : SearchCallback {
            override fun onSearchTextChanged(searchText: String) {
                config.onSearchTextChanged?.let {
                    it(searchText)
                }
            }

            override fun onSearchSubmitted(searchText: String) {
                config.onSearchTextSubmitted?.let {
                    it(searchText)
                }
            }
        }).apply {
            config.results?.items?.let { items ->
                setItemList(Parser.parseSearchResult(context, items))
            }
            config.initialSearchText?.let {
                setInitialSearchText(it)
            }
            config.searchHint?.let {
                setSearchHint(it)
            }
        }.build()
    }

    fun updateSearchResults(results: NitroSection?) {
        config = config.copy(results = results)
        super.applyConfigUpdate()
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
}