//
//  SceneStore.swift
//  Pods
//
//  Created by Manuel Auer on 01.10.25.
//

import CarPlay

class SceneStore {
    static let rootModuleName = "AutoPlayRoot"
    static let dashboardModuleName = "CarPlayDashboard"

    private static var store: [String: AutoPlayScene] = [:]

    static func addScene(moduleName: String, scene: AutoPlayScene) {
        store[moduleName] = scene
    }

    static func removeScene(moduleName: String) {
        store.removeValue(forKey: moduleName)
    }

    static func getScene(moduleName: String) -> AutoPlayScene? {
        return store[moduleName]
    }

    static func isRootModuleConnected() -> Bool {
        return store[SceneStore.rootModuleName]?.isConnected ?? false
    }

    static func isDashboardModuleConnected() -> Bool {
        return store[SceneStore.dashboardModuleName]?.isConnected ?? false
    }

    static func getState(moduleName: String) -> VisibilityState? {
        return store[moduleName]?.state
    }

    static func getDashboardScene() throws -> DashboardSceneDelegate? {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.dashboardModuleName
            )
        else {
            throw AutoPlayError.sceneNotFound(
                "operation failed, \(SceneStore.dashboardModuleName) scene not found"
            )
        }

        return scene as? DashboardSceneDelegate
    }
}
