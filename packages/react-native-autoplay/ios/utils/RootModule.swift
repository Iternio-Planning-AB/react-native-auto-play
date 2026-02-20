//
//  RootModule.swift
//  Pods
//
//  Created by Manuel Auer on 09.10.25.
//

import CarPlay

class RootModule {
    static func withScene(
        perform action: @escaping (AutoPlayScene) throws -> Void
    ) throws {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.rootModuleName
            )
        else {
            return
        }

        try action(scene)
    }

    static func withTemplateStore(
        perform action: @escaping (TemplateStore) throws -> Void
    ) throws {
        try withScene { rootScene in
            try action(rootScene.templateStore)
        }
    }

    static func withAutoPlayTemplate<T>(
        templateId: String,
        perform action: @escaping (T) throws -> Void
    ) throws {
        try withScene { rootScene in
            let template = try rootScene.templateStore.getTemplate(
                templateId: templateId
            )

            guard let template = template as? T else {
                throw AutoPlayError.invalidTemplateType(
                    "\(template) is not a \(T.self) template"
                )
            }

            try action(template)
        }
    }

    static func withTemplate<T: CPTemplate>(
        templateId: String,
        perform action: @escaping (T) throws -> Void
    ) throws {
        try withAutoPlayTemplate(templateId: templateId) {
            (autoPlayTemplate: AutoPlayTemplate) in
            if let template = autoPlayTemplate.getTemplate() as? T {
                try! action(template)
            }
            else {
                throw AutoPlayError.invalidTemplateType(
                    "\(autoPlayTemplate) is not a \(T.self) template"
                )
            }
        }
    }

    static func withScene<T>(
        perform action:
            @escaping (AutoPlayScene) async throws -> T
    ) async throws -> T? {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.rootModuleName
            )
        else {
            return nil
        }

        return try await action(scene)
    }

    @MainActor
    static func withSceneAndInterfaceController<T>(
        perform action:
            @escaping (AutoPlayScene, AutoPlayInterfaceController) async throws
            -> T
    ) async throws -> T? {
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
        perform action:
            @escaping (AutoPlayInterfaceController) async throws -> T
    ) async throws -> T? {
        try await withSceneAndInterfaceController { _, interfaceController in
            try await action(interfaceController)
        }
    }
}
