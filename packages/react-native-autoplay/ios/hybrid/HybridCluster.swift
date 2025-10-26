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
    ) throws -> Promise<Void> {
        return Promise.async {
            if #available(iOS 15.4, *) {
                try await MainActor.run {
                    let scene = try SceneStore.getClusterScene(
                        clusterId: clusterId
                    )
                    scene?.setAttributedInactiveDescriptionVariants(
                        attributedInactiveDescriptionVariants:
                            attributedInactiveDescriptionVariants
                    )
                }
            } else {
                throw AutoPlayError.unsupportedVersion(
                    "Cluster support only available on iOS >= 15.4"
                )
            }
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
}
