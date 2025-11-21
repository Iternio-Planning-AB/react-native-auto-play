//
//  HybridMapTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

import CarPlay
import NitroModules

class HybridMapTemplate: HybridMapTemplateSpec {
    func createMapTemplate(config: MapTemplateConfig) throws {
        let template = MapTemplate(config: config)
        TemplateStore.addTemplate(
            template: template,
            templateId: config.id
        )
    }

    func setTemplateMapButtons(templateId: String, buttons: [NitroMapButton]?)
        throws -> Promise<Void>
    {
        return Promise.async {
            guard
                let template = TemplateStore.getTemplate(templateId: templateId)
                    as? MapTemplate
            else {
                throw AutoPlayError.invalidTemplateError(
                    "\(templateId) is not a MapTemplate"
                )
            }
            
            await MainActor.run {
                template.config.mapButtons = buttons
                template.invalidate()
            }
        }
    }

    func showNavigationAlert(templateId: String, alert: NitroNavigationAlert)
        throws
    {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            template.showAlert(alertConfig: alert)
        }
    }

    func updateNavigationAlert(
        templateId: String,
        navigationAlertId: Double,
        title: AutoText,
        subtitle: AutoText?
    ) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
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
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
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
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            template.hideTripSelector()
        }
    }

    func updateVisibleTravelEstimate(
        templateId: String,
        visibleTravelEstimate: VisibleTravelEstimate
    ) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            template.updateVisibleTravelEstimate(
                visibleTravelEstimate: visibleTravelEstimate
            )
        }
    }

    func updateTravelEstimates(templateId: String, steps: [TripPoint]) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            template.updateTravelEstimates(steps: steps)
        }
    }

    func updateManeuvers(templateId: String, maneuvers: NitroManeuver) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            switch maneuvers {
            case .first(let routingManeuvers):
                {
                    template.updateManeuvers(maneuvers: routingManeuvers)
                }()
            case .second(let messageManeuver):
                {
                    template.updateManeuvers(messageManeuver: messageManeuver)
                }()
            }

        }
    }

    func startNavigation(templateId: String, trip: TripConfig) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            let trip = Parser.parseTrip(tripConfig: trip)
            template.startNavigation(trip: trip)
        }
    }

    func stopNavigation(templateId: String) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: MapTemplate) in
            template.stopNavigation()
        }
    }
}
