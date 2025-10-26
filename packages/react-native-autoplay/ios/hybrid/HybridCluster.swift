//
//  HybridCluster.swift
//  Pods
//
//  Created by Manuel Auer on 25.10.25.
//
import NitroModules

class HybridCluster: HybridHybridClusterSpec {
    private static var listeners = [
        EventName: [String: (_:String) -> Void]
    ]()

    func addListener(
        eventType: EventName,
        callback: @escaping (_ clusterId: String) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridCluster.listeners[eventType, default: [:]][uuid] =
            callback

        return {
            HybridCluster.listeners[eventType]?.removeValue(
                forKey: uuid
            )
        }
    }

    func initRootView(clusterId: String) throws -> Promise<Void> {
        return Promise.async {
            if #available(iOS 15.4, *) {
                let scene = try SceneStore.getClusterScene(clusterId: clusterId)
                scene?.initRootView()
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
            let scene = try SceneStore.getClusterScene(clusterId: clusterId)
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

    static func emit(event: EventName, clusterId: String) {
        HybridCluster.listeners[event]?.values.forEach {
            $0(clusterId)
        }
    }
}
