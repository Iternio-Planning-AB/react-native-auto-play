//
//  Parser.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay
import CoreLocation
import ImageIO
import UIKit

struct HeaderActions {
    let leadingNavigationBarButtons: [CPBarButton]
    let trailingNavigationBarButtons: [CPBarButton]
    let backButton: CPBarButton?
}

class Parser {
    static let PLACEHOLDER_DISTANCE = "{distance}"
    static let PLACEHOLDER_DURATION = "{duration}"

    static func parseAlertActions(alertActions: [NitroAction]?)
        -> [CPAlertAction]
    {
        var actions: [CPAlertAction] = []

        if let alertActions = alertActions {
            alertActions.forEach { alertAction in
                let action = CPAlertAction(
                    title: alertAction.title!,
                    style: parseActionAlertStyle(style: alertAction.style),
                    handler: { actionHandler in
                        alertAction.onPress()
                    }
                )

                actions.append(action)
            }
        }

        return actions
    }

    static func parseHeaderActions(
        headerActions: [NitroAction]?,
        traitCollection: UITraitCollection
    )
        -> HeaderActions
    {
        var leadingNavigationBarButtons: [CPBarButton] = []
        var trailingNavigationBarButtons: [CPBarButton] = []
        var backButton: CPBarButton?

        if let headerActions = headerActions {
            headerActions.forEach { action in
                if action.type == .back {
                    backButton = CPBarButton(title: "") { _ in
                        action.onPress()
                    }
                    return
                }

                var image: UIImage?
                if let glypImage = action.image?.glyphImage {
                    image = SymbolFont.imageFromNitroImage(
                        image: glypImage,
                        // this icon is not scaled properly when used as image asset, so we use the plain image, as CP does the correct coloring anyways
                        noImageAsset: true,
                        traitCollection: traitCollection
                    )!
                }
                if let assetImage = action.image?.assetImage {
                    image = Parser.parseAssetImage(
                        assetImage: assetImage,
                        traitCollection: traitCollection
                    )
                }
                if let remoteImage = action.image?.remoteImage {
                    image = Parser.parseRemoteImage(
                        remoteImage: remoteImage,
                        traitCollection: traitCollection
                    )
                }

                var button: CPBarButton

                if let image = image {
                    button = CPBarButton(image: image) { _ in action.onPress() }
                }
                else {
                    button = CPBarButton(title: action.title ?? "") { _ in
                        action.onPress()
                    }
                }

                if action.alignment == .leading {
                    // for whatever reason CarPlay decieds to reverse the order to what we get from js side so we can not append here
                    leadingNavigationBarButtons.insert(button, at: 0)
                    return
                }

                // for whatever reason CarPlay decieds to reverse the order to what we get from js side so we can not append here
                trailingNavigationBarButtons.insert(button, at: 0)
            }
        }

        return HeaderActions(
            leadingNavigationBarButtons: leadingNavigationBarButtons,
            trailingNavigationBarButtons: trailingNavigationBarButtons,
            backButton: backButton
        )
    }

    static func parseText(text: AutoText?) -> String? {
        guard let text else { return nil }

        var result = text.text

        if let distance = text.distance {
            result = result.replacingOccurrences(
                of: Parser.PLACEHOLDER_DISTANCE,
                with: formatDistance(distance: distance)
            )
        }

        if let duration = text.duration {
            let formatter = DateComponentsFormatter()
            formatter.unitsStyle = .short
            formatter.allowedUnits = [.hour, .minute]
            formatter.zeroFormattingBehavior = .dropAll
            formatter.collapsesLargestUnit = false

            result = result.replacingOccurrences(
                of: Parser.PLACEHOLDER_DURATION,
                with: formatter.string(from: duration)?.replacingOccurrences(
                    of: ",",
                    with: ""
                ) ?? ""
            )
        }

        return result
    }

    static func parseAttributedStrings(
        attributedStrings: [NitroAttributedString],
        traitCollection: UITraitCollection
    ) -> [NSAttributedString] {
        return attributedStrings.map { variant in
            let attributedString = NSMutableAttributedString(
                string: variant.text
            )
            if let nitroImages = variant.images {
                nitroImages.forEach { image in
                    let attachment = NSTextAttachment(
                        image: Parser.parseNitroImage(
                            image: image.image,
                            traitCollection: traitCollection
                        )!
                    )
                    let container = NSAttributedString(
                        attachment: attachment
                    )
                    attributedString.insert(
                        container,
                        at: Int(image.position)
                    )
                }
            }
            return attributedString
        }
    }

    static func formatDistance(distance: Distance) -> String {
        let formatter = MeasurementFormatter()
        formatter.unitOptions = .providedUnit
        formatter.unitStyle = .medium
        formatter.numberFormatter.minimumFractionDigits = 0
        formatter.numberFormatter.roundingMode = .halfUp

        switch distance.unit {
        case .meters:
            formatter.numberFormatter.maximumFractionDigits = 0
        case .miles:
            formatter.numberFormatter.maximumFractionDigits = 1
        case .yards:
            formatter.numberFormatter.maximumFractionDigits = 0
        case .feet:
            formatter.numberFormatter.maximumFractionDigits = 0
        case .kilometers:
            formatter.numberFormatter.maximumFractionDigits = 1
        }

        let measurement = parseDistance(distance: distance)

        return formatter.string(from: measurement)
    }

    static func parseDistance(distance: Distance) -> Measurement<UnitLength> {
        var unit: UnitLength

        switch distance.unit {
        case .meters:
            unit = UnitLength.meters
        case .miles:
            unit = UnitLength.miles
        case .yards:
            unit = UnitLength.yards
        case .feet:
            unit = UnitLength.feet
        case .kilometers:
            unit = UnitLength.kilometers
        }

        return Measurement(value: distance.value, unit: unit)
    }

