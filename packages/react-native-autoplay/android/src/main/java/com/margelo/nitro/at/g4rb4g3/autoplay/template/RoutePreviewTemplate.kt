package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.Header
import androidx.car.app.model.ItemList
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.MapWithContentTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.AutoText
import com.margelo.nitro.at.g4rb4g3.autoplay.RouteChoice

class RoutePreviewTemplate(
    carContext: CarContext,
    val routes: Array<RouteChoice>,
    var selectedRouteIndex: Int,
    val title: String
) : Screen(carContext) {
    init {
        marker = TAG
    }

    override fun onGetTemplate(): Template {
        return MapWithContentTemplate.Builder().apply {
            setContentTemplate(ListTemplate.Builder().apply {
                setHeader(Header.Builder().apply {
                    setStartHeaderAction(Action.BACK)
                    setTitle(title)
                }.build())
                setSingleList(ItemList.Builder().apply {
                    setSelectedIndex(selectedRouteIndex)
                    setOnSelectedListener {
                        selectedRouteIndex = it
                        setResult(it)
                        invalidate()
                    }
                    routes.forEach { route ->
                        addItem(Row.Builder().apply {
                            setTitle(Parser.parseText(route.summaryVariants))
                            addText(Parser.parseText(route.selectionSummaryVariants))
                            addText(
                                Parser.parseText(
                                    AutoText(
                                        "${Parser.PLACEHOLDER_DURATION} (${Parser.PLACEHOLDER_DISTANCE})",
                                        route.travelEstimates.distanceRemaining,
                                        route.travelEstimates.timeRemaining
                                    )
                                )
                            )
                        }.build())
                    }
                }.build())
            }.build())
        }.build()
    }

    companion object {
        const val TAG = "RoutePreviewTemplate"
    }
}