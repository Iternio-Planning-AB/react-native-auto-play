//
//  HybridCarPlayDashboard.swift
//  Pods
//
//  Created by Manuel Auer on 24.10.25.
//
import NitroModules

class HybridCarPlayDashboard: HybridCarPlayDashboardSpec {
    /// Guards the listener dictionaries below. `addListener*` mutate them from
    /// the JS thread while `DashboardSceneDelegate` emits from main-thread
    /// CarPlay callbacks, and Swift dictionaries are not thread-safe.
    private static let listenersLock = NSLock()
    private static var listeners = [EventName: [String: () -> Void]]()
    private static var colorSchemeListeners = [
        String: (_:ColorScheme) -> Void
    ]()

    private static func withListenersLock<T>(_ body: () -> T) -> T {
        listenersLock.lock()
        defer { listenersLock.unlock() }
        return body()
    }

    func addListener(eventType: EventName, callback: @escaping () -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        HybridCarPlayDashboard.withListenersLock {
            HybridCarPlayDashboard.listeners[eventType, default: [:]][uuid] =
                callback
        }

        if eventType == .didconnect && SceneStore.isDashboardModuleConnected() {
            callback()
        }

        return {
            HybridCarPlayDashboard.withListenersLock {
                _ = HybridCarPlayDashboard.listeners[eventType]?.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    func initRootView() throws -> Promise<Void> {
        return Promise.async {
            guard let scene = SceneStore.getDashboardScene() else { return }
            try await MainActor.run {
                try scene.initRootView()
            }
        }
    }

    func setButtons(buttons: [NitroCarPlayDashboardButton]) throws -> Promise<
        Void
    > {
        return Promise.async {
            await MainActor.run {
                guard let scene = SceneStore.getDashboardScene() else { return }
                scene.setButtons(buttons: buttons)
            }
        }
    }

    func addListenerColorScheme(
        callback: @escaping (_ payload: ColorScheme) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCarPlayDashboard.withListenersLock {
            HybridCarPlayDashboard.colorSchemeListeners[uuid] = callback
        }

        return {
            HybridCarPlayDashboard.withListenersLock {
                _ = HybridCarPlayDashboard.colorSchemeListeners.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    static func emit(event: EventName) {
        // Snapshot under the lock, then call out without holding it so a
        // callback that adds or removes a listener cannot deadlock.
        let listeners = HybridCarPlayDashboard.withListenersLock {
            HybridCarPlayDashboard.listeners[event].map { Array($0.values) }
                ?? []
        }
        listeners.forEach {
            $0()
        }
    }

    static func emitColorScheme(colorScheme: ColorScheme) {
        let listeners = HybridCarPlayDashboard.withListenersLock {
            Array(HybridCarPlayDashboard.colorSchemeListeners.values)
        }
        listeners.forEach {
            $0(colorScheme)
        }
    }
}