    static func parseInformationActions(actions: [NitroAction]?)
        -> [CPTextButton]
    {
        guard let actions else { return [] }

        return actions.map { action in
            let button = CPTextButton(
                title: action.title!,
                textStyle: parseTextButtonStyle(style: action.style),
                handler: { void in
                    action.onPress()
                }
            )

            return button
        }
    }

    static func parseInformationItems(section: NitroSection)
        -> [CPInformationItem]
    {
        return section.items.map { item in
            return CPInformationItem(
                title: parseText(text: item.title),
                detail: parseText(text: item.detailedText)
            )
        }
    }

    /// Read-only equivalent of `parseInformationItems` for the map-panel case, since `CPMapPanelItem` only wraps a `CPListItem`, not a `CPInformationItem`.
    @available(iOS 27.0, *)
    static func parseInformationPanelItems(section: NitroSection) -> [CPMapPanelItem] {
        return section.items.map { item in
            CPMapPanelItem(
                listItem: CPListItem(
                    text: parseText(text: item.title),
                    detailText: parseText(text: item.detailedText)
                )
            )
        }
    }

    /// `actions[0]` becomes the primary text button; `actions[1]`, if present, becomes the icon-only symbol button — `CPMapPanelButtonConfiguration` supports nothing beyond that.
    @available(iOS 27.0, *)
    static func parsePanelButtonConfiguration(
        actions: [NitroAction]?,
        traitCollection: UITraitCollection
    ) -> CPMapPanelButtonConfiguration? {
        guard let actions, let primaryAction = actions.first else { return nil }

        let primaryButton = CPTextButton(
            title: primaryAction.title ?? "",
            textStyle: parseTextButtonStyle(style: primaryAction.style),
            handler: { _ in
                primaryAction.onPress()
            }
        )

        var symbolButton: CPButton?
        if actions.count > 1,
            let image = parseNitroImage(image: actions[1].image, traitCollection: traitCollection)
        {
            let secondaryAction = actions[1]
            symbolButton = CPButton(
                image: image,
                handler: { _ in
                    secondaryAction.onPress()
                }
            )
        }

        /// iOS 27 beta 3 & 4  do not accept nil for the optional travelEstimates any longer while the function comment still claims it is optional
        /// Initializes a map panel button configuration with a primary action, optional travel estimates, and an optional secondary button.
        ///
        /// set it and call setValue to nil it again oO
        /// TODO: recheck on RC/final release
        let buttonConfiguration = CPMapPanelButtonConfiguration(
            primaryAction: primaryButton,
            secondaryButton: symbolButton,
            travelEstimates: CPTravelEstimates(
                distanceRemaining: Measurement(value: 0, unit: .astronomicalUnits),
                timeRemaining: 0
            )
        )

        buttonConfiguration.setValue(nil, forKey: "travelEstimates")

        return buttonConfiguration
    }

    static func parseSearchResults(
        section: NitroSection?,
        traitCollection: UITraitCollection
    ) -> [CPListItem] {
        guard let section else { return [] }

        return section.items.enumerated().map { (itemIndex, item) in
            let listItem = CPListItem(
                text: parseText(text: item.title),
                detailText: parseText(text: item.detailedText),
                image: Parser.parseNitroImage(
                    image: item.image,
                    traitCollection: traitCollection
                ),
                accessoryImage: nil,
                accessoryType: item.browsable == true
                    ? .disclosureIndicator : .none
            )

            listItem.handler = { listItem, completionHandler in
                item.onPress?(nil)
                completionHandler()
            }

            return listItem
        }
    }

