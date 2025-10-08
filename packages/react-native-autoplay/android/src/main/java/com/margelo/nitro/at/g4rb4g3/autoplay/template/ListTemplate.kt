package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.Template
import com.margelo.nitro.at.g4rb4g3.autoplay.NitroListTemplateConfig

class ListTemplate(context: CarContext, config: NitroListTemplateConfig) :
    AndroidAutoTemplate<NitroListTemplateConfig>(context, config) {

    override fun parse(): Template {
        return ListTemplate.Builder().apply {
            setHeader(Parser.parseHeader(context, config.title, config.actions))
            setLoading(true)
        }.build()
    }
}