package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.SearchTemplate
import androidx.car.app.model.SearchTemplate.SearchCallback
import androidx.car.app.model.Template
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAction
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroAlignment
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroSection
import com.margelo.nitro.swe.iternio.reactnativeautoplay.SearchTemplateConfig

class SearchTemplate(context: CarContext, config: SearchTemplateConfig) :
    AndroidAutoTemplate<SearchTemplateConfig>(context, config) {

    override val isRenderTemplate = false
    override val templateId: String
        get() = config.id
    override val autoDismissMs = config.autoDismissMs

    override fun parse(): Template {
        return SearchTemplate.Builder(object : SearchCallback {
            override fun onSearchTextChanged(searchText: String) {
                config.onSearchTextChanged(searchText)
            }
            override fun onSearchSubmitted(searchText: String) {
                config.onSearchTextSubmitted(searchText)
            }
        }).apply {
            setItemList(Parser.parseSearchResult(context, config.results.items))
            config.searchHint?.let {
                setSearchHint(it)
            }

            config.initialSearchText?.let {
                setInitialSearchText(it)
            }

            config.headerActions?.let { headerActions ->
                headerActions.find {
                    it.alignment == NitroAlignment.LEADING
                }?.let { it ->
                    setHeaderAction(Parser.parseAction(context, it))
                }

                val trailingActions = headerActions.filter { it ->
                    it.alignment == NitroAlignment.TRAILING
                }

                if (trailingActions.isNotEmpty()) {
                    val actionStripBuilder = ActionStrip.Builder()
                    trailingActions.forEach { trailingAction ->
                        actionStripBuilder.addAction(Parser.parseAction(context, trailingAction))
                    }
                    setActionStrip(actionStripBuilder.build())
                }
            }
        }.build()
    }

    fun updateSearchResults(results: NitroSection) {
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