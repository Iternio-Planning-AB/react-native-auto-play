//
//  HybridCarPlayDashboard.swift
//  Pods
//
//  Created by Manuel Auer on 24.10.25.
//
import NitroModules

class HybridCarPlayDashboard: HybridHybridCarPlayDashboardSpec {
    private static var listeners = [EventName: [String: () -> Void]]()

    func addListener(eventType: EventName, callback: @escaping () -> Void)
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

    func initRootView() throws {
        let scene = try SceneStore.getDashboardScene()
        scene?.initRootView()
    }

    func setButtons(buttons: [NitroCarPlayDashboardButton]) throws -> Promise<
        Void
    > {
        return Promise.async {
            try await MainActor.run {
                let scene = try SceneStore.getDashboardScene()
                scene?.setButtons(buttons: buttons)
            }
        }
    }

    static func emit(event: EventName) {
        HybridCarPlayDashboard.listeners[event]?.values.forEach {
            $0()
        }
    }
}