    static func parseListItems(
        section: NitroSection,
        sectionIndex: Int,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> [CPListItem] {
        let selectedIndex = section.items.firstIndex { item in
            item.selected == true
        }

        return section.items.enumerated().map { (itemIndex, item) in
            parseListItem(
                item: item,
                itemIndex: itemIndex,
                selectedIndex: selectedIndex,
                section: section,
                sectionIndex: sectionIndex,
                updateSection: updateSection,
                traitCollection: traitCollection
            )
        }
    }

    private static func parseListItem(
        item: NitroRow,
        itemIndex: Int,
        selectedIndex: Int?,
        section: NitroSection,
        sectionIndex: Int,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> CPListItem {
        let isSelected =
            section.type == .radio
            && Int(selectedIndex ?? -1) == itemIndex

        let toggleImage = item.checked.map { checked in
            UIImage.makeToggleImage(
                enabled: checked,
                maximumImageSize: CPListItem.maximumImageSize
            )
        }

        // A waypoint row has no `detailedText` of its own — `address` doubles as the detail
        // line whenever it falls back to a plain `CPListItem` (non-panel context, Android).
        let listItem = CPListItem(
            text: parseText(text: item.title),
            detailText: item.address ?? parseText(text: item.detailedText),
            image: Parser.parseNitroImage(
                image: item.image,
                traitCollection: traitCollection
            ),
            accessoryImage: isSelected
                ? UIImage.checkmark : toggleImage,
            accessoryType: item.browsable == true
                ? .disclosureIndicator : .none
        )

        listItem.isEnabled = item.enabled

        listItem.handler = { _item, completion in
            let updatedItems = section.items.enumerated().map { (rowIndex, row) in
                let checked: Bool? =
                    if rowIndex == itemIndex, let checked = row.checked {
                        !checked
                    }
                    else { row.checked }

                let selected: Bool? =
                    if section.type == .radio {
                        rowIndex == itemIndex
                    }
                    else {
                        nil
                    }

                return NitroRow(
                    title: row.title,
                    detailedText: row.detailedText,
                    browsable: row.browsable,
                    enabled: row.enabled,
                    image: row.image,
                    checked: checked,
                    onPress: row.onPress,
                    selected: selected,
                    coordinate: row.coordinate,
                    distanceMeters: row.distanceMeters,
                    durationSeconds: row.durationSeconds,
                    address: row.address
                )
            }

            let updatedSection = NitroSection(title: section.title, items: updatedItems, type: section.type)

            updateSection(updatedSection, sectionIndex)

            item.onPress?(item.checked.map { checked in !checked })
            completion()
        }

        return listItem
    }

    static func parseSections(
        sections: [NitroSection]?,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> [CPListSection] {
        guard let sections else { return [] }

        return sections.enumerated().map { (sectionIndex, section) in
            let items = parseListItems(
                section: section,
                sectionIndex: sectionIndex,
                updateSection: updateSection,
                traitCollection: traitCollection
            )

            return CPListSection(
                items: items,
                header: section.title,
                sectionIndexTitle: nil
            )
        }
    }

    /// Builds the `CPMapPanelItem`s for a list-type section in panel context. Mirrors `parseListItems`, except a row carrying
    /// waypoint data (`coordinate`) becomes a `CPMapTemplateWaypoint`-backed item instead of a `CPListItem`-backed one — used
    /// both by `ListTemplate` panels and the options panel's list sections.
    @available(iOS 27.0, *)
    static func parsePanelItems(
        section: NitroSection,
        sectionIndex: Int,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> [CPMapPanelItem] {
        let selectedIndex = section.items.firstIndex { item in
            item.selected == true
        }

        return section.items.enumerated().map { (itemIndex, item) in
            if let coordinate = item.coordinate {
                let image = parseWaypointImage(item.image, traitCollection: traitCollection)
                let onPress = item.onPress
                return parseWaypointPanelItem(
                    name: parseText(text: item.title),
                    address: item.address,
                    coordinate: coordinate,
                    distanceMeters: item.distanceMeters ?? 0,
                    durationSeconds: item.durationSeconds ?? 0,
                    image: image,
                    onPress: { onPress?(nil) }
                )
            }

            let listItem = parseListItem(
                item: item,
                itemIndex: itemIndex,
                selectedIndex: selectedIndex,
                section: section,
                sectionIndex: sectionIndex,
                updateSection: updateSection,
                traitCollection: traitCollection
            )

            return CPMapPanelItem(listItem: listItem)
        }
    }

    @available(iOS 27.0, *)
    static func parseMapPanelSections(
        sections: [NitroSection]?,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> [CPMapPanelSection] {
        guard let sections else { return [] }

        return sections.enumerated().map { (sectionIndex, section) in
            let items = parsePanelItems(
                section: section,
                sectionIndex: sectionIndex,
                updateSection: updateSection,
                traitCollection: traitCollection
            )

            return CPMapPanelSection(
                title: section.title,
                items: items
            )
        }
    }

    /// Builds sections for `CPNavigationSession.optionsPanel`. Each section is independently a full list (via `parsePanelItems`,
    /// radio included — a list row carrying waypoint data becomes a `CPMapTemplateWaypoint` item), a full grid, or a charging
    /// station's outlets — `sectionIndex` addresses this array; only list sections call `updateSection`.
    ///
    /// The case order below (`.first` = list, `.second` = grid, `.third` = charger) matches whatever nitrogen assigned the last
    /// time `yarn specs` ran, not necessarily the declaration order of `NitroOptionsPanelSection` in TS — check
    /// `NitroOptionsPanelSection.swift` after regenerating.
    @available(iOS 27.0, *)
    static func parseOptionsPanelSections(
        sections: [NitroOptionsPanelSection]?,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> [CPMapPanelSection] {
        guard let sections else { return [] }

        return sections.enumerated().map { (sectionIndex, section) in
            switch section {
            case .first(let listSection):
                let items = parsePanelItems(
                    section: listSection,
                    sectionIndex: sectionIndex,
                    updateSection: updateSection,
                    traitCollection: traitCollection
                )

                return CPMapPanelSection(
                    title: listSection.title,
                    items: items
                )

            case .second(let gridSection):
                let buttons = parseGridButtons(
                    buttons: gridSection.buttons,
                    traitCollection: traitCollection
                )

                return CPMapPanelSection(
                    title: gridSection.title,
                    items: [CPMapPanelItem(gridButtons: buttons)]
                )

            case .third(let chargerSection):
                var items = chargerSection.outlets.map { outlet -> CPMapPanelItem in
                    let connection = CPChargingStationConnection(
                        connector: parseChargingConnector(outlet.connector),
                        voltage: Measurement(value: outlet.voltage, unit: .volts),
                        power: parsePower(kilowatts: outlet.powerKw)
                    )

                    let onPress = outlet.onPress
                    return CPMapPanelItem(chargingStationConnection: connection) { _, completion in
                        onPress?()
                        completion()
                    }
                }

                if let location = chargerSection.location {
                    let onPress = location.onPress
                    let image = parseWaypointImage(location.image, traitCollection: traitCollection)
                    items.insert(
                        parseWaypointPanelItem(
                            name: location.name,
                            address: location.address,
                            coordinate: location.coordinate,
                            distanceMeters: location.distanceMeters,
                            durationSeconds: location.durationSeconds,
                            image: image,
                            onPress: { onPress?() }
                        ),
                        at: 0
                    )
                }

                return CPMapPanelSection(
                    title: chargerSection.title,
                    items: items
                )
            }
        }
    }

    /// Shared image handling for a waypoint panel item (`WaypointRow`, `ChargerLocation`) — a glyph image is rendered
    /// directly at `CPNavigationAlert.maximumAvatarImageSize`, since `CPMapPanelItem`'s waypoint image has no documented
    /// size of its own; anything else falls back to the regular image conversion.
    @available(iOS 27.0, *)
    private static func parseWaypointImage(
        _ image: ImageProtocol?,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        if let glyphImage = image?.glyphImage {
            return SymbolFont.imageFromNitroImage(
                image: glyphImage,
                // iOS 27 beta 4 makes the image overflow
                // adjusting it with displayScale gives it the proper size but causes some blur
                // TODO: check again on next release
                size: CPNavigationAlert.maximumAvatarImageSize.width / traitCollection.displayScale,
                traitCollection: traitCollection
            )
        }

        return parseNitroImage(image: image, traitCollection: traitCollection)
    }

    /// Builds a `CPMapPanelItem` wrapping a `CPMapTemplateWaypoint` — used both for a list row carrying waypoint data
    /// (`WaypointRow`) and for a charging station's own location (`ChargerLocation`).
    @available(iOS 27.0, *)
    private static func parseWaypointPanelItem(
        name: String?,
        address: String?,
        coordinate: WaypointCoordinate,
        distanceMeters: Double,
        durationSeconds: Double,
        image: UIImage?,
        onPress: @escaping () -> Void
    ) -> CPMapPanelItem {
        let nameVariants = name.map { [$0] } ?? []

        let navigationWaypoint = CPNavigationWaypoint(
            centerPoint: CPLocationCoordinate3D(
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                altitude: coordinate.altitude ?? CLLocationDistanceMax
            ),
            locationThreshold: nil,
            nameVariants: nameVariants,
            addressVariants: address.map { [$0] } ?? [],
            entryPoints: [],
            timeZone: nil
        )

        let travelEstimates = CPTravelEstimates(
            distanceRemaining: Measurement(value: distanceMeters, unit: .meters),
            timeRemaining: durationSeconds
        )

        let mapTemplateWaypoint = CPMapTemplateWaypoint(
            waypoint: navigationWaypoint,
            travelEstimates: travelEstimates
        )

        return CPMapPanelItem(mapTemplateWaypoint: mapTemplateWaypoint, image: image) { _, completion in
            onPress()
            completion()
        }
    }

    @available(iOS 27.0, *)
    private static func parseChargingConnector(
        _ connector: ChargingConnector
    ) -> CPChargingStationConnection.Connector {
        switch connector {
        case .ccs1: return .ccs1
        case .ccs2: return .ccs2
        case .j1772: return .j1772
        case .chademo: return .chaDeMo
        case .mennekes: return .mennekes
        case .gbtdc: return .gbtDC
        case .gbtac: return .gbtAC
        case .nacsdc: return .nacsDC
        case .nacsac: return .nacsAC
        default: return .ccs2
        }
    }

    /// values above 1000 kW are shown in megawatts instead, since nobody wants to read "1500 kW" on a charger card.
    private static func parsePower(kilowatts: Double) -> Measurement<UnitPower> {
        let measurement = Measurement(value: kilowatts, unit: UnitPower.kilowatts)
        return kilowatts > 1000 ? measurement.converted(to: .megawatts) : measurement
    }

    /// `onPanButtonPress` is called instead of `button.onPress` for `.pan`-typed buttons, since panning belongs to the `CPMapTemplate`, not the button.
    static func parseMapButtons(
        mapButtons: [NitroMapButton],
        onPanButtonPress: @escaping () -> Void
    ) -> [CPMapButton] {
        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return []
        }

        return mapButtons.map { button in
            if let glyphImage = button.image.glyphImage,
                let icon = SymbolFont.imageFromNitroImage(
                    image: glyphImage,
                    size: CPButtonMaximumImageSize.height,
                    noImageAsset: true,
                    traitCollection: traitCollection
                )
            {
                return CPMapButton(image: icon) { _ in
                    if button.type == .pan {
                        onPanButtonPress()
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
                        onPanButtonPress()
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
                        onPanButtonPress()
                        return
                    }
                    button.onPress?()
                }
            }

            return CPMapButton { _ in
                if button.type == .pan {
                    onPanButtonPress()
                    return
                }
                button.onPress?()
            }
        }
    }

    static func parseGridButtons(
        buttons: [NitroGridButton],
        traitCollection: UITraitCollection
    ) -> [CPGridButton] {
        let gridButtonHeight: CGFloat

        if #available(iOS 26.0, *) {
            gridButtonHeight = CPGridTemplate.maximumGridButtonImageSize.height
        }
        else {
            gridButtonHeight = 44
        }

        return buttons.compactMap { button in
            var image: UIImage?

            if let glyphImage = button.image.glyphImage {
                image = SymbolFont.imageFromNitroImage(
                    image: glyphImage,
                    size: gridButtonHeight,
                    traitCollection: traitCollection
                )
            }

            if let assetImage = button.image.assetImage {
                image = Parser.parseAssetImage(
                    assetImage: assetImage,
                    traitCollection: traitCollection
                )
            }

            if let remoteImage = button.image.remoteImage {
                image = Parser.parseRemoteImage(
                    remoteImage: remoteImage,
                    traitCollection: traitCollection
                )
            }

            guard let image = image else { return nil }
            guard let title = Parser.parseText(text: button.title) else { return nil }

            return CPGridButton(
                titleVariants: [title],
                image: image
            ) { _ in
                button.onPress()
            }
        }
    }

    static func parseTextButtonStyle(style: NitroButtonStyle?)
        -> CPTextButtonStyle
    {
        guard let style else { return .normal }
        switch style {
        case .cancel:
            return .cancel
        case .normal:
            return .normal
        case .confirm:
            return .confirm
        default:
            return .normal
        }
    }

    static func parseActionAlertStyle(style: NitroButtonStyle?)
        -> CPAlertAction.Style
    {
        guard let style else { return .default }
        switch style {
        case .default:
            return CPAlertAction.Style.default
        case .destructive:
            return CPAlertAction.Style.destructive
        case .cancel:
            return CPAlertAction.Style.cancel
        default:
            return .default
        }
    }

    static func parseActionAlertStyle(style: AlertActionStyle?)
        -> CPAlertAction.Style
    {
        guard let style else { return .default }
        switch style {
        case .default:
            return CPAlertAction.Style.default
        case .destructive:
            return CPAlertAction.Style.destructive
        case .cancel:
            return CPAlertAction.Style.cancel
        default:
            return .default
        }
    }

    static func parseTripPreviewTextConfig(
        textConfig: TripPreviewTextConfiguration
    ) -> CPTripPreviewTextConfiguration {
        return CPTripPreviewTextConfiguration(
            startButtonTitle: textConfig.startButtonTitle,
            additionalRoutesButtonTitle: textConfig.additionalRoutesButtonTitle,
            overviewButtonTitle: textConfig.overviewButtonTitle
        )
    }

    static func parseTripPoint(point: TripPoint) -> MKMapItem {
        let coordinate = CLLocationCoordinate2D(
            latitude: point.latitude,
            longitude: point.longitude
        )
        let placemark = MKPlacemark(coordinate: coordinate)

        let item = MKMapItem(placemark: placemark)
        item.name = point.name
        return item
    }

    static func parseRouteChoice(routeChoice: RouteChoice) -> CPRouteChoice {
        let travelEstimate = parseText(
            text: AutoText(
                text:
                    "\(Parser.PLACEHOLDER_DURATION) (\(Parser.PLACEHOLDER_DISTANCE))",
                distance: routeChoice.steps.last!.travelEstimates
                    .distanceRemaining,
                duration: routeChoice.steps.last!.travelEstimates.timeRemaining
                    .seconds
            )
        )!

        let selectionSummaryVariants =
            routeChoice.selectionSummaryVariants.map { text in
                text + "\n " + travelEstimate
            }

        let additionalInformationVariants = routeChoice
            .additionalInformationVariants.flatMap { summary in
                routeChoice.selectionSummaryVariants.map { selection in
                    summary + "\n" + selection
                }
            }

        let route = CPRouteChoice(
            summaryVariants: routeChoice.summaryVariants,
            additionalInformationVariants: additionalInformationVariants,
            selectionSummaryVariants: selectionSummaryVariants,
            id: routeChoice.id,
            // we don't want to keep the origin travel estimate
            travelEstimates: routeChoice.steps[1...].map { step in
                parseTravelEstimates(travelEstimates: step.travelEstimates)
            }
        )

        return route
    }

    static func parseTrip(tripConfig: TripConfig) -> CPTrip {
        let routeChoices = parseRouteChoice(routeChoice: tripConfig.routeChoice)
        let trip = CPTrip(
            origin: parseTripPoint(
                point: tripConfig.routeChoice.steps.first!
            ),
            destination: parseTripPoint(
                point: tripConfig.routeChoice.steps.last!
            ),
            routeChoices: [routeChoices],
            id: tripConfig.id
        )

        return trip
    }

    static func parseTrips(trips: [TripsConfig]) -> [CPTrip] {
        return trips.map { tripConfig in
            CPTrip(
                origin: parseTripPoint(
                    point: tripConfig.routeChoices.first!.steps.first!
                ),
                destination: parseTripPoint(
                    point: tripConfig.routeChoices.first!.steps.last!
                ),
                routeChoices: tripConfig.routeChoices.map { routeChoice in
                    Parser.parseRouteChoice(routeChoice: routeChoice)
                },
                id: tripConfig.id
            )
        }
    }

    static func parseTravelEstimates(travelEstimates: TravelEstimates)
        -> CPTravelEstimates
    {
        return CPTravelEstimates(
            distanceRemaining: parseDistance(
                distance: travelEstimates.distanceRemaining
            ),
            timeRemaining: travelEstimates.timeRemaining.seconds
        )
    }

    /// Card background `UIColor` for routing maneuvers and loading pause — same light/dark component pick as `parseManeuver`.
    static func routingManeuverCardBackgroundUIColor(
        color: NitroColor,
        traitCollection: UITraitCollection
    ) -> UIColor {
        if #available(iOS 15.4, *) {
            let component =
                traitCollection.userInterfaceStyle == .dark
                ? color.darkColor
                : color.lightColor
            return doubleToColor(value: component)
        }
        return parseColor(color: color)
    }

    static func parseManeuver(
        nitroManeuver: NitroRoutingManeuver,
        traitCollection: UITraitCollection
    ) -> CPManeuver {
        let maneuver = CPManeuver(id: nitroManeuver.id)

        maneuver.attributedInstructionVariants = parseAttributedStrings(
            attributedStrings: nitroManeuver
                .attributedInstructionVariants,
            traitCollection: traitCollection
        )

        maneuver.initialTravelEstimates = Parser.parseTravelEstimates(
            travelEstimates: nitroManeuver.travelEstimates
        )
        maneuver.symbolImage = Parser.parseNitroImage(
            image: nitroManeuver.symbolImage,
            traitCollection: traitCollection
        )
        maneuver.junctionImage = Parser.parseNitroImage(
            image: nitroManeuver.junctionImage,
            traitCollection: traitCollection
        )

        if #available(iOS 15.4, *) {
            maneuver.cardBackgroundColor = routingManeuverCardBackgroundUIColor(
                color: nitroManeuver.cardBackgroundColor,
                traitCollection: traitCollection
            )
        }

        if #available(iOS 17.4, *) {
            maneuver.maneuverType = getManeuverType(maneuver: nitroManeuver)
            maneuver.trafficSide = CPTrafficSide(
                rawValue: UInt(nitroManeuver.trafficSide.rawValue)
            )!
            maneuver.roadFollowingManeuverVariants =
                nitroManeuver.roadName

            if nitroManeuver.maneuverType == .roundabout {
                maneuver.junctionType = .roundabout
            }

            if nitroManeuver.maneuverType == .turn {
                maneuver.junctionType = .intersection
            }

            if let junctionExitAngle = nitroManeuver.angle {
                maneuver.junctionExitAngle = doubleToAngle(
                    value: junctionExitAngle
                )
            }

            if let junctionElementAngles = nitroManeuver
                .elementAngles
            {
                maneuver.junctionElementAngles = Set(
                    doubleToAngle(values: junctionElementAngles)
                )
            }

            if let highwayExitLabel = nitroManeuver.highwayExitLabel {
                maneuver.highwayExitLabel = highwayExitLabel
            }

            if let linkedLaneGuidance = nitroManeuver.linkedLaneGuidance {
                let laneGuidance = parseLaneGuidance(
                    laneGuidance: linkedLaneGuidance
                )
                maneuver.linkedLaneGuidance = laneGuidance
                // iOS does not store the actual CPLaneGuidance type but some NSConcreteMutableAttributedString so we store it in userInfo so we can access it later on
                maneuver.laneGuidance = laneGuidance

                let laneImages = linkedLaneGuidance.lanes.compactMap { lane in
                    switch lane {
                    case .first(let nitroLaneGuidance):
                        return nitroLaneGuidance.image
                    case .second(let nitroLaneGuidance):
                        return nitroLaneGuidance.image
                    }
                }

                maneuver.laneImages = laneImages
            }
        }

        return maneuver
    }

    @available(iOS 17.4, *)
    static func getManeuverType(maneuver: NitroRoutingManeuver)
        -> CPManeuverType
    {
        switch maneuver.maneuverType {
        case .depart:
            return .startRoute
        case .arrive:
            return .arriveAtDestination
        case .arriveleft:
            return .arriveAtDestinationLeft
        case .arriveright:
            return .arriveAtDestinationRight
        case .straight:
            return .straightAhead
        case .turn:
            switch maneuver.turnType {
            case .normalleft:
                return .leftTurn
            case .normalright:
                return .rightTurn
            case .sharpleft:
                return .sharpLeftTurn
            case .sharpright:
                return .sharpRightTurn
            case .slightleft:
                return .slightLeftTurn
            case .slightright:
                return .slightRightTurn
            case .uturnright, .uturnleft:
                return .uTurn
            default:
                return .noTurn
            }
        case .roundabout:
            if let exitNumber = maneuver.exitNumber {
                if exitNumber < 1 || exitNumber > 19 {
                    return .exitRoundabout
                }
                let maneuverType =
                    CPManeuverType.roundaboutExit1.rawValue
                    + (UInt(exitNumber) - 1)
                return CPManeuverType(rawValue: maneuverType) ?? .exitRoundabout
            }
            return .exitRoundabout
        case .offramp:
            switch maneuver.offRampType {
            case .slightleft, .normalleft:
                return .highwayOffRampLeft
            case .slightright, .normalright:
                return .highwayOffRampRight
            default:
                return .offRamp
            }
        case .onramp:
            return .onRamp
        case .fork:
            switch maneuver.forkType {
            case .left:
                return .slightLeftTurn
            case .right:
                return .slightRightTurn
            default:
                return .noTurn
            }
        case .enterferry:
            return .enter_Ferry
        case .keep:
            switch maneuver.keepType {
            case .left:
                return .keepLeft
            case .right:
                return .keepRight
            default:
                return .followRoad
            }
        }
    }

    @available(iOS 17.4, *)
    static func parseLaneGuidance(laneGuidance: LaneGuidance)
        -> CPLaneGuidance
    {
        let instructionVariants = laneGuidance.instructionVariants

        let lanes = laneGuidance.lanes.map { lane in
            var angles: [Measurement<UnitAngle>] = []
            var highlightedAngle: Measurement<UnitAngle>?
            var isPreferred = false

            switch lane {
            case .first(let nitroLaneGuidance):
                angles = doubleToAngle(values: nitroLaneGuidance.angles)
                highlightedAngle = doubleToAngle(
                    value: nitroLaneGuidance.highlightedAngle
                )
                isPreferred = nitroLaneGuidance.isPreferred
            case .second(let nitroLaneGuidance):
                angles = doubleToAngle(values: nitroLaneGuidance.angles)
            }

            return CPLane(
                angles: angles,
                highlightedAngle: highlightedAngle,
                isPreferred: isPreferred
            )
        }

        return CPLaneGuidance(
            instructionVariants: instructionVariants,
            lanes: lanes
        )
    }

    static func parseColor(color: NitroColor) -> UIColor {
        let darkColor = doubleToColor(value: color.darkColor)
        let lightColor = doubleToColor(value: color.lightColor)

        return UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return darkColor
            case .light:
                return lightColor
            case .unspecified:
                return darkColor
            @unknown default:
                return darkColor
            }
        }
    }

    static func doubleToAngle(values: [Double]) -> [Measurement<UnitAngle>] {
        return values.map {
            doubleToAngle(value: $0)
        }
    }

    static func doubleToAngle(value: Double) -> Measurement<UnitAngle> {
        return Measurement(value: value, unit: UnitAngle.degrees)
    }

    static func doubleToColor(value: Double) -> UIColor {
        return NitroConvert.uiColor(value)
    }

    static func parseNitroImage(
        image: ImageProtocol?,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        if let glyphImage = image?.glyphImage {
            return SymbolFont.imageFromNitroImage(
                image: glyphImage,
                traitCollection: traitCollection
            )!
        }

        if let assetImage = image?.assetImage {
            return Parser.parseAssetImage(
                assetImage: assetImage,
                traitCollection: traitCollection
            )
        }

        if let remoteImage = image?.remoteImage {
            return Parser.parseRemoteImage(
                remoteImage: remoteImage,
                traitCollection: traitCollection
            )
        }

        return nil
    }

    // MARK: - Remote image cache
    private static let remoteImageCache: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.countLimit = 50
        cache.totalCostLimit = 8 * 1024 * 1024  // 8 MB, matching Android's BitmapCache
        return cache
    }()

    /// Shared session — long-lived by design; failed tasks don't invalidate it.
    private static let remoteImageSession = URLSession(configuration: .default)

    /// Default network timeout for remote images when no `timeoutMs` is provided.
    private static let defaultRemoteTimeoutSeconds: TimeInterval = 0.5

    static func parseAssetImage(
        assetImage: AssetImage,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        let uiImage = NitroConvert.uiImage([
            "height": assetImage.height, "width": assetImage.width,
            "uri": assetImage.uri, "scale": assetImage.scale,
            "__packager_asset": assetImage.packager_asset,
        ])

        return applyTint(
            uiImage: uiImage,
            color: assetImage.color,
            traitCollection: traitCollection
        )
    }

    static func parseRemoteImage(
        remoteImage: RemoteImage,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        let timeoutSeconds = remoteImage.timeoutMs.map { $0 / 1000.0 } ?? defaultRemoteTimeoutSeconds
        let uiImage = loadRemoteImage(uri: remoteImage.uri, timeoutSeconds: timeoutSeconds)

        return applyTint(
            uiImage: uiImage,
            color: remoteImage.color,
            traitCollection: traitCollection
        )
    }

    private static func applyTint(
        uiImage: UIImage?,
        color: NitroColor?,
        traitCollection: UITraitCollection
    ) -> UIImage? {
        guard let image = uiImage else { return nil }
        guard let color else { return image }

        return getTintedImageAsset(
            color: color,
            uiImage: image,
            traitCollection: traitCollection
        )
    }

    /// Synchronously loads an image from a remote HTTPS URL with in-memory caching.
    /// `parseRemoteImage` is always invoked on a background thread by the Car App rendering pipeline,
    /// so the semaphore wait cannot block the main thread.
    private static func loadRemoteImage(uri: String, timeoutSeconds: TimeInterval) -> UIImage? {
        let cacheKey = uri as NSString
        if let cached = remoteImageCache.object(forKey: cacheKey) {
            return cached
        }

        guard let url = URL(string: uri) else { return nil }

        var request = URLRequest(url: url)
        request.timeoutInterval = timeoutSeconds

        var resultData: Data?
        let semaphore = DispatchSemaphore(value: 0)
        let task = remoteImageSession.dataTask(with: request) { data, _, _ in
            resultData = data
            semaphore.signal()
        }
        task.resume()
        if semaphore.wait(timeout: .now() + timeoutSeconds) == .timedOut {
            task.cancel()
            return UIImage(systemName: "exclamationmark.circle")
        }

        guard let data = resultData, let image = UIImage(data: data) else {
            return UIImage(systemName: "exclamationmark.circle")
        }

        let cost = Int(image.size.width * image.size.height * image.scale * image.scale * 4)
        remoteImageCache.setObject(image, forKey: cacheKey, cost: cost)
        return image
    }

    static func getTintedImageAsset(
        color: NitroColor,
        uiImage: UIImage,
        traitCollection: UITraitCollection
    ) -> UIImage {
        let imageAsset = UIImageAsset()

        let lightTraits = UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .light)
        ])
        imageAsset.register(
            getTintedImage(color: color.lightColor, uiImage: uiImage),
            with: lightTraits
        )

        let darkTraits = UITraitCollection(traitsFrom: [
            UITraitCollection(userInterfaceStyle: .dark)
        ])
        imageAsset.register(
            getTintedImage(color: color.darkColor, uiImage: uiImage),
            with: darkTraits
        )

        return imageAsset.image(with: traitCollection)
    }

    static func getTintedImage(color: Double, uiImage: UIImage) -> UIImage {
        guard let cgImage = uiImage.cgImage else { return uiImage }

        let rect = CGRect(origin: .zero, size: uiImage.size)
        let colorSpace = CGColorSpaceCreateDeviceRGB()

        guard
            let context = CGContext(
                data: nil,
                width: Int(uiImage.size.width),
                height: Int(uiImage.size.height),
                bitsPerComponent: 8,
                bytesPerRow: 0,
                space: colorSpace,
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
            )
        else { return uiImage }

        context.clip(to: rect, mask: cgImage)
        context.setFillColor(doubleToColor(value: color).cgColor)
        context.fill(rect)

        guard let tintedCGImage = context.makeImage() else { return uiImage }

        return UIImage(
            cgImage: tintedCGImage,
            scale: uiImage.scale,
            orientation: uiImage.imageOrientation
        )
    }

    // MARK: - Animated image decoding

    /// Decodes raw image data via ImageIO, walking every frame so animated GIF/APNG/WebP all
    /// animate. UIImage(data:) only ever decodes the first frame for any of these formats.
    /// `maxDuration` caps the assembled cycle length; pass `.greatestFiniteMagnitude` to skip capping.
    static func decodeImage(data: Data, scale: CGFloat, maxDuration: TimeInterval = .greatestFiniteMagnitude)
        -> UIImage?
    {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        let frameCount = CGImageSourceGetCount(source)
        guard frameCount > 0 else { return nil }

        guard frameCount > 1 else {
            guard let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else { return nil }
            return UIImage(cgImage: cgImage, scale: scale, orientation: .up)
        }

        var frames: [UIImage] = []
        var totalDuration: TimeInterval = 0
        for index in 0..<frameCount {
            guard let cgImage = CGImageSourceCreateImageAtIndex(source, index, nil) else { continue }
            totalDuration += frameDuration(source: source, index: index)
            frames.append(UIImage(cgImage: cgImage, scale: scale, orientation: .up))
        }
        guard !frames.isEmpty else { return nil }
        return UIImage.animatedImage(with: frames, duration: min(totalDuration, maxDuration))
    }

    /// Reads the per-frame delay from whichever format dictionary ImageIO populated
    /// (GIF, APNG, or WebP), falling back to a sane default if none is present.
    private static func frameDuration(source: CGImageSource, index: Int) -> TimeInterval {
        let defaultDuration: TimeInterval = 0.1
        guard
            let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any]
        else { return defaultDuration }

        if let gif = properties[kCGImagePropertyGIFDictionary] as? [CFString: Any] {
            if let unclamped = gif[kCGImagePropertyGIFUnclampedDelayTime] as? Double, unclamped > 0 {
                return unclamped
            }
            if let delay = gif[kCGImagePropertyGIFDelayTime] as? Double, delay > 0 {
                return delay
            }
        }

        if let png = properties[kCGImagePropertyPNGDictionary] as? [CFString: Any] {
            if let unclamped = png[kCGImagePropertyAPNGUnclampedDelayTime] as? Double, unclamped > 0 {
                return unclamped
            }
            if let delay = png[kCGImagePropertyAPNGDelayTime] as? Double, delay > 0 {
                return delay
            }
        }

        if let webp = properties[kCGImagePropertyWebPDictionary] as? [CFString: Any],
            let delay = webp[kCGImagePropertyWebPDelayTime] as? Double, delay > 0
        {
            return delay
        }

        return defaultDuration
    }

    private static func targetSize(for size: CGSize, max maxSize: CGSize) -> CGSize {
        guard size.width > maxSize.width || size.height > maxSize.height else { return size }
        let scale = min(maxSize.width / size.width, maxSize.height / size.height)
        return CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())
    }

    static func resize(_ image: UIImage, max maxSize: CGSize) -> UIImage {
        let target = targetSize(for: image.size, max: maxSize)
        guard target != image.size else { return image }
        return UIGraphicsImageRenderer(size: target).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
    }

    /// Resizes every frame of an animated UIImage while preserving the per-frame timing.
    /// UIImage.draw(in:) only renders the current frame, so resize() alone would collapse
    /// the animation to a still image.
    static func resizeAnimated(_ image: UIImage, max maxSize: CGSize) -> UIImage {
        guard let frames = image.images, !frames.isEmpty else {
            return resize(image, max: maxSize)
        }
        let target = targetSize(for: image.size, max: maxSize)
        guard target != image.size else { return image }
        let resizedFrames = frames.map { frame in
            UIGraphicsImageRenderer(size: target).image { _ in
                frame.draw(in: CGRect(origin: .zero, size: target))
            }
        }
        return UIImage.animatedImage(with: resizedFrames, duration: image.duration) ?? image
    }

    static func imageFromLanes(
        laneImages: Array<NitroImage>.SubSequence,
        traitCollection: UITraitCollection
    ) -> UIImage {
        let lightTrait = UITraitCollection(userInterfaceStyle: .light)
        let darkTrait = UITraitCollection(userInterfaceStyle: .dark)

        // Parse all images once
        let parsedImages = laneImages.compactMap { image in
            Parser.parseNitroImage(
                image: image,
                traitCollection: traitCollection
            )
        }

        // Resolve one set (light) just to measure dimensions
        let sampleResolved = parsedImages.map {
            $0.imageAsset?.image(with: lightTrait) ?? $0
        }

        let totalWidth: CGFloat =
            sampleResolved.reduce(0) { $0 + $1.size.width }
            + CGFloat(sampleResolved.count - 1)
        let maxHeight: CGFloat = sampleResolved.map(\.size.height).max() ?? 0
        let rendererSize = CGSize(width: totalWidth, height: maxHeight)

        func mergedImage(for trait: UITraitCollection) -> UIImage {
            let resolvedImages = parsedImages.map {
                $0.imageAsset?.image(with: trait) ?? $0
            }

            let renderer = UIGraphicsImageRenderer(size: rendererSize)
            let image = renderer.image { _ in
                var x: CGFloat = 0
                for img in resolvedImages {
                    img.draw(at: CGPoint(x: x, y: 0))
                    x += img.size.width
                }
            }

            return image.withRenderingMode(.alwaysOriginal)
        }

        let asset = UIImageAsset()
        asset.register(mergedImage(for: lightTrait), with: lightTrait)
        asset.register(mergedImage(for: darkTrait), with: darkTrait)

        return asset.image(with: traitCollection)
    }
}
