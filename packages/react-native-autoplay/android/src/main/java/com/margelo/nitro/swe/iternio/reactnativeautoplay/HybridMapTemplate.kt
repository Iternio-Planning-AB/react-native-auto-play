package com.margelo.nitro.swe.iternio.reactnativeautoplay

import android.os.SystemClock
import androidx.car.app.model.Alert
import com.facebook.react.bridge.UiThreadUtil
import com.margelo.nitro.core.Promise
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.AndroidAutoTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.MapTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.RoutePreviewTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.template.TripPreviewTemplate
import com.margelo.nitro.swe.iternio.reactnativeautoplay.utils.TemplateUpdateQueue

class HybridMapTemplate : HybridMapTemplateSpec() {
    // cleared on the main thread by the host's dismissal
    @Volatile
    var navigationAlert: NitroNavigationAlert? = null
    private var navigationAlertShownAt = 0L

    override fun createMapTemplate(config: MapTemplateConfig) {
        val context = AndroidAutoSession.getCarContext(config.id) ?: throw IllegalArgumentException(
            "createMapTemplate failed, carContext not found"
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
        navigationAlertShownAt = SystemClock.elapsedRealtime()
    }

    override fun updateNavigationAlert(
        templateId: String, navigationAlertId: Double, title: AutoText, subtitle: AutoText?
    ) {
        navigationAlert?.let {
            if (it.id != navigationAlertId) {
                return
            }
            // showing the alert again restarts its countdown, so pass only the time it has left
            val durationMs = if (it.durationMs >= Alert.DURATION_SHOW_INDEFINITELY) {
                it.durationMs
            } else {
                val elapsedMs = SystemClock.elapsedRealtime() - navigationAlertShownAt
                (it.durationMs - elapsedMs).coerceAtLeast(1.0)
            }
            val navigationAlert = it.copy(title = title, subtitle = subtitle, durationMs = durationMs)
            val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
            template.showAlert(navigationAlert)
        }
    }

    override fun dismissNavigationAlert(
        templateId: String, navigationAlertId: Double
    ) {
        val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
        template.dismissAlert(navigationAlertId.toInt())
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
        return TemplateUpdateQueue.enqueue {
            val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
            template.setMapActions(buttons)
        }
    }

    override fun setTemplateHideControls(
        templateId: String, hideControls: HideControls
    ): Promise<Unit> {
        return TemplateUpdateQueue.enqueue {
            val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
            template.setHideControls(hideControls)
        }
    }

    override fun updateVisibleTravelEstimate(
        templateId: String, visibleTravelEstimate: VisibleTravelEstimate
    ) {
        // same as on iOS: an unknown template throws right away, the update is queued without
        // waiting so JS never blocks behind slow updates (e.g. remote images) queued before it
        val template = AndroidAutoTemplate.getTemplate<MapTemplate>(templateId)
        TemplateUpdateQueue.post { template.updateVisibleTravelEstimate(visibleTravelEstimate) }
    }

    override fun updateTravelEstimates(templateId: String, steps: Array<TripPoint>) {
        TemplateUpdateQueue.post { MapTemplate.updateTravelEstimates(steps) }
    }

    override fun updateManeuvers(
        templateId: String, maneuvers: NitroManeuver
    ) {
        TemplateUpdateQueue.post { MapTemplate.updateManeuvers(maneuvers) }
    }

    override fun startNavigation(
        templateId: String, trip: TripConfig
    ): Promise<Unit> {
        return TemplateUpdateQueue.enqueue {
            MapTemplate.startNavigation(trip)
        }
    }

    override fun stopNavigation(templateId: String) {
        TemplateUpdateQueue.post { MapTemplate.stopNavigation() }
    }

    override fun setManeuverState(templateId: String, state: ManeuverState) {
        // Android Auto does not have an equivalent to CPManeuverState
    }

    override fun updateOptionsPanel(templateId: String, config: NitroOptionsPanelConfig?): Promise<Unit> {
        // Android Auto has no equivalent to CarPlay's navigation session options panel
        return Promise.async {}
    }
}
