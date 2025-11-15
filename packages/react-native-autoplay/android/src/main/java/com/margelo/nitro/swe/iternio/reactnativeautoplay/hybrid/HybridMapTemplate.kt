package com.margelo.nitro.swe.iternio.reactnativeautoplay

import androidx.car.app.AppManager
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MapTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.RoutePreviewTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.TripPreviewTemplate

class HybridMapTemplate : HybridMapTemplateSpec() {
    override fun createMapTemplate(config: MapTemplateConfig) {
        val context =
            AndroidAutoSession.getCarContext(config.id) ?: throw IllegalArgumentException(
                "createMapTemplate failed, carContext found"
            )

        val template = MapTemplate(context, config, initNavigationManager = true)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun showNavigationAlert(
        templateId: String,
        alert: NitroNavigationAlert
    ): NavigationAlertCallbacks {
        val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
        template.showAlert(alert)

        return NavigationAlertCallbacks(
            dismiss = {
                val carContext =
                    AndroidAutoSession.getCarContext(AndroidAutoSession.ROOT_SESSION)
                        ?: throw IllegalArgumentException("navigation alert dismiss failed, carContext for ${AndroidAutoSession.ROOT_SESSION} not found")

                carContext.getCarService(AppManager::class.java).dismissAlert(alert.id.toInt())
            },
            update = { title, subtitle ->
                val config = alert.copy(title = title, subtitle = subtitle)
                template.showAlert(config)
            }
        )
    }

    override fun showTripSelector(
        templateId: String,
        trips: Array<TripsConfig>,
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: (tripId: String, routeId: String) -> Unit,
        onTripStarted: (tripId: String, routeId: String) -> Unit,
        onBackPressed: () -> Unit,
        mapButtons: Array<NitroMapButton>
    ): TripSelectorCallback {
        val context = AndroidAutoSession.getRootContext()
            ?: throw IllegalArgumentException("showTripSelector failed, carContext not found")
        val screenManager = AndroidAutoScreen.getScreenManager()
            ?: throw IllegalArgumentException("showTripSelector failed, screenManager not found")

        val screen = TripPreviewTemplate(
            context,
            trips,
            selectedTripId,
            textConfig,
            onTripSelected,
            onTripStarted,
            onBackPressed,
            mapButtons
        )

        UiThreadUtil.runOnUiThread {
            screenManager.popToRoot()
            screenManager.push(screen)
        }

        return TripSelectorCallback { id: String ->
            UiThreadUtil.runOnUiThread {
                if (screenManager.top.marker == RoutePreviewTemplate.TAG) {
                    screenManager.popTo(TripPreviewTemplate.TAG)
                }
            }

            val selectedTripIndex = trips.indexOfFirst { trip -> trip.id == id }
            screen.selectedTripIndex = selectedTripIndex
            screen.invalidate()
        }
    }

    override fun hideTripSelector(templateId: String) {
        val screenManager = AndroidAutoScreen.getScreenManager()
            ?: throw IllegalArgumentException("hideTripSelector failed, screenManager not found")
        val screens = screenManager.screenStack.filter {
            it.marker == TripPreviewTemplate.TAG || it.marker == RoutePreviewTemplate.TAG
        }

        UiThreadUtil.runOnUiThread {
            screens.forEach {
                it.finish()
            }
        }
    }

    override fun setTemplateMapButtons(
        templateId: String, buttons: Array<NitroMapButton>?
    ) {
        val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
        template.setMapActions(buttons)
    }

    override fun updateVisibleTravelEstimate(
        templateId: String, visibleTravelEstimate: VisibleTravelEstimate
    ) {
        val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
        template.updateVisibleTravelEstimate(visibleTravelEstimate)
    }

    override fun updateTravelEstimates(templateId: String, steps: Array<TripPoint>) {
        MapTemplate.updateTravelEstimates(steps)
    }

    override fun updateManeuvers(
        templateId: String, maneuvers: NitroManeuver
    ) {
        MapTemplate.updateManeuvers(maneuvers)
    }

    override fun startNavigation(
        templateId: String, trip: TripConfig
    ) {
        MapTemplate.startNavigation(trip)
    }

    override fun stopNavigation(templateId: String) {
        MapTemplate.stopNavigation()
    }
}