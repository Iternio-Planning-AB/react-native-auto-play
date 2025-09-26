package com.margelo.nitro.at.g4rb4g3.autoplay

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.ActionStrip
import androidx.car.app.model.CarIcon
import androidx.car.app.model.MessageTemplate
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.NavigationTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.utils.AppInfo

class AndroidAutoScreen(carContext: CarContext, private val isCluster: Boolean = false) :
    Screen(carContext) {

    var template: Template? = null
    var renderer: VirtualRenderer? = null

    override fun onGetTemplate(): Template {
        if (renderer == null) {
            renderer = VirtualRenderer(carContext, marker!!, isCluster)
        }

        return NavigationTemplate.Builder().apply {
            setActionStrip(ActionStrip.Builder().apply { addAction(Action.APP_ICON) }
                .build()).build()
        }.build()
    }
}