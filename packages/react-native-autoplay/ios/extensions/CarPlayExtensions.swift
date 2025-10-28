//
//  CPTemplate+Extensions.swift
//  Pods
//
//  Created by Manuel Auer on 14.10.25.
//

import CarPlay

extension CPMapButton {
    convenience init(
        image: UIImage,
        handler: @escaping (CPMapButton) -> Void
    ) {
        self.init(handler: handler)
        self.image = image
    }
}

extension CPRouteChoice {
    convenience init(
        summaryVariants: [String],
        additionalInformationVariants: [String],
        selectionSummaryVariants: [String],
        id: String,
        travelEstimates: [CPTravelEstimates]
    ) {
        self.init(
            summaryVariants: summaryVariants,
            additionalInformationVariants: additionalInformationVariants,
            selectionSummaryVariants: selectionSummaryVariants
        )
        var info: [String: Any] = [:]
        info["id"] = id
        info["travelEstimates"] = travelEstimates
        self.userInfo = info
    }
    var id: String {
        return (self.userInfo as? [String: Any])?["id"] as! String
    }
    var travelEstimates: [CPTravelEstimates] {
        return (self.userInfo as? [String: Any])?["travelEstimates"]
            as! [CPTravelEstimates]
    }
}

extension CPTrip {
    convenience init(
        origin: MKMapItem,
        destination: MKMapItem,
        routeChoices: [CPRouteChoice],
        id: String
    ) {
        self.init(
            origin: origin,
            destination: destination,
            routeChoices: routeChoices
        )
        var info: [String: Any] = [:]
        info["id"] = id
        self.userInfo = info
    }
    var id: String {
        return (self.userInfo as? [String: Any])?["id"] as! String
    }
}

extension CPManeuver {
    convenience init(id: String, isSecondary: Bool = false) {
        self.init()
        var info: [String: Any] = [:]
        info["id"] = id
        info["isSecondary"] = isSecondary
        self.userInfo = info
    }
    var id: String {
        return (self.userInfo as? [String: Any])?["id"] as! String
    }
    @available(iOS 17.4, *)
    var laneGuidance: CPLaneGuidance? {
        // iOS does not store the actual CPLaneGuidance type but some NSConcreteMutableAttributedString so we store it in userInfo so we can access it later on
        get {
            return (self.userInfo as? [String: Any])?["laneGuidance"]
                as? CPLaneGuidance
        }
        set {
            var info = (self.userInfo as? [String: Any]) ?? [:]
            info["laneGuidance"] = newValue
            self.userInfo = info
        }
    }
    var laneImages: [NitroImage]? {
        get {
            return (self.userInfo as? [String: Any])?["laneImages"]
                as? [NitroImage]
        }
        set {
            var info = (self.userInfo as? [String: Any]) ?? [:]
            info["laneImages"] = newValue
            self.userInfo = info
        }
    }
    var isSecondary: Bool {
        return (self.userInfo as? [String: Any])?["isSecondary"]
            as! Bool
    }
}

@available(iOS 17.4, *)
extension CPLaneGuidance {
    convenience init(instructionVariants: [String], lanes: [CPLane]) {
        self.init()
        self.instructionVariants = instructionVariants
        self.lanes = lanes
    }
}

@available(iOS 17.4, *)
extension CPLane {
    convenience init(
        angles: [Measurement<UnitAngle>],
        highlightedAngle: Measurement<UnitAngle>?,
        isPreferred: Bool
    ) {
        if #available(iOS 18.0, *) {
            if let highlightedAngle = highlightedAngle {
                self.init(
                    angles: angles,
                    highlightedAngle: highlightedAngle,
                    isPreferred: isPreferred
                )
            } else {
                self.init(angles: angles)
            }
        } else {
            self.init()
            if let highlightedAngle = highlightedAngle {
                self.primaryAngle = highlightedAngle
            }
            self.secondaryAngles = angles
            self.status =
                isPreferred ? CPLaneStatus.preferred : CPLaneStatus.notGood
        }
    }
}
