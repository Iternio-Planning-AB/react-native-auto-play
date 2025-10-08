//
//  Parser.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

struct Actions {
    let leadingNavigationBarButtons: [CPBarButton]
    let trailingNavigationBarButtons: [CPBarButton]
    let backButton: CPBarButton?
}

class Parser {
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
                        )
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

    static func parseText(text: Text) -> String {
        var result = text.text

        if let distance = text.distance {
            result = result.replacingOccurrences(
                of: "{distance}",
                with: parseDistance(distance: distance)
            )
        }

        if let duration = text.duration {
            let formatter = DateComponentsFormatter()
            formatter.unitsStyle = .short
            formatter.allowedUnits = [.hour, .minute]
            formatter.zeroFormattingBehavior = .dropAll
            formatter.collapsesLargestUnit = false

            result = result.replacingOccurrences(
                of: "{duration}",
                with: formatter.string(from: duration)?.replacingOccurrences(
                    of: ",",
                    with: ""
                ) ?? ""
            )
        }

        return result
    }

    static func parseDistance(distance: Distance) -> String {
        let formatter = MeasurementFormatter()
        formatter.unitOptions = .providedUnit
        formatter.unitStyle = .medium
        formatter.numberFormatter.minimumFractionDigits = 0
        formatter.numberFormatter.roundingMode = .halfUp

        var unit: UnitLength
        
        switch distance.unit {
        case .meters:
            formatter.numberFormatter.maximumFractionDigits = 0
            unit = UnitLength.meters
        case .miles:
            formatter.numberFormatter.maximumFractionDigits = 1
            unit = UnitLength.miles
        case .yards:
            formatter.numberFormatter.maximumFractionDigits = 0
            unit = UnitLength.yards
        case .feet:
            formatter.numberFormatter.maximumFractionDigits = 0
            unit =  UnitLength.feet
        case .kilometers:
            formatter.numberFormatter.maximumFractionDigits = 1
            unit = UnitLength.kilometers
        }

        let measurement = Measurement(value: distance.value, unit: unit)

        return formatter.string(from: measurement)
    }
}
