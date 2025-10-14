//
//  RootModule.swift
//  Pods
//
//  Created by Manuel Auer on 09.10.25.
//

import CarPlay

class RootModule {
    static func withScene(perform action: @escaping (AutoPlayScene) throws -> Void) throws {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.rootModuleName
            )
        else {
            throw AutoPlayError.sceneNotFound(
                "operation failed, \(SceneStore.rootModuleName) scene not found"
            )
        }
        
        try action(scene)
    }
    
    static func withTemplate(templateId: String, perform action: @escaping (AutoPlayTemplate?) throws -> Void) throws {
        try withScene { scene in
            guard
                let template = scene.templateStore.getTemplate(templateId: templateId)
            else {
                throw AutoPlayError.templateNotFound(templateId)
            }
            
            try action(template)
        }
    }
    
    @MainActor
    static func withScene<T>(
        perform action:
            @escaping (AutoPlayScene) async throws -> T
    ) async throws -> T {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.rootModuleName
            )
        else {
            throw AutoPlayError.sceneNotFound(
                "operation failed, \(SceneStore.rootModuleName) scene not found"
            )
        }

        return try await action(scene)
    }

    @MainActor
    static func withSceneAndInterfaceController<T>(
        perform action:
            @escaping (AutoPlayScene, AutoPlayInterfaceController) async throws -> T
    ) async throws -> T {
        return try await withScene { scene in
            guard let interfaceController = scene.interfaceController else {
                throw AutoPlayError.interfaceControllerNotFound(
                    "operation failed, \(SceneStore.rootModuleName) interfaceController not found"
                )
            }

            return try await action(scene, interfaceController)
        }
    }

    @MainActor
    static func withInterfaceController<T>(
        perform action: @escaping (AutoPlayInterfaceController) async throws -> T
    ) async throws -> T {
        try await withSceneAndInterfaceController { _, interfaceController in
            try await action(interfaceController)
        }
    }

    @MainActor
    static func withTemplateAndInterfaceController<T>(
        templateId: String,
        perform action:
            @escaping (CPTemplate, AutoPlayInterfaceController) async throws -> T
    ) async throws -> T {
        return try await withSceneAndInterfaceController {
            scene,
            interfaceController in
            guard
                let template = scene.templateStore.getCPTemplate(
                    templateId: templateId
                )
            else {
                throw AutoPlayError.templateNotFound(
                    "operation failed, \(templateId) template not found"
                )
            }
            return try await action(template, interfaceController)
        }
    }

    @MainActor
    static func withSceneTemplateAndInterfaceController<T>(
        templateId: String,
        perform action:
            @escaping (CPTemplate, AutoPlayScene, AutoPlayInterfaceController)
            async throws -> T
    ) async throws -> T {
        return try await withSceneAndInterfaceController {
            scene,
            interfaceController in

            guard
                let template = scene.templateStore.getCPTemplate(
                    templateId: templateId
                )
            else {
                throw AutoPlayError.templateNotFound(
                    "operation failed, \(templateId) template not found"
                )
            }
            return try await action(template, scene, interfaceController)
        }
    }
}
