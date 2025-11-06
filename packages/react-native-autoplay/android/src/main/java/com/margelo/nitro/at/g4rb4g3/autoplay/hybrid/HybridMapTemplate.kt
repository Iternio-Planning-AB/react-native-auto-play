package com.margelo.nitro.at.g4rb4g3.autoplay.hybrid

import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoScreen
import com.margelo.nitro.at.g4rb4g3.autoplay.AndroidAutoSession
import com.margelo.nitro.at.g4rb4g3.autoplay.template.AndroidAutoTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.MapTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.RoutePreviewTemplate
import com.margelo.nitro.at.g4rb4g3.autoplay.template.TripPreviewTemplate

class HybridMapTemplate : HybridHybridMapTemplateSpec() {
    override fun createMapTemplate(config: MapTemplateConfig) {
        val context =
            AndroidAutoSession.Companion.getCarContext(config.id) ?: throw IllegalArgumentException(
                "createMapTemplate failed, carContext found"
            )

        val template = MapTemplate(context, config, initNavigationManager = true)
        AndroidAutoTemplate.Companion.setTemplate(config.id, template)
    }

    override fun showNavigationAlert(templateId: String, alert: NitroNavigationAlert) {
        val template = AndroidAutoTemplate.Companion.getTemplate<MapTemplate>(templateId)
        template.showAlert(alert)
    }

    override fun showTripSelector(
        templateId: String,
        trips: Array<TripsConfig>,
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: (String, String) -> Unit,
        onTripStarted: (String, String) -> Unit,
        onBackPressed: () -> Unit,
        mapButtons: Array<NitroMapButton>
    ) {
        val context = AndroidAutoSession.Companion.getRootContext()
            ?: throw IllegalArgumentException("showTripSelector failed, carContext not found")
        val screenManager = AndroidAutoScreen.Companion.getScreenManager()
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
    }

    override fun hideTripSelector(templateId: String) {
        val screenManager = AndroidAutoScreen.Companion.getScreenManager()
            ?: throw IllegalArgumentException("hideTripSelector failed, screenManager not found")
        val screens = screenManager.screenStack.filter {
            it.marker == TripPreviewTemplate.Companion.TAG || it.marker == RoutePreviewTemplate.Companion.TAG
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
        val template = AndroidAutoTemplate.Companion.getTemplate<MapTemplate>(templateId)
        template.setMapActions(buttons)
    }

    override fun updateVisibleTravelEstimate(
        templateId: String, visibleTravelEstimate: VisibleTravelEstimate
    ) {
        val template = AndroidAutoTemplate.Companion.getTemplate<MapTemplate>(templateId)
        template.updateVisibleTravelEstimate(visibleTravelEstimate)
    }

    override fun updateTravelEstimates(templateId: String, steps: Array<TripPoint>) {
        MapTemplate.updateTravelEstimates(steps)
    }

    override fun updateManeuvers(
        templateId: String, maneuvers: Array<NitroManeuver>
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