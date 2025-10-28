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
    var onTripSelected: ((_ tripId: String, _ routeId: String) -> Void)?
    var onTripStarted: ((_ tripId: String, _ routeId: String) -> Void)?

    var navigationSession: CPNavigationSession?

    init(config: MapTemplateConfig) {
        self.config = config

        super.init(
            template: CPMapTemplate(id: config.id),
            header: config.headerActions
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
                    let icon = SymbolFont.imageFromNitroImage(
                        image: image,
                        size: CPButtonMaximumImageSize.height,
                        fontScale: 0.65,
                        traitCollection: traitCollection
                    )!
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

    // MARK: maneuver style
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        displayStyleFor maneuver: CPManeuver
    ) -> CPManeuverDisplayStyle {
        if maneuver.attributedInstructionVariants.count == 0 {
            return .symbolOnly
        }
        return .leadingSymbol
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

        let image = SymbolFont.imageFromNitroImage(
            image: alertConfig.image,
            traitCollection: traitCollection
        )

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
        trips: [TripsConfig],
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: @escaping (_ tripId: String, _ routeId: String) -> Void,
        onTripStarted: @escaping (_ tripId: String, _ routeId: String) -> Void
    ) {
        guard let template = self.template as? CPMapTemplate else { return }

        self.onTripSelected = onTripSelected
        self.onTripStarted = onTripStarted

        let textConfiguration = Parser.parseTripPreviewTextConfig(
            textConfig: textConfig
        )

        let tripPreviews = Parser.parseTrips(trips: trips)
        let selectedTrip = selectedTripId.flatMap { tripId in
            tripPreviews.first(where: { $0.id == tripId })
        }

        template.showTripPreviews(
            tripPreviews,
            selectedTrip: selectedTrip,
            textConfiguration: textConfiguration
        )

        tripPreviews.forEach { trip in
            guard
                let travelEstimates = trip.routeChoices.first?
                    .travelEstimates.last
            else { return }

            template.updateEstimates(travelEstimates, for: trip)
        }
    }

    func hideTripSelector() {
        guard let template = self.template as? CPMapTemplate else { return }

        template.hideTripPreviews()
        self.onTripSelected = nil
        self.onTripStarted = nil
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        selectedPreviewFor trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {
        let tripId = trip.id
        let routeId = routeChoice.id
        self.onTripSelected?(tripId, routeId)

        if let travelEstimates = trip.routeChoices.first(where: {
            $0.id == routeId
        })?.travelEstimates.last {
            mapTemplate.updateEstimates(travelEstimates, for: trip)
        }
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        startedTrip trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {
        if let onTripStarted = self.onTripStarted {
            let tripId = trip.id
            let routeId = routeChoice.id

            onTripStarted(tripId, routeId)
        }

        hideTripSelector()

        let trip = CPTrip(
            origin: trip.origin,
            destination: trip.destination,
            routeChoices: [routeChoice]
        )

        startNavigation(trip: trip)
    }

    func updateVisibleTravelEstimate(
        visibleTravelEstimate: VisibleTravelEstimate?
    ) {
        guard let template = self.template as? CPMapTemplate else { return }

        if let visibleTravelEstimate = visibleTravelEstimate {
            config.visibleTravelEstimate = visibleTravelEstimate
        }

        guard let trip = navigationSession?.trip else { return }

        let travelEstaimtes = trip.routeChoices.first?
            .travelEstimates
        if let estimates = config.visibleTravelEstimate == .first
            ? travelEstaimtes?.first : travelEstaimtes?.last
        {
            template.updateEstimates(estimates, for: trip)
        }

    }

    func updateTravelEstimates(steps: [TripPoint]) {
        guard let route = navigationSession?.trip.routeChoices.first else {
            return
        }

        if var userInfo = route.userInfo as? [String: Any?] {
            userInfo["travelEstimates"] = steps.map { step in
                Parser.parseTravelEstiamtes(
                    travelEstimates: step.travelEstimates
                )
            }
            route.userInfo = userInfo
        }

        updateVisibleTravelEstimate(visibleTravelEstimate: nil)
    }

    func updateManeuvers(maneuvers: [NitroManeuver]) {
        guard let template = template as? CPMapTemplate else { return }
        guard let navigationSession = navigationSession else { return }

        template.guidanceBackgroundColor =
            RCTConvert.uiColor(maneuvers.first?.cardBackgroundColor) ?? .black

        var upcomingManeuvers: [CPManeuver] = []

        let sessionManeuvers = navigationSession.upcomingManeuvers.filter {
            maneuver in
            !maneuver.isSecondary
        }

        for (index, nitroManeuver) in maneuvers.enumerated() {
            if let maneuverIndex =
                sessionManeuvers
                .firstIndex(where: { $0.id == nitroManeuver.id })
            {
                navigationSession.updateEstimates(
                    Parser.parseTravelEstiamtes(
                        travelEstimates: nitroManeuver.travelEstimates
                    ),
                    for: navigationSession.upcomingManeuvers[maneuverIndex]
                )

                if index != maneuverIndex {
                    let maneuver = navigationSession.upcomingManeuvers.first(
                        where: { $0.id == nitroManeuver.id }
                    )!
                    upcomingManeuvers.append(maneuver)
                }
                continue
            }

            let maneuver = Parser.parseManeuver(
                nitroManeuver: nitroManeuver,
                traitCollection: traitCollection
            )
            upcomingManeuvers.append(maneuver)
        }

        if upcomingManeuvers.count > 0 {
            if #available(iOS 17.4, *) {
                upcomingManeuvers = upcomingManeuvers.flatMap { maneuver in
                    if let laneImages = maneuver.laneImages {
                        // CarPlay has a limitation of 120x18 for the symbolImage on secondaryManeuver that shows lanes only
                        let secondarySymbolImage = SymbolFont.imageFromLanes(
                            laneImages: laneImages.prefix(Int(120 / 18)),
                            size: 18,
                            traitCollection: traitCollection
                        )

                        let secondaryManeuver = CPManeuver(
                            id: maneuver.id + "-lanes",
                            isSecondary: true
                        )
                        secondaryManeuver.symbolImage = secondarySymbolImage
                        return [maneuver, secondaryManeuver]
                    } else {
                        return [maneuver]
                    }
                }

                navigationSession.add(
                    upcomingManeuvers.filter({ maneuver in
                        !navigationSession.upcomingManeuvers.contains(where: {
                            $0.id == maneuver.id
                        })
                    })
                )

                let laneGuidances = upcomingManeuvers.compactMap {
                    $0.laneGuidance
                }
                if laneGuidances.isEmpty {
                    navigationSession.currentLaneGuidance = nil
                } else {
                    navigationSession.add(laneGuidances)
                    navigationSession.currentLaneGuidance = laneGuidances.first
                }

                if let roadFollowingManeuverVariants = upcomingManeuvers.first?
                    .roadFollowingManeuverVariants
                {
                    navigationSession.currentRoadNameVariants =
                        roadFollowingManeuverVariants
                }
            }

            navigationSession.upcomingManeuvers = upcomingManeuvers
        }
    }

    func startNavigation(trip: CPTrip) {
        guard let template = self.template as? CPMapTemplate else { return }

        let routeChoice = trip.routeChoices.first

        if let travelEstimates = config.visibleTravelEstimate == .first
            ? routeChoice?.travelEstimates.first
            : routeChoice?.travelEstimates.last
        {
            template.updateEstimates(travelEstimates, for: trip)
        }

        self.navigationSession = template.startNavigationSession(for: trip)
    }

    func stopNavigation() {
        navigationSession?.finishTrip()
    }
}
