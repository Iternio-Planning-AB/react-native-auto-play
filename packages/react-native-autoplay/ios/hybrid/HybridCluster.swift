//
//  HybridCluster.swift
//  Pods
//
//  Created by Manuel Auer on 25.10.25.
//
import NitroModules

class HybridCluster: HybridHybridClusterSpec {
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

    func addListener(
        eventType: ClusterEventName,
        callback: @escaping (_ clusterId: String) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.listeners[eventType, default: [:]][uuid] =
            callback

        if let queuedClusterIds = HybridCluster.eventQueue[eventType] {
            for clusterId in queuedClusterIds {
                callback(clusterId)
            }
            HybridCluster.eventQueue[eventType] = nil
        }

        return {
            HybridCluster.listeners[eventType]?.removeValue(
                forKey: uuid
            )
        }
    }

    func initRootView(clusterId: String) throws -> Promise<Void> {
        return Promise.async {
            if #available(iOS 15.4, *) {
                try await MainActor.run {
                    let scene = try SceneStore.getClusterScene(
                        clusterId: clusterId
                    )
                    scene?.initRootView()
                }
            } else {
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
        if #available(iOS 15.4, *) {
            let scene = try SceneStore.getClusterScene(
                clusterId: clusterId
            )
            scene?.setAttributedInactiveDescriptionVariants(
                attributedInactiveDescriptionVariants:
                    attributedInactiveDescriptionVariants
            )
        } else {
            throw AutoPlayError.unsupportedVersion(
                "Cluster support only available on iOS >= 15.4"
            )
        }
    }

    func addListenerColorScheme(
        callback: @escaping (String, ColorScheme) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.colorSchemeListeners[uuid] = callback

        return {
            HybridCluster.colorSchemeListeners.removeValue(
                forKey: uuid
            )
        }
    }

    func addListenerZoom(
        callback: @escaping (_ clusterId: String, _ payload: ZoomEvent) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.zoomListeners[uuid] = callback

        return {
            HybridCluster.zoomListeners.removeValue(
                forKey: uuid
            )
        }
    }

    func addListenerCompass(
        callback: @escaping (_ clusterId: String, _ payload: Bool) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.compassListeners[uuid] = callback

        return {
            HybridCluster.compassListeners.removeValue(
                forKey: uuid
            )
        }
    }

    func addListenerSpeedLimit(
        callback: @escaping (_ clusterId: String, _ payload: Bool) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.speedLimitListeners[uuid] = callback

        return {
            HybridCluster.speedLimitListeners.removeValue(
                forKey: uuid
            )
        }
    }

    static func emit(event: ClusterEventName, clusterId: String) {
        guard let listeners = HybridCluster.listeners[event], !listeners.isEmpty
        else {
            // no listeners -> queue the event
            HybridCluster.eventQueue[event, default: []].append(clusterId)
            return
        }

        listeners.values.forEach {
            $0(clusterId)
        }
    }

    static func emitColorScheme(clusterId: String, colorScheme: ColorScheme) {
        HybridCluster.colorSchemeListeners.values.forEach {
            $0(clusterId, colorScheme)
        }
    }

    static func emitZoom(clusterId: String, payload: ZoomEvent) {
        HybridCluster.zoomListeners.values.forEach {
            $0(clusterId, payload)
        }
    }

    static func emitCompass(clusterId: String, payload: Bool) {
        HybridCluster.compassListeners.values.forEach {
            $0(clusterId, payload)
        }
    }

    static func emitSpeedLimit(clusterId: String, payload: Bool) {
        HybridCluster.speedLimitListeners.values.forEach {
            $0(clusterId, payload)
        }
    }
}
