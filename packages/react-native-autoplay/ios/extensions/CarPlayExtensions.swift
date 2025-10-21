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
    var id: String? {
        get {
            return (self.userInfo as? [String: Any])?["id"] as? String
        }
        set {
            var info = (self.userInfo as? [String: Any]) ?? [:]
            info["id"] = newValue
            self.userInfo = info
        }
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
