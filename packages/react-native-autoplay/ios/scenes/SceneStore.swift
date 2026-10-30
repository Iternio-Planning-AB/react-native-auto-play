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
    static let windowSceneModuleName = "main"

    /// Guards `renderState` and `store`. Scenes are added/removed on the main
    /// thread while the dictionaries are read from the JS thread, and Swift
    /// dictionaries are not thread-safe.
    private static let lock = NSLock()

    private static var renderState = [String: VisibilityState]()

    private static var store: [String: AutoPlayScene] = [:]

    private static var lastRootSessionId = 0
    private static var rootSessionId: Int?

    private static func withLock<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    /// Assigns a new id on every head unit connect, so JS can tell a listener that was suspended
    /// across a disconnect (the app is suspended when CarPlay disconnects and nothing else is
    /// in the foreground) from one called for the current session.
    static func startRootSession() -> Int {
        return withLock {
            lastRootSessionId += 1
            rootSessionId = lastRootSessionId
            return lastRootSessionId
        }
    }

    /// Only clears the id when it still belongs to the ending session, a late disconnect of an
    /// older scene must not end the session of a newer one.
    static func endRootSession(sessionId: Int) {
        withLock {
            if rootSessionId == sessionId {
                rootSessionId = nil
            }
        }
    }

    static func getRootSessionId() -> Int? {
        return withLock { rootSessionId }
    }

    static func addScene(moduleName: String, scene: AutoPlayScene) {
        withLock { store[moduleName] = scene }
    }

    static func removeScene(moduleName: String) {
        let _ = withLock { store.removeValue(forKey: moduleName) }
    }

    static func getScene(moduleName: String) -> AutoPlayScene? {
        return withLock { store[moduleName] }
    }

    static func isRootModuleConnected() -> Bool {
        return getScene(moduleName: SceneStore.rootModuleName)?.isConnected
            ?? false
    }

    static func isDashboardModuleConnected() -> Bool {
        return getScene(moduleName: SceneStore.dashboardModuleName)?.isConnected
            ?? false
    }

    static func getState(moduleName: String) -> VisibilityState? {
        return withLock { renderState[moduleName] }
    }

    static func setState(moduleName: String, state: VisibilityState) {
        withLock { renderState[moduleName] = state }

        HybridAutoPlay.emitRenderState(
            moduleName: moduleName,
            state: state
        )
    }

    static func getDashboardScene() -> DashboardSceneDelegate? {
        guard
            let scene = SceneStore.getScene(
                moduleName: SceneStore.dashboardModuleName
            )
        else {
            return nil
        }

        return scene as? DashboardSceneDelegate
    }

    @available(iOS 15.4, *)
    static func getClusterScene(clusterId: String)
        -> ClusterSceneDelegate?
    {
        guard
            let scene = SceneStore.getScene(
                moduleName: clusterId
            )
        else {
            return nil
        }

        return scene as? ClusterSceneDelegate
    }

    static func getRootScene() -> AutoPlayScene? {
        return getScene(moduleName: SceneStore.rootModuleName)
    }

    static func getRootTraitCollection() -> UITraitCollection? {
        return getRootScene()?.traitCollection
    }
}
