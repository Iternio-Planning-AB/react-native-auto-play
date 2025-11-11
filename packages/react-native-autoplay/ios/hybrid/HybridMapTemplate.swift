//
//  HybridMapTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

class HybridMapTemplate: HybridHybridMapTemplateSpec {
    func createMapTemplate(config: MapTemplateConfig) throws {
        let template = MapTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func setTemplateMapButtons(templateId: String, buttons: [NitroMapButton]?)
        throws
    {
        try RootModule.withTemplate(templateId: templateId) {
            template in
            guard let template = template as? MapTemplate else {
                return
            }

            template.config.mapButtons = buttons
            template.invalidate()
        }
    }

    func showNavigationAlert(templateId: String, alert: NitroNavigationAlert)
        throws
    {
        try RootModule.withMapTemplate(templateId: templateId) { template in
            template.showAlert(alertConfig: alert)
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

        try RootModule.withMapTemplate(templateId: templateId) { template in
            callback = try template.showTripSelector(
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
        try RootModule.withMapTemplate(templateId: templateId) { template in
            template.hideTripSelector()
        }
    }

    func updateVisibleTravelEstimate(
        templateId: String,
        visibleTravelEstimate: VisibleTravelEstimate
    ) throws {
        try RootModule.withMapTemplate(templateId: templateId) { template in
            template.updateVisibleTravelEstimate(
                visibleTravelEstimate: visibleTravelEstimate
            )
        }
    }

    func updateTravelEstimates(templateId: String, steps: [TripPoint]) throws {
        try RootModule.withMapTemplate(templateId: templateId) { template in
            template.updateTravelEstimates(steps: steps)
        }
    }

    func updateManeuvers(templateId: String, maneuvers: NitroManeuver) throws {
        try RootModule.withMapTemplate(templateId: templateId) {
            template in
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
        try RootModule.withMapTemplate(templateId: templateId) { template in
            let trip = Parser.parseTrip(tripConfig: trip)
            template.startNavigation(trip: trip)
        }
    }

    func stopNavigation(templateId: String) throws {
        try RootModule.withMapTemplate(templateId: templateId) { template in
            template.stopNavigation()
        }
    }

}
