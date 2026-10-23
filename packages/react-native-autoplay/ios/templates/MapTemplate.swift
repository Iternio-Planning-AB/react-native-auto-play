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

private struct PendingNavigationStart {
    let generation: Int
    let trip: CPTrip
    let routeChoice: CPRouteChoice?
    var completions: [() -> Void]
    var sessionCalls: [() -> Void]
}

class MapTemplate: AutoPlayHeaderProviding,
    CPMapTemplateDelegate
{
    let template: CPMapTemplate
    var config: MapTemplateConfig

    let screenDimensions: CGSize

    var mapButtons: [NitroMapButton]?
    var visibleTravelEstimate: VisibleTravelEstimate?
    var hideControls: HideControls

    private var optionsPanel: NitroOptionsPanelConfig?

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    var onTripSelected: ((_ tripId: String, _ routeId: String) -> Void)?
    var onTripStarted: ((_ tripId: String, _ routeId: String) -> Void)?
    var navigationSession: CPNavigationSession?
    /// the route choice the active navigation session follows, a session started from the trip preview
    /// is started with CarPlay's own trip and therefore carries every route choice of that trip
    private(set) var activeRouteChoice: CPRouteChoice?
    /// a navigation session start that has not reached CarPlay yet, see startNavigation
    private var pendingStart: PendingNavigationStart?
    private var pendingStartGeneration = 0
    /// number of finishTrip() calls whose main queue turn has not passed yet
    private var finishingTrips = 0
    /// when the active session was started
    private var navigationSessionStartedAt: Date?
    /// a session must not start before this, set when a session younger than minimumSessionAge is finished
    private var nextSessionStartNotBefore: Date?
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
        hideControls = config.hideControls ?? .all

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

        applyHideControls()
        barButtons = config.headerActions
        template.mapDelegate = self
    }

    private func applyHideControls() {
        // CarPlay can only hide the map buttons together with the navigation bar, so there is no
        // mode that hides the map buttons but keeps the header.
        template.automaticallyHidesNavigationBar = hideControls != .none
        template.hidesButtonsWithNavigationBar = hideControls == .all
    }

    func onPanButtonPress() {
        if isPanningInterfaceVisible {
            template.dismissPanningInterface(animated: true)
        }
        else {
            template.showPanningInterface(animated: true)
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

            template.mapButtons = Parser.parseMapButtons(
                mapButtons: mapButtons,
                onPanButtonPress: onPanButtonPress
            )

            return
        }

        // A panel owns the bar and map buttons while it exists; keep barButtons/mapButtons up to date
        // but don't apply them. Hand the buttons back to the topmost panel instead, since leaving
        // the panning interface (or a trait change) would otherwise leave stale buttons behind.
        if #available(iOS 27.0, *),
            let topPanelId = SceneStore.getRootScene()?.interfaceController?.panelTemplateIds.last
        {
            try? RootModule.withAutoPlayTemplate(templateId: topPanelId) {
                (panel: AutoPlayTemplate) in
                reapplyPanelBarIfVisible(panel, templateId: topPanelId)
            }
            return
        }

        // With auto-hide off, a bar that was presented empty never shows up again once buttons are
        // added. Briefly enabling auto-hide before applyHideControls disables it again makes
        // CarPlay lay out the bar.
        if barButtons?.isEmpty == false {
            template.automaticallyHidesNavigationBar = true
        }

        // Restore the configured auto-hide (disabled while a panel is shown, see panelDidShow).
        applyHideControls()

        setBarButtons(template: template, barButtons: barButtons)

        if let mapButtons = mapButtons {
            template.mapButtons = Parser.parseMapButtons(
                mapButtons: mapButtons,
                onPanButtonPress: onPanButtonPress
            )
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

        super.traitCollectionDidChange()
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

        if #available(iOS 27.0, *) {
            alert.showsCloseButton = false
        }

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
        let textConfiguration = Parser.parseTripPreviewTextConfig(
            textConfig: textConfig
        )

        let tripPreviews = Parser.parseTrips(trips: trips)
        let selectedTrip = selectedTripId.flatMap { tripId in
            tripPreviews.first(where: { $0.id == tripId })
        }

        // queued so it keeps its order against hideTripSelector and the other HybridMapTemplate calls
        TemplateUpdateQueue.post {
            self.tripSelectorVisible = true
            self.onTripSelected = onTripSelected
            self.onTripStarted = onTripStarted

            self.template.backButton = CPBarButton(title: "") { _ in
                self.hideTripSelector()

                onBackPressed()
            }

            self.template.leadingNavigationBarButtons = []
            self.template.trailingNavigationBarButtons = []
            self.template.mapButtons = Parser.parseMapButtons(
                mapButtons: mapButtons,
                onPanButtonPress: self.onPanButtonPress
            )

            // A hiding bar would move the trip preview card and its start button under the user's
            // finger. hideTripSelector invalidates, which restores hideControls.
            self.template.automaticallyHidesNavigationBar = false
            self.template.hidesButtonsWithNavigationBar = false

            self.template.showTripPreviews(
                tripPreviews,
                selectedTrip: selectedTrip,
                textConfiguration: textConfiguration
            )

            tripPreviews.forEach { trip in
                guard
                    let travelEstimates = trip.routeChoices.first?
                        .travelEstimates.last
                else { return }

                self.template.updateEstimates(travelEstimates, for: trip)
            }
        }

        let callback = TripSelectorCallback { tripId in
            let selectedTrip = tripPreviews.first { trip in
                trip.id == tripId
            }
            TemplateUpdateQueue.post {
                self.template.showTripPreviews(
                    tripPreviews,
                    selectedTrip: selectedTrip,
                    textConfiguration: textConfiguration
                )
            }
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
        // CarPlay expects the session to be started for the trip it handed over, a rebuilt trip
        // with the same id is a different trip to CarPlay
        startNavigation(trip: trip, routeChoice: routeChoice, startImmediately: true)

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

        let travelEstimates = activeRouteChoice?
            .travelEstimates
        if let estimates = self.visibleTravelEstimate == .first
            ? travelEstimates?.first : travelEstimates?.last
        {
            template.updateEstimates(estimates, for: trip)
        }

    }

    func updateTravelEstimates(steps: [TripPoint]) {
        guard navigationSession != nil, let route = activeRouteChoice else {
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
            // a message maneuver has no lanes, don't leave the vehicle showing the previous maneuver's lane assist
            navigationSession.currentLaneGuidance = nil
        }

        navigationSession.upcomingManeuvers = [maneuver]
    }

    func updateManeuvers(maneuvers: [NitroRoutingManeuver]) {
        guard let navigationSession = navigationSession else { return }

        if maneuvers.isEmpty {
            if #available(iOS 17.4, *) {
                navigationSession.currentLaneGuidance = nil
            }
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

        for nitroManeuver in maneuvers {
            if let maneuver = sessionManeuvers.first(where: { $0.id == nitroManeuver.id }) {
                navigationSession.updateEstimates(
                    Parser.parseTravelEstimates(
                        travelEstimates: nitroManeuver.travelEstimates
                    ),
                    for: maneuver
                )
                upcomingManeuvers.append(maneuver)
                continue
            }

            let maneuver = Parser.parseManeuver(
                nitroManeuver: nitroManeuver,
                traitCollection: traitCollection
            )
            upcomingManeuvers.append(maneuver)
        }

        if upcomingManeuvers.map({ $0.id }) != sessionManeuvers.map({ $0.id }) {
            if #available(iOS 17.4, *) {
                upcomingManeuvers = upcomingManeuvers.flatMap { maneuver in
                    if let lanesManeuver = navigationSession.upcomingManeuvers.first(where: {
                        $0.id == maneuver.id + "-lanes"
                    }) {
                        return [maneuver, lanesManeuver]
                    }
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

                let newManeuvers = upcomingManeuvers.filter { maneuver in
                    !navigationSession.upcomingManeuvers.contains(where: {
                        $0.id == maneuver.id
                    })
                }

                // lane guidances have to be known to the session before the maneuvers linking to them are added
                let newLaneGuidances = newManeuvers.compactMap { $0.laneGuidance }
                if !newLaneGuidances.isEmpty {
                    navigationSession.add(newLaneGuidances)
                }
                navigationSession.add(newManeuvers)

                // the vehicle expects the lane guidance of the current maneuver, nil when it has none
                navigationSession.currentLaneGuidance =
                    upcomingManeuvers.first?.laneGuidance

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

    /// CarPlay confirms a session start asynchronously (about 20 ms measured on device) and raises
    /// "Attempted to start a new navigation session while one is already active" when a session is
    /// finished before that and another one is started. Sessions are therefore never finished, and
    /// no new session started after finishing one, before they are this old.
    private static let minimumSessionAge: TimeInterval = 0.3

    /// Starts are not handed to CarPlay right away but on the next main queue turn, so back to back
    /// calls (e.g. a start immediately followed by a start for another trip) only start the last trip
    /// instead of starting and immediately finishing a session. Calls touching the session in the
    /// meantime are queued, see performWithNavigationSession.
    /// - Parameters:
    ///   - routeChoice: the route choice to follow, defaults to the first one of the trip
    ///   - completion: called once the session is started, ignored or the start was cancelled
    ///   - startImmediately: start right away when no session is active, pending or just finished, so
    ///     the common trip preview start stays synchronous; otherwise it is deferred like any other start
    func startNavigation(
        trip: CPTrip,
        routeChoice: CPRouteChoice? = nil,
        completion: (() -> Void)? = nil,
        startImmediately: Bool = false
    ) {
        let routeChoice = routeChoice ?? trip.routeChoices.first

        if let travelEstimates = visibleTravelEstimate == .first
            ? routeChoice?.travelEstimates.first
            : routeChoice?.travelEstimates.last
        {
            template.updateEstimates(travelEstimates, for: trip)
        }

        if var pendingStart {
            if MapTemplate.isSameTrip(
                trip,
                routeChoice,
                as: pendingStart.trip,
                pendingStart.routeChoice
            ) {
                pendingStart.completions.append(completion ?? {})
                self.pendingStart = pendingStart
                return
            }

            // session updates queued so far belong to the replaced trip
            self.pendingStart = PendingNavigationStart(
                generation: pendingStart.generation,
                trip: trip,
                routeChoice: routeChoice,
                completions: pendingStart.completions + [completion ?? {}],
                sessionCalls: []
            )
            return
        }

        if let navigationSession,
            MapTemplate.isSameTrip(
                trip,
                routeChoice,
                as: navigationSession.trip,
                activeRouteChoice
            )
        {
            // in case startNavigation is called with the exact same ids we can ignore the call
            completion?()
            return
        }

        if startImmediately && navigationSession == nil && canStartNavigationSession() {
            beginNavigationSession(trip: trip, routeChoice: routeChoice)
            completion?()
            return
        }

        pendingStartGeneration += 1
        let generation = pendingStartGeneration
        pendingStart = PendingNavigationStart(
            generation: generation,
            trip: trip,
            routeChoice: routeChoice,
            completions: [completion ?? {}],
            sessionCalls: []
        )
        DispatchQueue.main.async { [weak self] in
            self?.runPendingStart(generation: generation)
        }
    }

    private func runPendingStart(generation: Int) {
        guard let pendingStart, pendingStart.generation == generation else { return }

        // e.g. A active, start B, start A: the pending start was replaced with the active trip again,
        // keep the running session instead of finishing and restarting it
        if let navigationSession,
            MapTemplate.isSameTrip(
                pendingStart.trip,
                pendingStart.routeChoice,
                as: navigationSession.trip,
                activeRouteChoice
            )
        {
            self.pendingStart = nil
            pendingStart.sessionCalls.forEach { $0() }
            pendingStart.completions.forEach { $0() }
            return
        }

        func retry(after delay: TimeInterval?) {
            let block: () -> Void = { [weak self] in
                self?.runPendingStart(generation: generation)
            }
            if let delay {
                DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: block)
            }
            else {
                DispatchQueue.main.async(execute: block)
            }
        }

        if navigationSession != nil {
            if let wait = remainingSessionAge(), wait > 0 {
                retry(after: wait)
                return
            }
            finishNavigationSession()
        }

        if finishingTrips > 0 {
            retry(after: nil)
            return
        }

        if let notBefore = nextSessionStartNotBefore, notBefore > Date() {
            retry(after: notBefore.timeIntervalSinceNow)
            return
        }

        self.pendingStart = nil
        beginNavigationSession(
            trip: pendingStart.trip,
            routeChoice: pendingStart.routeChoice
        )
        pendingStart.sessionCalls.forEach { $0() }
        pendingStart.completions.forEach { $0() }
    }

    private func canStartNavigationSession() -> Bool {
        if finishingTrips > 0 {
            return false
        }
        if let notBefore = nextSessionStartNotBefore, notBefore > Date() {
            return false
        }
        return true
    }

    /// time until the active session reached minimumSessionAge, nil when there is none
    private func remainingSessionAge() -> TimeInterval? {
        guard let navigationSessionStartedAt else { return nil }
        return MapTemplate.minimumSessionAge + navigationSessionStartedAt.timeIntervalSinceNow
    }

    private func beginNavigationSession(trip: CPTrip, routeChoice: CPRouteChoice?) {
        navigationSession = template.startNavigationSession(for: trip)
        navigationSessionStartedAt = Date()
        activeRouteChoice = routeChoice
        nextSessionStartNotBefore = nil
        applyOptionsPanel()
    }

    private func finishNavigationSession() {
        guard let navigationSession else { return }

        if let wait = remainingSessionAge(), wait > 0 {
            // a stop can not wait, the next session start has to instead
            nextSessionStartNotBefore = Date().addingTimeInterval(wait)
        }

        navigationSession.finishTrip()
        self.navigationSession = nil
        navigationSessionStartedAt = nil
        activeRouteChoice = nil

        finishingTrips += 1
        DispatchQueue.main.async { [weak self] in
            self?.finishingTrips -= 1
        }
    }

    private static func isSameTrip(
        _ trip: CPTrip,
        _ routeChoice: CPRouteChoice?,
        as otherTrip: CPTrip,
        _ otherRouteChoice: CPRouteChoice?
    ) -> Bool {
        return trip.id == otherTrip.id && routeChoice?.id == otherRouteChoice?.id
    }

    /// Runs a call that updates the navigation session right away, or once a pending session
    /// start ran so updates sent right after startNavigation are not dropped.
    func performWithNavigationSession(_ call: @escaping () -> Void) {
        if pendingStart != nil {
            pendingStart?.sessionCalls.append(call)
            return
        }
        call()
    }

    var isNavigationSessionActive: Bool {
        return navigationSession != nil || pendingStart != nil
    }

    func stopNavigation() {
        if let pendingStart {
            self.pendingStart = nil
            pendingStart.completions.forEach { $0() }
        }

        finishNavigationSession()
    }

    func updateOptionsPanel(config: NitroOptionsPanelConfig?) {
        optionsPanel = config
        applyOptionsPanel()
    }

    @available(iOS 27.0, *)
    private func updateOptionsPanelSection(section: NitroSection, sectionIndex: Int) {
        guard var sections = optionsPanel?.sections, sectionIndex < sections.count else { return }

        // `.first` is the `NitroSection` (list) case of `NitroOptionsPanelSection` — matches
        // whatever nitrogen assigned the last time `yarn specs` ran, see the ordering note on
        // `Parser.parseOptionsPanelSections`.
        sections[sectionIndex] = .first(section)
        optionsPanel = NitroOptionsPanelConfig(
            title: optionsPanel?.title,
            sections: sections,
            actions: optionsPanel?.actions
        )
        applyOptionsPanel()
    }

    private func applyOptionsPanel() {
        guard #available(iOS 27.0, *) else { return }
        guard let navigationSession else { return }
        guard let optionsPanel else {
            navigationSession.optionsPanel = nil
            return
        }
        guard let traitCollection = SceneStore.getRootTraitCollection() else { return }

        let sections = Parser.parseOptionsPanelSections(
            sections: optionsPanel.sections,
            updateSection: { [weak self] section, sectionIndex in
                self?.updateOptionsPanelSection(section: section, sectionIndex: sectionIndex)
            },
            traitCollection: traitCollection
        )

        let panel = CPMapPanel(
            title: Parser.parseText(text: optionsPanel.title),
            sections: sections,
            buttonConfiguration: Parser.parsePanelButtonConfiguration(
                actions: optionsPanel.actions,
                traitCollection: traitCollection
            )
        )
        panel.logItemOverflow(panelId: "optionsPanel")
        navigationSession.optionsPanel = panel
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
