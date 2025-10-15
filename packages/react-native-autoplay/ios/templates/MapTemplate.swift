//
//  MapTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay
import React

struct AlertStoreEntry {
    let alert: CPNavigationAlert
    let config: NitroNavigationAlert
}

class MapTemplate: AutoPlayTemplate, CPMapTemplateDelegate {
    var config: MapTemplateConfig

    var alertStore: [Double: AlertStoreEntry] = [:]
    var onTripSelected: ((_ tripId: String, _ routeId: String?) -> Void)?

    init(config: MapTemplateConfig) {
        self.config = config

        super.init(
            templateId: config.id,
            template: CPMapTemplate(),
            header: config.actions
        )

        if let template = self.template as? CPMapTemplate {
            template.mapDelegate = self
        }

        invalidate()
    }

    override func invalidate() {
        guard let template = self.template as? CPMapTemplate else { return }

        setBarButtons()

        if let mapButtons = config.mapButtons {
            template.mapButtons = mapButtons.map { button in
                if let image = button.image {
                    let icon = SymbolFont.imageFromNitroImage(image: image)!
                    return CPMapButton(image: icon) { _ in
                        button.onPress()
                    }
                }
                return CPMapButton { _ in
                    button.onPress()
                }
            }
        }
    }

    override func onWillAppear(animted: Bool) {
        config.onWillAppear?(animted)
    }

    override func onDidAppear(animted: Bool) {
        config.onDidDisappear?(animted)
    }

    override func onWillDisappear(animted: Bool) {
        config.onWillDisappear?(animted)
    }

    override func onDidDisappear(animted: Bool) {
        config.onDidDisappear?(animted)
    }

    override func onPopped() {
        config.onPopped?()
    }

    // MARK: gestures
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didUpdatePanGestureWithTranslation: CGPoint,
        velocity: CGPoint
    ) {
        config.onDidUpdatePanGestureWithTranslation?(
            Point(
                x: didUpdatePanGestureWithTranslation.x,
                y: didUpdatePanGestureWithTranslation.y
            ),
            Point(x: velocity.x, y: velocity.y)
        )
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didUpdateZoomGestureWithCenter center: CGPoint,
        scale: CGFloat,
        velocity: CGFloat
    ) {
        config.onDidUpdateZoomGestureWithCenter?(
            Point(x: center.x, y: center.y),
            scale,
            velocity
        )
    }

    // MARK: display style
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        displayStyleFor maneuver: CPManeuver
    ) -> CPManeuverDisplayStyle {
        return .leadingSymbol  // same as CPManeuverDisplayStyleDefault
        //        if(maneuver.instructionVariants.count == 0) {
        //            return CPManeuverDisplayStyleSymbolOnly;
        //        } else {
        //            return CPManeuverDisplayStyleDefault;
        //        }
    }

    // MARK: navigation events
    func mapTemplateDidCancelNavigation(_ mapTemplate: CPMapTemplate) {

    }

    func mapTemplateShouldProvideNavigationMetadata(
        _ mapTemplate: CPMapTemplate
    ) -> Bool {
        // this enables the "standard cluster" & "head up display" maneuvers
        return true
    }

    //MARK: notifications
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        shouldShowNotificationFor maneuver: CPManeuver
    ) -> Bool {
        return false
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        shouldUpdateNotificationFor maneuver: CPManeuver,
        with travelEstimates: CPTravelEstimates
    ) -> Bool {
        return false
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        shouldShowNotificationFor navigationAlert: CPNavigationAlert
    ) -> Bool {
        return false
    }

    // MARK: alerts
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        willShow navigationAlert: CPNavigationAlert
    ) {
        guard
            let onWillShow = alertStore.values.first(where: {
                $0.alert == navigationAlert
            })?.config.onWillShow
        else { return }

        onWillShow()
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didDismiss navigationAlert: CPNavigationAlert,
        dismissalContext: CPNavigationAlert.DismissalContext
    ) {
        guard
            let config = alertStore.values.first(where: {
                $0.alert == navigationAlert
            })?.config
        else {
            return
        }

        switch dismissalContext {
        case .userDismissed:
            config.onDidDismiss?(AlertDismissalReason.user)
        case .timeout:
            config.onDidDismiss?(AlertDismissalReason.timeout)
        case .systemDismissed:
            config.onDidDismiss?(AlertDismissalReason.system)
        @unknown default:
            break
        }

        alertStore.removeValue(forKey: config.id)
    }

    func showAlert(alertConfig: NitroNavigationAlert) {
        guard let template = self.template as? CPMapTemplate else { return }

        let title = Parser.parseText(text: alertConfig.title)!
        let subtitle = alertConfig.subtitle.map { subtitle in
            [Parser.parseText(text: subtitle)!]
        }

        if let alert = alertStore[alertConfig.id] {
            alert.alert.updateTitleVariants(
                [title],
                subtitleVariants: subtitle ?? []
            )
            return
        }

        let image = SymbolFont.imageFromNitroImage(image: alertConfig.image)

        let style = Parser.parseActionAlertStyle(
            style: alertConfig.primaryAction.style
        )
        let primaryAction = CPAlertAction(
            title: alertConfig.primaryAction.title,
            style: style
        ) { _ in
            alertConfig.primaryAction.onPress()
        }

        let secondaryAction = alertConfig.secondaryAction.map { action in
            let style = Parser.parseActionAlertStyle(style: action.style)
            return CPAlertAction(title: action.title, style: style) { _ in
                action.onPress()
            }
        }

        let alert = CPNavigationAlert(
            titleVariants: [title],
            subtitleVariants: subtitle,
            image: image,
            primaryAction: primaryAction,
            secondaryAction: secondaryAction,
            duration: alertConfig.durationMs / 1000
        )

        alertStore[alertConfig.id] = AlertStoreEntry(
            alert: alert,
            config: alertConfig
        )

        template.present(navigationAlert: alert, animated: true)
    }

    // MARK: trip selection
    func showTripSelector(
        trips: [TripConfig],
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: @escaping (_ tripId: String, _ routeId: String?) -> Void
    ) throws {
        guard let template = self.template as? CPMapTemplate else { return }

        self.onTripSelected = onTripSelected

        let textConfiguration = Parser.parseTripPreviewTextConfig(
            textConfig: textConfig
        )

        let tripPreviews = Parser.parseTrips(trips: trips)
        let selectedTrip = try selectedTripId.flatMap { tripId in
            try tripPreviews.first(where: { try $0.getTripId() == tripId })
        }

        template.showTripPreviews(
            tripPreviews,
            selectedTrip: selectedTrip,
            textConfiguration: textConfiguration
        )

        try tripPreviews.forEach { trip in
            guard
                let travelEstimates = try trip.routeChoices.first?
                    .getTravelEstimates()
            else { return }

            template.updateEstimates(travelEstimates, for: trip)
        }
    }

    func hideTripSelector() {
        guard let template = self.template as? CPMapTemplate else { return }

        template.hideTripPreviews()
        self.onTripSelected = nil
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        selectedPreviewFor trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {
        do {
            let tripId = try trip.getTripId()
            let routeId = try routeChoice.getRouteId()
            self.onTripSelected?(tripId, routeId)

            if let travelEstimates = try trip.routeChoices.first(where: {
                try $0.getRouteId() == routeId
            })?.getTravelEstimates() {
                mapTemplate.updateEstimates(travelEstimates, for: trip)
            }
        } catch {
            print("Unexpected error: \(error).")
        }
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        startedTrip trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {
        self.onTripSelected = nil
    }
}
