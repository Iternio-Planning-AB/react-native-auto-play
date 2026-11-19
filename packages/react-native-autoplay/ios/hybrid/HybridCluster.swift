//
//  HybridCluster.swift
//  Pods
//
//  Created by Manuel Auer on 25.10.25.
//
import NitroModules

class HybridCluster: HybridClusterSpec {
    /// Guards every listener dictionary below. `addListener*` mutate them from
    /// the JS thread while `ClusterSceneDelegate` emits from main-thread
    /// CarPlay callbacks, and Swift dictionaries are not thread-safe.
    private static let listenersLock = NSLock()

    private static var listeners = [
        ClusterEventName: [String: (_:String) -> Void]
    ]()

    private static var eventQueue = [
        ClusterEventName: [String]  // clusterIds queued per event
    ]()

    private static var colorSchemeListeners = [
        String: (_: String, _: ColorScheme) -> Void
    ]()

    private static var zoomListeners = [
        String: (_: String, _: ZoomEvent) -> Void
    ]()

    private static var compassListeners = [
        String: (_: String, _: Bool) -> Void
    ]()

    private static var speedLimitListeners = [
        String: (_: String, _: Bool) -> Void
    ]()

    private static func withListenersLock<T>(_ body: () -> T) -> T {
        listenersLock.lock()
        defer { listenersLock.unlock() }
        return body()
    }

    override init() {
        HybridCluster.withListenersLock {
            HybridCluster.listeners.removeAll()
            HybridCluster.colorSchemeListeners.removeAll()
            HybridCluster.zoomListeners.removeAll()
            HybridCluster.compassListeners.removeAll()
            HybridCluster.speedLimitListeners.removeAll()
        }
        super.init()
    }

    func addListener(
        eventType: ClusterEventName,
        callback: @escaping (_ clusterId: String) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        let queuedClusterIds = HybridCluster.withListenersLock {
            () -> [String]? in
            HybridCluster.listeners[eventType, default: [:]][uuid] = callback

            return HybridCluster.eventQueue.removeValue(forKey: eventType)
        }

        // Drain the queue outside the lock — the callback runs JS.
        queuedClusterIds?.forEach { clusterId in callback(clusterId) }

        return {
            HybridCluster.withListenersLock {
                _ = HybridCluster.listeners[eventType]?.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    func initRootView(clusterId: String) throws -> Promise<Void> {
        return Promise.async {
            if #available(iOS 15.4, *) {
                try await MainActor.run {
                    guard
                        let scene = SceneStore.getClusterScene(
                            clusterId: clusterId
                        )
                    else {
                        return
                    }

                    try scene.initRootView()
                }
            }
            else {
                throw AutoPlayError.unsupportedVersion(
                    "Cluster support only available on iOS >= 15.4"
                )
            }
        }
    }

    func setAttributedInactiveDescriptionVariants(
        clusterId: String,
        attributedInactiveDescriptionVariants:
            [NitroAttributedString]
    ) throws {
        guard #available(iOS 15.4, *) else {
            throw AutoPlayError.unsupportedVersion(
                "Cluster support only available on iOS >= 15.4"
            )
        }

        // This runs on the JS thread, but it ends up assigning
        // CPInstrumentClusterController.attributedInactiveDescriptionVariants,
        // which is main-thread only — and the stored variants are also read
        // from main-thread trait/content-style callbacks.
        Task { @MainActor in
            guard
                let scene = SceneStore.getClusterScene(
                    clusterId: clusterId
                )
            else {
                return
            }

            scene.setAttributedInactiveDescriptionVariants(
                attributedInactiveDescriptionVariants:
                    attributedInactiveDescriptionVariants
            )
        }
    }

    func addListenerColorScheme(
        callback: @escaping (String, ColorScheme) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.withListenersLock {
            HybridCluster.colorSchemeListeners[uuid] = callback
        }

        return {
            HybridCluster.withListenersLock {
                _ = HybridCluster.colorSchemeListeners.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    func addListenerZoom(
        callback: @escaping (_ clusterId: String, _ payload: ZoomEvent) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.withListenersLock {
            HybridCluster.zoomListeners[uuid] = callback
        }

        return {
            HybridCluster.withListenersLock {
                _ = HybridCluster.zoomListeners.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    func addListenerCompass(
        callback: @escaping (_ clusterId: String, _ payload: Bool) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.withListenersLock {
            HybridCluster.compassListeners[uuid] = callback
        }

        return {
            HybridCluster.withListenersLock {
                _ = HybridCluster.compassListeners.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    func addListenerSpeedLimit(
        callback: @escaping (_ clusterId: String, _ payload: Bool) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.withListenersLock {
            HybridCluster.speedLimitListeners[uuid] = callback
        }

        return {
            HybridCluster.withListenersLock {
                _ = HybridCluster.speedLimitListeners.removeValue(
                    forKey: uuid
                )
            }
        }
    }

    static func emit(event: ClusterEventName, clusterId: String) {
        // Snapshot under the lock, then call out without holding it so a
        // callback that adds or removes a listener cannot deadlock.
        let listeners = HybridCluster.withListenersLock {
            () -> [(_: String) -> Void] in
            guard let listeners = HybridCluster.listeners[event],
                !listeners.isEmpty
            else {
                // no listeners -> queue the event
                HybridCluster.eventQueue[event, default: []].append(clusterId)
                return []
            }

            return Array(listeners.values)
        }

        listeners.forEach {
            $0(clusterId)
        }
    }

    static func emitColorScheme(clusterId: String, colorScheme: ColorScheme) {
        let listeners = HybridCluster.withListenersLock {
            Array(HybridCluster.colorSchemeListeners.values)
        }
        listeners.forEach {
            $0(clusterId, colorScheme)
        }
    }

    static func emitZoom(clusterId: String, payload: ZoomEvent) {
        let listeners = HybridCluster.withListenersLock {
            Array(HybridCluster.zoomListeners.values)
        }
        listeners.forEach {
            $0(clusterId, payload)
        }
    }

    static func emitCompass(clusterId: String, payload: Bool) {
        let listeners = HybridCluster.withListenersLock {
            Array(HybridCluster.compassListeners.values)
        }
        listeners.forEach {
            $0(clusterId, payload)
        }
    }

    static func emitSpeedLimit(clusterId: String, payload: Bool) {
        let listeners = HybridCluster.withListenersLock {
            Array(HybridCluster.speedLimitListeners.values)
        }
        listeners.forEach {
            $0(clusterId, payload)
        }
    }
}
