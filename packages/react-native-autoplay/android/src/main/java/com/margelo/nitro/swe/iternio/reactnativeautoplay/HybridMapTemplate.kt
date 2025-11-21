package com.margelo.nitro.swe.iternio.reactnativeautoplay

import androidx.car.app.AppManager
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MapTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.RoutePreviewTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.TripPreviewTemplate

class HybridMapTemplate : HybridMapTemplateSpec() {
    var navigationAlert: NitroNavigationAlert? = null

    override fun createMapTemplate(config: MapTemplateConfig) {
        val context = AndroidAutoSession.getCarContext(config.id) ?: throw IllegalArgumentException(
            "createMapTemplate failed, carContext found"
        )

        val template = MapTemplate(context, config, initNavigationManager = true)
        AndroidAutoTemplate.setTemplate(config.id, template)
    }

    override fun showNavigationAlert(
        templateId: String, alert: NitroNavigationAlert
    ) {
        val alertConfig = alert.copy(onDidDismiss = { reason ->
            navigationAlert = null
            alert.onDidDismiss?.let { it(reason) }
        })
        val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
        template.showAlert(alertConfig)
        navigationAlert = alertConfig
    }

    override fun updateNavigationAlert(
        templateId: String, navigationAlertId: Double, title: AutoText, subtitle: AutoText?
    ) {
        navigationAlert?.let {
            if (it.id != navigationAlertId) {
                return
            }
            val navigationAlert = it.copy(title = title, subtitle = subtitle)
            val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
            template.showAlert(navigationAlert)
        }
    }

    override fun dismissNavigationAlert(
        templateId: String, navigationAlertId: Double
    ) {
        val carContext = AndroidAutoSession.getCarContext(AndroidAutoSession.ROOT_SESSION)
            ?: throw IllegalArgumentException(
                "dismissNavigationAlert failed, carContext found"
            )
        carContext.getCarService(AppManager::class.java).dismissAlert(navigationAlertId.toInt())
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
            val topMessageTemplate = AndroidAutoTemplate.getTopMessageTemplate()

            screenManager.push(screen)

            topMessageTemplate?.let {
                // make sure any visible message template is still on top of the trip selector
                screenManager.push(topMessageTemplate)
            }
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
    ): Promise<Unit> {
        return Promise.async {
            val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
            template.setMapActions(buttons)
        }
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