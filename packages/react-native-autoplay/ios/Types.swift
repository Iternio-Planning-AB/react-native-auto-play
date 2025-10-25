//
//  Types.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//

struct TemplateEventPayload {
    let animated: Bool
    let state: VisibilityState
}

enum AutoPlayError: Error {
    case templateNotFound(String)
    case sceneNotFound(String)
    case interfaceControllerNotFound(String)
    case invalidTemplateError(String)
    case propertyNotFoundError(String)
    case unsupportedVersion(String)
}
