//
//  CPTemplate+Extensions.swift
//  Pods
//
//  Created by Manuel Auer on 14.10.25.
//

import CarPlay

extension CPTemplate {
    func getTemplateId() -> String? {
        guard let userInfo = self.userInfo as? [String: Any],
            let templateId = userInfo["id"] as? String
        else {
            return nil
        }

        return templateId
    }
}

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
    func getRouteId() throws -> String {
        guard let userInfo = self.userInfo as? [String: Any],
            let routeId = userInfo["id"] as? String
        else {
            throw AutoPlayError.propertyNotFoundError("id on CPRouteChoice")
        }

        return routeId
    }

    func getTravelEstimates() -> [CPTravelEstimates] {
        guard let userInfo = self.userInfo as? [String: Any],
            let travelEstimates = userInfo["travelEstimates"]
                as? [CPTravelEstimates]
        else {
            return []
        }

        return travelEstimates
    }
}

extension CPTrip {
    func getTripId() throws -> String {
        guard let userInfo = self.userInfo as? [String: Any],
            let tripId = userInfo["id"] as? String
        else {
            throw AutoPlayError.propertyNotFoundError("id on CPTrip")
        }

        return tripId
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
    var secondarySymbolImage: UIImage? {
        get {
            return (self.userInfo as? [String: Any])?["secondarySymbolImage"]
                as? UIImage
        }
        set {
            var info = (self.userInfo as? [String: Any]) ?? [:]
            info["secondarySymbolImage"] = newValue
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
