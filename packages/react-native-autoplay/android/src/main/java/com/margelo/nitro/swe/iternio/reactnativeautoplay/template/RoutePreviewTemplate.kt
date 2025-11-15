package com.margelo.nitro.swe.iternio.reactnativeautoplay.template

import androidx.car.app.CarContext
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.Header
import androidx.car.app.model.ItemList
import androidx.car.app.model.ListTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.MapController
import androidx.car.app.navigation.model.MapWithContentTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.AutoText
import com.margelo.nitro.swe.iternio.reactnativeautoplay.NitroMapButton
import com.margelo.nitro.swe.iternio.reactnativeautoplay.RouteChoice

class RoutePreviewTemplate(
    carContext: CarContext,
    val tripId: String,
    val routes: Array<RouteChoice>,
    var selectedRouteIndex: Int,
    val title: String,
    val onTripSelected: (String, String) -> Unit,
    val mapButtons: Array<NitroMapButton>
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
                        onTripSelected(tripId, routes[it].id)
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
                                        route.steps.last().travelEstimates.distanceRemaining,
                                        route.steps.last().travelEstimates.timeRemaining.seconds
                                    )
                                )
                            )
                        }.build())
                    }
                }.build())
            }.build())

            if (mapButtons.isNotEmpty()) {
                setMapController(
                    MapController.Builder()
                        .setMapActionStrip(Parser.parseMapActions(carContext, mapButtons)).build()
                )
            }
        }.build()
    }

    companion object {
        const val TAG = "RoutePreviewTemplate"
    }
}