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
    func getRouteId() throws -> String? {
        guard let userInfo = self.userInfo as? [String: Any],
            let routeId = userInfo["id"] as? String
        else {
            throw AutoPlayError.propertyNotFoundError("id on CPRouteChoice")
        }

        return routeId
    }
    
    func getTravelEstimates() throws -> CPTravelEstimates? {
        guard let userInfo = self.userInfo as? [String: Any],
            let travelEstimates = userInfo["travelEstimates"] as? CPTravelEstimates
        else {
            throw AutoPlayError.propertyNotFoundError("travelEstimates on CPRouteChoice")
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
