//
//  Parser.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay
import React
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
                let button =
                    action.image != nil
                    ? CPBarButton(
                        image: SymbolFont.imageFromNitroImage(
                            image: action.image!,
                            fontScale: 0.8,
                            // this icon is not scaled properly when used as image asset, so we use the plain image, as CP does the correct coloring anyways
                            noImageAsset: true,
                            traitCollection: traitCollection
                        )!
                    ) { _ in action.onPress() }
                    : CPBarButton(title: action.title ?? "") { _ in
                        action.onPress()
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

    static func parseSections(
        sections: [NitroSection]?,
        updateSection: @escaping (NitroSection, Int) -> Void,
        traitCollection: UITraitCollection
    ) -> [CPListSection] {
        guard let sections else { return [] }

        return sections.enumerated().map { (sectionIndex, section) in
            let items = section.items.enumerated().map { (itemIndex, item) in
                let isSelected =
                    section.type == .radio
                    && Int(section.selectedIndex ?? -1) == itemIndex

                let toggleImage = item.checked.map { checked in
                    UIImage.makeToggleImage(
                        enabled: checked,
                        maximumImageSize: CPListItem.maximumImageSize
                    )
                }

                let listItem = CPListItem(
                    text: parseText(text: item.title),
                    detailText: parseText(text: item.detailedText),
                    image: SymbolFont.imageFromNitroImage(
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

                    var updatedSection = sections[sectionIndex]
                    if let checked = updatedSection.items[itemIndex].checked {
                        updatedSection.items[itemIndex].checked = !checked
                    }

                    if updatedSection.type == .radio {
                        updatedSection.selectedIndex = Double(itemIndex)
                    }

                    updateSection(updatedSection, sectionIndex)

                    item.onPress(item.checked.map { checked in !checked })
                    completion()
                }

                return listItem
            }

            return CPListSection(
                items: items,
                header: section.title,
                sectionIndexTitle: nil
            )
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
                parseTravelEstiamtes(travelEstimates: step.travelEstimates)
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

    static func parseTravelEstiamtes(travelEstimates: TravelEstimates)
        -> CPTravelEstimates
    {
        return CPTravelEstimates(
            distanceRemaining: parseDistance(
                distance: travelEstimates.distanceRemaining
            ),
            timeRemaining: travelEstimates.timeRemaining.seconds
        )
    }

    static func parseManeuver(
        nitroManeuver: NitroManeuver,
        traitCollection: UITraitCollection
    ) -> CPManeuver {
        let maneuver = CPManeuver(id: nitroManeuver.id)

        maneuver.attributedInstructionVariants = nitroManeuver
            .attributedInstructionVariants.map { variant in
                let attributedString = NSMutableAttributedString(
                    string: variant.text
                )
                if let nitroImages = variant.images {
                    nitroImages.forEach { image in
                        let attachment = NSTextAttachment(
                            image: SymbolFont.imageFromNitroImage(
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

        maneuver.initialTravelEstimates = Parser.parseTravelEstiamtes(
            travelEstimates: nitroManeuver.travelEstimates
        )
        maneuver.symbolImage = SymbolFont.imageFromNitroImage(
            image: nitroManeuver.symbolImage,
            traitCollection: traitCollection
        )
        maneuver.junctionImage = SymbolFont.imageFromNitroImage(
            image: nitroManeuver.junctionImage,
            traitCollection: traitCollection
        )

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
    static func getManeuverType(maneuver: NitroManeuver) -> CPManeuverType {
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

    static func doubleToAngle(values: [Double]) -> [Measurement<UnitAngle>] {
        return values.map {
            doubleToAngle(value: $0)
        }
    }

    static func doubleToAngle(value: Double) -> Measurement<UnitAngle> {
        return Measurement(value: value, unit: UnitAngle.degrees)
    }
}
