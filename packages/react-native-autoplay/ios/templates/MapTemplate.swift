//
//  MapTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay

struct NavigationAlertWrapper {
    let alert: CPNavigationAlert
    let config: NitroNavigationAlert
}

class MapTemplate: AutoPlayHeaderProviding,
    CPMapTemplateDelegate
{
    let template: CPMapTemplate
    var config: MapTemplateConfig

    let screenDimensions: CGSize

    var mapButtons: [NitroMapButton]?
    var visibleTravelEstimate: VisibleTravelEstimate?

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    var onTripSelected: ((_ tripId: String, _ routeId: String) -> Void)?
    var onTripStarted: ((_ tripId: String, _ routeId: String) -> Void)?
    var navigationSession: CPNavigationSession?
    var navigationAlert: NavigationAlertWrapper?
    var currentTripId: String?

    var tripSelectorVisible = false
    /**
     this avoids a race condition when invalidating the template that causes an App Hang (main‑thread stall)
     when using CPMapTemplate.isPanningInterfaceVisible
     */
    private var isPanningInterfaceVisible = false

    init(config: MapTemplateConfig) {
        self.config = config

        mapButtons = config.mapButtons
        visibleTravelEstimate = config.visibleTravelEstimate

        template = CPMapTemplate(id: config.id)
        if let nitroColor = config.defaultGuidanceBackgroundColor,
            let traitCollection = SceneStore.getRootTraitCollection()
        {
            let cardBackgroundColor = Parser.routingManeuverCardBackgroundUIColor(
                color: nitroColor,
                traitCollection: traitCollection
            )
            template.guidanceBackgroundColor = cardBackgroundColor
        }
        else {
            template.guidanceBackgroundColor = .black
        }

        if let initialProperties = SceneStore.getRootScene()?.initialProperties,
            let windowDict = initialProperties["window"] as? [String: Any],
            let height = windowDict["height"] as? CGFloat,
            let width = windowDict["width"] as? CGFloat
        {
            screenDimensions = CGSize(
                width: width,
                height: height
            )
        }
        else {
            screenDimensions = CGSize(width: 0, height: 0)
        }

        super.init()

        barButtons = config.headerActions
        template.mapDelegate = self
    }

    func onPanButtonPress() {
        if isPanningInterfaceVisible {
            template.dismissPanningInterface(animated: true)
        }
        else {
            template.showPanningInterface(animated: true)
        }
    }

    func parseMapButtons(mapButtons: [NitroMapButton]) -> [CPMapButton] {
        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return []
        }

        return mapButtons.map { button in
            if let glyphImage = button.image.glyphImage,
                let icon = SymbolFont.imageFromNitroImage(
                    image: glyphImage,
                    size: CPButtonMaximumImageSize.height,
                    traitCollection: traitCollection
                )
            {
                return CPMapButton(image: icon) { _ in
                    if button.type == .pan {
                        self.onPanButtonPress()
                        return
                    }
                    button.onPress?()
                }
            }
            if let assetImage = button.image.assetImage,
                let icon = Parser.parseAssetImage(
                    assetImage: assetImage,
                    traitCollection: traitCollection
                )
            {
                return CPMapButton(image: icon) { _ in
                    if button.type == .pan {
                        self.onPanButtonPress()
                        return
                    }
                    button.onPress?()
                }
            }
            if let remoteImage = button.image.remoteImage,
                let icon = Parser.parseRemoteImage(
                    remoteImage: remoteImage,
                    traitCollection: traitCollection
                )
            {
                return CPMapButton(image: icon) { _ in
                    if button.type == .pan {
                        self.onPanButtonPress()
                        return
                    }
                    button.onPress?()
                }
            }

            return CPMapButton { _ in
                if button.type == .pan {
                    self.onPanButtonPress()
                    return
                }
                button.onPress?()
            }
        }

    }

    @MainActor
    override func _invalidate() {
        if tripSelectorVisible {
            // ignore invalidate calls to not break the trip selectors back button
            return
        }

        if isPanningInterfaceVisible {
            // while panning interface is shown we only provide a back button on the header
            // and all map buttons except the pan button
            // reason is that you can have a max of 2 map buttons while panning interface is shown
            // best practice is to provide zoom buttons then but then there is no more room for the pan button to exit pan mode
            template.trailingNavigationBarButtons = []
            template.leadingNavigationBarButtons = []
            template.backButton = CPBarButton(title: "") { _ in
                self.template.dismissPanningInterface(animated: true)
            }

            let mapButtons =
                mapButtons?.filter { button in
                    button.type != .pan
                } ?? []

            template.mapButtons = parseMapButtons(mapButtons: mapButtons)

            return
        }

        setBarButtons(template: template, barButtons: barButtons)

        if let mapButtons = mapButtons {
            template.mapButtons = parseMapButtons(mapButtons: mapButtons)
        }
    }

    override func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    override func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    override func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    override func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    override func onPopped() {
        config.onPopped?()
    }

    @MainActor
    override func traitCollectionDidChange() {
        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        let isDark = traitCollection.userInterfaceStyle == .dark

        config.onAppearanceDidChange?(
            isDark ? .dark : .light
        )

        template.tripEstimateStyle = isDark ? .dark : .light

        invalidate()
    }

    // MARK: gestures
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didUpdatePanGestureWithTranslation: CGPoint,
        velocity: CGPoint
    ) {
        config.onDidPan?(
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
        if isPanningInterfaceVisible {
            return
        }

        if scale == 1 && velocity == 1 {
            config.onDoubleClick?(Point(x: center.x, y: center.y))
            return
        }

        config.onDidUpdateZoomGestureWithCenter?(
            Point(x: center.x, y: center.y),
            1 - velocity * 0.1
        )
    }

    func mapTemplateDidShowPanningInterface(_ mapTemplate: CPMapTemplate) {
        isPanningInterfaceVisible = true
        config.onDidChangePanningInterface?(true)
        invalidate()
    }
    func mapTemplateDidDismissPanningInterface(_ mapTemplate: CPMapTemplate) {
        isPanningInterfaceVisible = false
        config.onDidChangePanningInterface?(false)
        invalidate()
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        panWith direction: CPMapTemplate.PanDirection
    ) {
        let panButtonScrollPercentage = config.panButtonScrollPercentage ?? 0.15
        let scrollDistanceX = screenDimensions.width * panButtonScrollPercentage
        let scrollDistanceY =
            screenDimensions.height * panButtonScrollPercentage

        var translation = CGPoint.zero

        switch direction {
        case .left:
            translation.x = scrollDistanceX
        case .right:
            translation.x = -scrollDistanceX
        case .up:
            translation.y = scrollDistanceY
        case .down:
            translation.y = -scrollDistanceY
        default:
            return
        }

        let velocity = CGPoint(x: translation.x * 2, y: translation.y * 2)

        config.onDidPan?(
            Point(x: translation.x, y: translation.y),
            Point(x: velocity.x, y: velocity.y)
        )
    }

    // MARK: maneuver style
    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        displayStyleFor maneuver: CPManeuver
    ) -> CPManeuverDisplayStyle {
        if maneuver.attributedInstructionVariants.count == 0
            && maneuver.instructionVariants.count == 0
        {
            return .symbolOnly
        }
        return .leadingSymbol
    }

    // MARK: navigation events
    func mapTemplateDidCancelNavigation(_ mapTemplate: CPMapTemplate) {
        config.onStopNavigation()
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
        self.navigationAlert?.config.onWillShow?()
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        didDismiss navigationAlert: CPNavigationAlert,  // this seems to be currentNavigationAlert when an alert is dismissed due to pushing a new one
        dismissalContext: CPNavigationAlert.DismissalContext
    ) {
        // Helper to get dismissal reason from context
        let dismissalReason: AlertDismissalReason = {
            switch dismissalContext {
            case .userDismissed: return .user
            case .timeout: return .timeout
            case .systemDismissed: return .system
            @unknown default:
                return .system
            }
        }()

        self.navigationAlert?.config.onDidDismiss?(dismissalReason)
        self.navigationAlert = nil
    }

    func showAlert(alertConfig: NitroNavigationAlert) {
        if let priority = self.navigationAlert?.config.priority,
            priority > alertConfig.priority
        {
            return
        }

        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        guard let title = Parser.parseText(text: alertConfig.title) else { return }
        let subtitle = alertConfig.subtitle.flatMap { subtitle in
            [Parser.parseText(text: subtitle)].compactMap { $0 }
        }

        let image = Parser.parseNitroImage(
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

        func setNavigationAlert() {
            self.navigationAlert = .init(alert: alert, config: alertConfig)
            template.present(navigationAlert: alert, animated: true)
        }

        if template.currentNavigationAlert != nil {
            template.dismissNavigationAlert(animated: true) { _ in
                setNavigationAlert()
            }
        }
        else {
            setNavigationAlert()
        }
    }

    func updateNavigationAlert(
        alertId: Double,
        title: AutoText,
        subtitle: AutoText?
    ) {
        guard let alert = self.navigationAlert?.alert else {
            return
        }

        if self.navigationAlert?.config.id != alertId {
            return
        }

        guard let title = Parser.parseText(text: title) else { return }
        let subtitle =
            subtitle.flatMap { subtitle in
                [Parser.parseText(text: subtitle)].compactMap { $0 }
            } ?? []

        alert.updateTitleVariants([title], subtitleVariants: subtitle)
    }

    func dismissNavigationAlert(alertId: Double) {
        if let id = self.navigationAlert?.config.id, id != alertId {
            return
        }

        template.dismissNavigationAlert(animated: true) { _ in }
    }

    // MARK: trip selection
    func showTripSelector(
        trips: [TripsConfig],
        selectedTripId: String?,
        textConfig: TripPreviewTextConfiguration,
        onTripSelected: @escaping (_ tripId: String, _ routeId: String) -> Void,
        onTripStarted: @escaping (_ tripId: String, _ routeId: String) -> Void,
        onBackPressed: @escaping () -> Void,
        mapButtons: [NitroMapButton]
    ) -> TripSelectorCallback {
        tripSelectorVisible = true
        self.onTripSelected = onTripSelected
        self.onTripStarted = onTripStarted

        DispatchQueue.main.async {
            self.template.backButton = CPBarButton(title: "") { _ in
                self.hideTripSelector()

                onBackPressed()
            }

            self.template.leadingNavigationBarButtons = []
            self.template.trailingNavigationBarButtons = []
            self.template.mapButtons = self.parseMapButtons(
                mapButtons: mapButtons
            )
        }

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

        let callback = TripSelectorCallback { tripId in
            let selectedTrip = tripPreviews.first { trip in
                trip.id == tripId
            }
            self.template.showTripPreviews(
                tripPreviews,
                selectedTrip: selectedTrip,
                textConfiguration: textConfiguration
            )
        }

        return callback
    }

    func hideTripSelector() {
        currentTripId = nil
        template.hideTripPreviews()

        tripSelectorVisible = false
        onTripSelected = nil
        onTripStarted = nil

        invalidate()
    }

    func mapTemplate(
        _ mapTemplate: CPMapTemplate,
        selectedPreviewFor trip: CPTrip,
        using routeChoice: CPRouteChoice
    ) {
        let tripId = trip.id

        if currentTripId != nil && currentTripId == tripId {
            return
        }

        currentTripId = trip.id

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
        let trip = CPTrip(
            origin: trip.origin,
            destination: trip.destination,
            routeChoices: [routeChoice],
            id: trip.id
        )

        startNavigation(trip: trip)

        if let onTripStarted = self.onTripStarted {
            let tripId = trip.id
            let routeId = routeChoice.id

            onTripStarted(tripId, routeId)
        }

        hideTripSelector()
    }

    func updateVisibleTravelEstimate(
        visibleTravelEstimate: VisibleTravelEstimate?
    ) {
        if let visibleTravelEstimate = visibleTravelEstimate {
            self.visibleTravelEstimate = visibleTravelEstimate
        }

        guard let trip = navigationSession?.trip else { return }

        let travelEstimates = trip.routeChoices.first?
            .travelEstimates
        if let estimates = self.visibleTravelEstimate == .first
            ? travelEstimates?.first : travelEstimates?.last
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
                Parser.parseTravelEstimates(
                    travelEstimates: step.travelEstimates
                )
            }
            route.userInfo = userInfo
        }

        updateVisibleTravelEstimate(visibleTravelEstimate: nil)
    }

    func updateManeuversLoading(loading: NitroLoadingManeuver) {
        guard let navigationSession = navigationSession else { return }

        let description = loading.text

        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            navigationSession.pauseTrip(for: .loading, description: description)
            return
        }

        let cardBackgroundColor = Parser.routingManeuverCardBackgroundUIColor(
            color: loading.cardBackgroundColor,
            traitCollection: traitCollection
        )

        template.guidanceBackgroundColor = cardBackgroundColor

        if #available(iOS 18.0, *) {
            navigationSession.pauseTrip(
                for: .loading,
                description: description,
                turnCardColor: cardBackgroundColor
            )
        }
        else {
            navigationSession.pauseTrip(for: .loading, description: description)
        }
    }

    func updateManeuvers(messageManeuver: NitroMessageManeuver) {
        guard let navigationSession = navigationSession else { return }

        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        let color = messageManeuver.cardBackgroundColor
        let cardBackgroundColor = Parser.parseColor(color: color)

        let maneuver = CPManeuver(id: messageManeuver.title)

        if #available(iOS 15.4, *) {
            maneuver.cardBackgroundColor = cardBackgroundColor
        }
        else {
            template.guidanceBackgroundColor = cardBackgroundColor
        }

        maneuver.instructionVariants = [messageManeuver.title]

        if let symbolImage = Parser.parseNitroImage(
            image: messageManeuver.image,
            traitCollection: traitCollection
        ) {
            maneuver.symbolImage = symbolImage
        }

        if #available(iOS 17.4, *) {
            navigationSession.add([maneuver])
        }

        navigationSession.upcomingManeuvers = [maneuver]
    }

    func updateManeuvers(maneuvers: [NitroRoutingManeuver]) {
        guard let navigationSession = navigationSession else { return }

        if maneuvers.isEmpty {
            navigationSession.upcomingManeuvers = []
            return
        }

        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        if #unavailable(iOS 15.4),
            let color = maneuvers.first?.cardBackgroundColor
        {
            // before iOS 15.4 the color had to be set on the template
            // later on the maneuver which Parser.parseManeuver does
            template.guidanceBackgroundColor = Parser.parseColor(color: color)
        }

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
                    Parser.parseTravelEstimates(
                        travelEstimates: nitroManeuver.travelEstimates
                    ),
                    for: sessionManeuvers[maneuverIndex]
                )

                if index != maneuverIndex {
                    if let maneuver = navigationSession.upcomingManeuvers.first(
                        where: { $0.id == nitroManeuver.id }
                    ) {
                        upcomingManeuvers.append(maneuver)
                    }
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
                        let secondarySymbolImage = Parser.imageFromLanes(
                            laneImages: laneImages.prefix(Int(120 / 18)),
                            traitCollection: traitCollection
                        )

                        let secondaryManeuver = CPManeuver(
                            id: maneuver.id + "-lanes",
                            isSecondary: true
                        )
                        secondaryManeuver.symbolImage = secondarySymbolImage
                        secondaryManeuver.cardBackgroundColor =
                            maneuver.cardBackgroundColor
                        return [maneuver, secondaryManeuver]
                    }
                    else {
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
                }
                else {
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

            // CarPlay only applies an estimate update if the maneuver is already active,
            // since we set new upcomingManeuvers we need to apply the latest travelEstimates on the active maneuver here
            if let currentManeuver = navigationSession.upcomingManeuvers.first,
                let currentNitroManeuver = maneuvers.first
            {
                navigationSession.updateEstimates(
                    Parser.parseTravelEstimates(
                        travelEstimates: currentNitroManeuver.travelEstimates
                    ),
                    for: currentManeuver
                )
            }
        }
    }

    func startNavigation(trip: CPTrip) {
        let routeChoice = trip.routeChoices.first

        if let travelEstimates = visibleTravelEstimate == .first
            ? routeChoice?.travelEstimates.first
            : routeChoice?.travelEstimates.last
        {
            template.updateEstimates(travelEstimates, for: trip)
        }

        if let navigationSession = self.navigationSession {
            let knownTripIds = navigationSession.trip.routeChoices.map { $0.id }
            let incomingTripIds = trip.routeChoices.map { $0.id }

            if navigationSession.trip.id == trip.id
                && knownTripIds == incomingTripIds
            {
                // in case startNavigation is called with the exact same ids we can ignore the call
                return
            }

            navigationSession.finishTrip()
        }

        self.navigationSession = template.startNavigationSession(for: trip)
    }

    func stopNavigation() {
        navigationSession?.finishTrip()
        navigationSession = nil
    }

    func setManeuverState(state: ManeuverState) {
        guard #available(iOS 17.4, *) else { return }
        guard let navigationSession = navigationSession else { return }

        switch state {
        case .continue:
            navigationSession.maneuverState = .continue
        case .initial:
            navigationSession.maneuverState = .initial
        case .prepare:
            navigationSession.maneuverState = .prepare
        case .execute:
            navigationSession.maneuverState = .execute
        }
    }
}
