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

enum AutoPlayError: LocalizedError {
    case templateNotFound(String)
    case interfaceControllerNotFound(String)
    case invalidTemplateError(String)
    case propertyNotFoundError(String)
    case unsupportedVersion(String)
    case invalidTemplateType(String)
    case noUiWindow(String)
    case initReactRootViewFailed(String)
    case voiceInputCancelled
}
