//
//  HybridCarPlayDashboard.swift
//  Pods
//
//  Created by Manuel Auer on 24.10.25.
//
import NitroModules

class HybridCarPlayDashboard: HybridHybridCarPlayDashboardSpec {
    private static var listeners = [DashboardEvent: [String: () -> Void]]()

    func addListener(eventType: DashboardEvent, callback: @escaping () -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        HybridCarPlayDashboard.listeners[eventType, default: [:]][uuid] =
            callback

        if eventType == .didconnect && SceneStore.isDashboardModuleConnected() {
            callback()
        }

        return {
            HybridCarPlayDashboard.listeners[eventType]?.removeValue(
                forKey: uuid
            )
        }
    }

    func initRootView() throws -> Void {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.dashboardModuleName
            )
        else {
            throw AutoPlayError.sceneNotFound(
                "operation failed, \(SceneStore.dashboardModuleName) scene not found"
            )
        }

        scene.initRootView()
    }

    static func emit(event: DashboardEvent) {
        HybridCarPlayDashboard.listeners[event]?.values.forEach {
            $0()
        }
    }
}
