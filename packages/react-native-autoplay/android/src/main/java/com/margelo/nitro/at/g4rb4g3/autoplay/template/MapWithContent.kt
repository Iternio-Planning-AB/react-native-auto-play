package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.model.Template
import androidx.car.app.navigation.model.MapWithContentTemplate

class MapWithContent : Template {

    constructor(template: Template) {
        MapWithContentTemplate.Builder().apply {
            setContentTemplate(template)
        }
    }
}