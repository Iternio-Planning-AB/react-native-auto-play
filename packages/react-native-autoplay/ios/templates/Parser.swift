//
//  Parser.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay
import React
import UIKit

struct Actions {
    let leadingNavigationBarButtons: [CPBarButton]
    let trailingNavigationBarButtons: [CPBarButton]
    let backButton: CPBarButton?
}

class Parser {
    static let PLACEHOLDER_DISTANCE = "{distance}"
    static let PLACEHOLDER_DURATION = "{duration}"

    static func parseActions(actions: [NitroAction]?) -> Actions {
        var leadingNavigationBarButtons: [CPBarButton] = []
        var trailingNavigationBarButtons: [CPBarButton] = []
        var backButton: CPBarButton?

        if let actions = actions {
            actions.forEach { action in
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
                            image: action.image!
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

        return Actions(
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
        updateSection: @escaping (NitroSection, Int) -> Void
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
                    image: SymbolFont.imageFromNitroImage(image: item.image),
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
                duration: routeChoice.steps.last!.travelEstimates.timeRemaining.seconds
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
            selectionSummaryVariants: selectionSummaryVariants
        )

        route.userInfo = [
            "id": routeChoice.id,
            // we don't want to keep the origin travel estimate
            "travelEstimates": routeChoice.steps[1...].map { step in
                parseTravelEstiamtes(travelEstimates: step.travelEstimates)
            },
        ]

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
            routeChoices: [routeChoices]
        )

        trip.userInfo = ["id": tripConfig.id]
        
        return trip
    }

    static func parseTrips(trips: [TripsConfig]) -> [CPTrip] {
        return trips.map { tripConfig in
            let trip = CPTrip(
                origin: parseTripPoint(
                    point: tripConfig.routeChoices.first!.steps.first!
                ),
                destination: parseTripPoint(
                    point: tripConfig.routeChoices.first!.steps.last!
                ),
                routeChoices: tripConfig.routeChoices.map { routeChoice in
                    Parser.parseRouteChoice(routeChoice: routeChoice)
                }
            )

            trip.userInfo = ["id": tripConfig.id]

            return trip
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

    static func parseColor(color: NitroColor?) -> UIColor? {
        guard let color else { return nil }

        let darkColor = RCTConvert.uiColor(color.darkColor) ?? .systemGray
        let lightColor = RCTConvert.uiColor(color.lightColor) ?? .systemGray

        return UIColor { traitCollection in
            switch traitCollection.userInterfaceStyle {
            case .dark:
                return darkColor
            case .light, .unspecified:
                return lightColor
            @unknown default:
                return lightColor
            }
        }
    }
    
    static func parseManeuver (nitroManeuver: NitroManeuver) -> CPManeuver {
        let maneuver = CPManeuver()
        maneuver.id = nitroManeuver.id
        
        maneuver.attributedInstructionVariants = nitroManeuver.attributedInstructionVariants.map { variant in
            let attributedString = NSMutableAttributedString(string: variant.text)
            if let nitroImages = variant.images {
                nitroImages.forEach { image in
                    let attachment = NSTextAttachment(image: SymbolFont.imageFromNitroImage(image: image.image)!)
                    let container = NSAttributedString(attachment: attachment)
                    attributedString.insert(container, at: Int(image.position))
                }
            }
            return attributedString
        }
        
        maneuver.initialTravelEstimates = Parser.parseTravelEstiamtes(
            travelEstimates: nitroManeuver.travelEstimates
        )
        maneuver.symbolImage = SymbolFont.imageFromNitroImage(
            image: nitroManeuver.symbolImage
        )
        maneuver.junctionImage = SymbolFont.imageFromNitroImage(
            image: nitroManeuver.junctionImage
        )

        if #available(iOS 17.4, *) {
            maneuver.maneuverType = CPManeuverType(
                rawValue: UInt(nitroManeuver.maneuverType.rawValue)
            )!
            maneuver.trafficSide = CPTrafficSide(
                rawValue: UInt(nitroManeuver.trafficSide.rawValue)
            )!
            maneuver.roadFollowingManeuverVariants =
                nitroManeuver.roadFollowingManeuverVariants

            if let junctionType = nitroManeuver.junctionType?.rawValue {
                maneuver.junctionType = CPJunctionType(
                    rawValue: UInt(junctionType)
                )!
            }

            if let junctionExitAngle = nitroManeuver.junctionExitAngle {
                maneuver.junctionExitAngle = Measurement(
                    value: junctionExitAngle,
                    unit: UnitAngle.degrees
                )
            }

            if let junctionElementAngles = nitroManeuver
                .junctionElementAngles
            {
                maneuver.junctionElementAngles = Set(
                    junctionElementAngles.map {
                        Measurement(value: $0, unit: UnitAngle.degrees)
                    }
                )
            }

            if let highwayExitLabel = nitroManeuver.highwayExitLabel {
                maneuver.highwayExitLabel = highwayExitLabel
            }

            if let linkedLaneGuidance = nitroManeuver.linkedLaneGuidance {
                let lanes = linkedLaneGuidance.lanes.map { lane in
                    let angles = lane.angles.map {
                        Measurement(value: $0, unit: UnitAngle.degrees)
                    }
                    let highlightedAngle = Measurement(
                        value: lane.highlightedAngle,
                        unit: UnitAngle.degrees
                    )
                    let status = CPLaneStatus(
                        rawValue: Int(lane.status.rawValue)
                    )!
                    if #available(iOS 18.0, *) {
                        let linkedLane = CPLane(
                            angles: angles,
                            highlightedAngle: highlightedAngle,
                            isPreferred: lane.status == .preferred
                        )
                        linkedLane.status = status
                        return linkedLane
                    }
                    let linkedLane = CPLane()
                    linkedLane.primaryAngle = highlightedAngle
                    linkedLane.status = status
                    linkedLane.secondaryAngles = angles
                    return linkedLane
                }
                let laneGuidance = CPLaneGuidance()
                laneGuidance.instructionVariants =
                    linkedLaneGuidance.instructionVariants
                laneGuidance.lanes = lanes
                maneuver.linkedLaneGuidance = laneGuidance
            }
        }
        
        return maneuver
    }
}
