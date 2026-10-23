//
//  HybridMapTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

import CarPlay
import NitroModules

class HybridMapTemplate: HybridMapTemplateSpec {
    /// The template lookup stays synchronous so a missing template still throws to JS,
    /// nil means there is no root scene and the call is a no-op.
    private func getMapTemplate(templateId: String) throws -> MapTemplate? {
        var mapTemplate: MapTemplate?
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            mapTemplate = template
        }
        return mapTemplate
    }

    /// CPMapTemplate and CPNavigationSession are main thread only. Calls go through the
    /// TemplateUpdateQueue in the order JS issued them, so e.g. maneuvers sent right after
    /// startNavigation can not overtake the session start, and map buttons can not overtake a
    /// header action update or a push.
    private func onMainThread(
        templateId: String,
        perform action: @escaping @MainActor (MapTemplate) -> Void
    ) throws {
        guard let mapTemplate = try getMapTemplate(templateId: templateId) else { return }

        TemplateUpdateQueue.post {
            action(mapTemplate)
        }
    }

    /// The queue moves on once `action` returns, `resolve` may be called later, e.g. when a
    /// deferred navigation session start ran.
    private func onMainThread(
        templateId: String,
        perform action: @escaping @MainActor (MapTemplate, _ resolve: @escaping () -> Void) -> Void
    ) -> Promise<Void> {
        let promise = Promise<Void>()

        do {
            guard let mapTemplate = try getMapTemplate(templateId: templateId) else {
                promise.resolve()
                return promise
            }

            TemplateUpdateQueue.post {
                action(mapTemplate) { promise.resolve() }
            }
        }
        catch {
            promise.reject(withError: error)
        }

        return promise
    }

    /// for calls that update the navigation session, they wait for a pending session start
    private func withNavigationSession(
        templateId: String,
        perform action: @escaping (MapTemplate) -> Void
    ) throws {
        try onMainThread(templateId: templateId) { template in
            template.performWithNavigationSession {
                action(template)
            }
        }
    }

    func createMapTemplate(config: MapTemplateConfig) throws {
        let template = MapTemplate(config: config)

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func setTemplateMapButtons(templateId: String, buttons: [NitroMapButton]?)
        throws -> Promise<Void>
    {
        return onMainThread(templateId: templateId) { template, resolve in
            template.mapButtons = buttons
            template.invalidate()
            resolve()
        }
    }

    func setTemplateHideControls(templateId: String, hideControls: HideControls)
        throws -> Promise<Void>
    {
        return onMainThread(templateId: templateId) { template, resolve in
            template.hideControls = hideControls
            template.invalidate()
            resolve()
        }
    }

    func showNavigationAlert(templateId: String, alert: NitroNavigationAlert)
        throws
    {
        try onMainThread(templateId: templateId) { template in
            template.showAlert(alertConfig: alert)
        }
    }

    func updateNavigationAlert(
        templateId: String,
        navigationAlertId: Double,
        title: AutoText,
        subtitle: AutoText?
    ) throws {
        try onMainThread(templateId: templateId) { template in
            template.updateNavigationAlert(
                alertId: navigationAlertId,
                title: title,
                subtitle: subtitle
            )
        }
    }

    func dismissNavigationAlert(templateId: String, navigationAlertId: Double)
        throws
    {
        try onMainThread(templateId: templateId) { template in
            template.dismissNavigationAlert(alertId: navigationAlertId)
        }
    }

    func showTripSelector(
        templateId: String,
        trips: [TripsConfig],
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: @escaping (_ tripId: String, _ routeId: String) -> Void,
        onTripStarted: @escaping (_ tripId: String, _ routeId: String) -> Void,
        onBackPressed: @escaping () -> Void,
        mapButtons: [NitroMapButton]
    ) throws -> TripSelectorCallback {
        var callback: TripSelectorCallback?

        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            callback = template.showTripSelector(
                trips: trips,
                selectedTripId: selectedTripId,
                textConfig: textConfig,
                onTripSelected: onTripSelected,
                onTripStarted: onTripStarted,
                onBackPressed: onBackPressed,
                mapButtons: mapButtons
            )
        }

        guard let callback = callback else {
            throw AutoPlayError.templateNotFound(templateId)
        }

        return callback
    }

    func hideTripSelector(templateId: String) throws {
        try onMainThread(templateId: templateId) { template in
            template.hideTripSelector()
        }
    }

    func updateVisibleTravelEstimate(
        templateId: String,
        visibleTravelEstimate: VisibleTravelEstimate
    ) throws {
        try withNavigationSession(templateId: templateId) { template in
            template.updateVisibleTravelEstimate(
                visibleTravelEstimate: visibleTravelEstimate
            )
        }
    }

    func updateTravelEstimates(templateId: String, steps: [TripPoint]) throws {
        try withNavigationSession(templateId: templateId) { template in
            template.updateTravelEstimates(steps: steps)
        }
    }

    func updateManeuvers(templateId: String, maneuvers: NitroManeuver) throws {
        try withNavigationSession(templateId: templateId) { template in
            switch maneuvers {
            case .first(let routingManeuvers):
                {
                    template.updateManeuvers(maneuvers: routingManeuvers)
                }()
            case .second(let messageManeuver):
                {
                    template.updateManeuvers(messageManeuver: messageManeuver)
                }()
            case .third(let loading):
                {
                    template.updateManeuversLoading(loading: loading)
                }()
            }

        }
    }

    func startNavigation(templateId: String, trip: TripConfig) throws -> Promise<Void> {
        return onMainThread(templateId: templateId) { template, resolve in
            let trip = Parser.parseTrip(tripConfig: trip)
            template.startNavigation(trip: trip, completion: resolve)
        }
    }

    func stopNavigation(templateId: String) throws {
        try onMainThread(templateId: templateId) { template in
            template.stopNavigation()
        }
    }

    func setManeuverState(templateId: String, state: ManeuverState) throws {
        try withNavigationSession(templateId: templateId) { template in
            template.setManeuverState(state: state)
        }
    }

    func updateOptionsPanel(templateId: String, config: NitroOptionsPanelConfig?) throws
        -> Promise<Void>
    {
        return onMainThread(templateId: templateId) { template, resolve in
            template.updateOptionsPanel(config: config)
            resolve()
        }
    }
}
