package com.margelo.nitro.at.g4rb4g3.autoplay.template

import androidx.car.app.CarContext
import androidx.car.app.OnScreenResultListener
import androidx.car.app.Screen
import androidx.car.app.model.Action
import androidx.car.app.model.CarIcon
import androidx.car.app.model.Header
import androidx.car.app.model.Pane
import androidx.car.app.model.PaneTemplate
import androidx.car.app.model.Row
import androidx.car.app.model.Template
import androidx.car.app.navigation.model.MapWithContentTemplate
import androidx.core.graphics.drawable.IconCompat
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.AutoText
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripConfig
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripPreviewTextConfiguration
import com.margelo.nitro.at.g4rb4g3.autoplay.hybrid.TripsConfig
import com.margelo.nitro.autoplay.R

class TripPreviewTemplate(
    carContext: CarContext,
    val trips: Array<TripsConfig>,
    selectedTripId: String?,
    val textConfig: TripPreviewTextConfiguration,
    val onTripSelected: (String, String) -> Unit,
    val onTripStarted: (String, String) -> Unit,
    val mapTemplateId: String
) : Screen(carContext) {
    var selectedTripIndex = selectedTripId?.let {
        trips.indexOfFirst { trip -> trip.id == selectedTripId }
    } ?: 0
    var selectedRouteIndex = 0

    init {
        marker = TAG
        // for whatever reason CarPlay fires this when opening up the trip selector so we do the same on AA
        onTripSelected(
            trips[selectedTripIndex].id, trips[selectedTripIndex].routeChoices.first().id
        )
    }


    override fun onGetTemplate(): Template {
        var selectedTrip = trips[selectedTripIndex]
        var selectedRoute = selectedTrip.routeChoices[selectedRouteIndex]

        return MapWithContentTemplate.Builder().apply {
            val pane = Pane.Builder().apply {
                addRow(Row.Builder().apply {
                    setTitle(Parser.parseText(selectedRoute.additionalInformationVariants))
                    addText(Parser.parseText(selectedRoute.selectionSummaryVariants))
                }.build())
                addRow(Row.Builder().apply {
                    setTitle(
                        "${textConfig.travelEstimatesTitle} ${
                            Parser.formatToTimestamp(
                                selectedRoute.steps.last().travelEstimates.timeRemaining
                            )
                        }"
                    )
                    addText(
                        Parser.parseText(
                            AutoText(
                                "${Parser.PLACEHOLDER_DURATION} (${Parser.PLACEHOLDER_DISTANCE})",
                                selectedRoute.steps.last().travelEstimates.distanceRemaining,
                                selectedRoute.steps.last().travelEstimates.timeRemaining.seconds
                            )
                        )
                    )
                }.build())
                addAction(Action.Builder().apply {
                    setTitle(textConfig.startButtonTitle)
                    setFlags(Action.FLAG_PRIMARY)
                    setOnClickListener {
                        // we have to slice away the first step since it is the origin
                        val steps = selectedRoute.steps.slice(1 until selectedRoute.steps.size)
                            .toTypedArray()
                        val trip = TripConfig(selectedTrip.id, selectedRoute.copy(steps = steps))

                        MapTemplate.startNavigation(trip)

                        onTripStarted(selectedTrip.id, selectedRoute.id)
                        finish()
                    }
                }.build())
                if (selectedTrip.routeChoices.size > 1) {
                    addAction(Action.Builder().apply {
                        setIcon(
                            CarIcon.Builder(
                                IconCompat.createWithResource(
                                    carContext, R.drawable.alt_route
                                )
                            ).build()
                        )
                        setOnClickListener {
                            AndroidAutoScreen.getScreenManager()?.pushForResult(
                                RoutePreviewTemplate(
                                    carContext,
                                    selectedTrip.id,
                                    selectedTrip.routeChoices,
                                    selectedRouteIndex,
                                    textConfig.additionalRoutesButtonTitle,
                                    onTripSelected
                                ), object : OnScreenResultListener {
                                    override fun onScreenResult(result: Any?) {
                                        if (result is Int) {
                                            selectedRouteIndex = result
                                        }
                                    }
                                })
                        }
                    }.build())
                }
            }.build()
            setContentTemplate(PaneTemplate.Builder(pane).apply {
                setHeader(Header.Builder().apply {
                    setTitle(selectedRoute.steps.last().name)
                    setStartHeaderAction(Action.BACK)
                    if (trips.size > 1) {
                        addEndHeaderAction(Action.Builder().apply {
                            setEnabled(selectedTripIndex > 0)
                            setIcon(
                                CarIcon.Builder(
                                    IconCompat.createWithResource(
                                        carContext, R.drawable.ic_chevron_backward
                                    )
                                ).build()
                            )
                            setOnClickListener {
                                selectedTripIndex--
                                if (selectedTripIndex < 0) {
                                    selectedTripIndex = trips.size - 1
                                }
                                selectedRouteIndex = 0
                                selectedTrip = trips[selectedTripIndex]
                                selectedRoute = selectedTrip.routeChoices.first()
                                onTripSelected(selectedTrip.id, selectedRoute.id)
                                invalidate()
                            }
                        }.build())
                        addEndHeaderAction(Action.Builder().apply {
                            setEnabled(selectedTripIndex < trips.size - 1)
                            setIcon(
                                CarIcon.Builder(
                                    IconCompat.createWithResource(
                                        carContext, R.drawable.ic_chevron_forward
                                    )
                                ).build()
                            )
                            setOnClickListener {
                                selectedTripIndex++
                                if (selectedTripIndex == trips.size) {
                                    selectedTripIndex = 0
                                }
                                selectedRouteIndex = 0
                                selectedTrip = trips[selectedTripIndex]
                                selectedRoute = selectedTrip.routeChoices.first()
                                onTripSelected(selectedTrip.id, selectedRoute.id)
                                invalidate()
                            }
                        }.build())
                    }
                }.build())
            }.build())
        }.build()
    }

    companion object {
        const val TAG = "TripPreviewTemplate"
    }
}