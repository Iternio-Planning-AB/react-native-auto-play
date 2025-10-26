//
//  ClusterScene.swift
//
//  Created by Manuel Auer on 28.09.25.
//

import CarPlay
import UIKit

@available(iOS 15.4, *)
@objc(ClusterSceneDelegate)
class ClusterSceneDelegate: AutoPlayScene,
    CPTemplateApplicationInstrumentClusterSceneDelegate,
    CPInstrumentClusterControllerDelegate
{
    var clusterId = UUID().uuidString
    var instrumentClusterController: CPInstrumentClusterController?
    var attributedInactiveDescriptionVariants: [NitroAttributedString] = []

    override init() {
        super.init(moduleName: clusterId)
    }

    // MARK: CPTemplateApplicationInstrumentClusterSceneDelegate
    func templateApplicationInstrumentClusterScene(
        _ templateApplicationInstrumentClusterScene:
            CPTemplateApplicationInstrumentClusterScene,
        didConnect instrumentClusterController: CPInstrumentClusterController
    ) {
        instrumentClusterController.delegate = self
        self.instrumentClusterController = instrumentClusterController
        self.traitCollection = UITraitCollection(
            userInterfaceStyle: templateApplicationInstrumentClusterScene
                .contentStyle
        )
        HybridCluster.emit(event: .didconnect, clusterId: clusterId)
    }

    func templateApplicationInstrumentClusterScene(
        _ templateApplicationInstrumentClusterScene:
            CPTemplateApplicationInstrumentClusterScene,
        didDisconnectInstrumentClusterController instrumentClusterController:
            CPInstrumentClusterController
    ) {
        disconnect()
        HybridCluster.emit(event: .diddisconnect, clusterId: clusterId)
    }

    func contentStyleDidChange(_ contentStyle: UIUserInterfaceStyle) {
        traitCollection = UITraitCollection(userInterfaceStyle: contentStyle)
        applyAttributedInactiveDescriptionVariants()
        HybridCluster.emitColorScheme(
            clusterId: clusterId,
            colorScheme: traitCollection.userInterfaceStyle == .dark
                ? .dark : .light
        )
    }

    // MARK: CPInstrumentClusterControllerDelegate
    func instrumentClusterControllerDidConnect(
        _ instrumentClusterWindow: UIWindow
    ) {
        self.window = instrumentClusterWindow

        let isCompassEnabled =
            instrumentClusterController?.compassSetting != .disabled
        let isSpeedLimitEnabled =
            instrumentClusterController?.speedLimitSetting != .disabled

        let props: [String: Any] = [
            "colorScheme": self.traitCollection.userInterfaceStyle == .dark
                ? "dark" : "light",
            "window": [
                "height": instrumentClusterWindow.screen.bounds.size.height,
                "width": instrumentClusterWindow.screen.bounds.size.width,
                "scale": instrumentClusterWindow.screen.scale,
            ],
            "compass": isCompassEnabled,
            "speedLimit": isSpeedLimitEnabled,
        ]

        connect(props: props)
        HybridCluster.emit(event: .didconnectwithwindow, clusterId: clusterId)
    }

    func instrumentClusterControllerDidDisconnectWindow(
        _ instrumentClusterWindow: UIWindow
    ) {
        // only the window disconnected but it could come back so do not call disconnect in here
        self.window = nil
        HybridCluster.emit(
            event: .diddisconnectfromwindow,
            clusterId: clusterId
        )
    }

    func instrumentClusterControllerDidZoom(
        in instrumentClusterController: CPInstrumentClusterController
    ) {
        HybridCluster.emitZoom(clusterId: clusterId, payload: .in)
    }

    func instrumentClusterControllerDidZoomOut(
        _ instrumentClusterController: CPInstrumentClusterController
    ) {
        HybridCluster.emitZoom(clusterId: clusterId, payload: .out)
    }

    func instrumentClusterController(
        _ instrumentClusterController: CPInstrumentClusterController,
        didChangeCompassSetting compassSetting: CPInstrumentClusterSetting
    ) {
        let isEnabled = compassSetting != .disabled
        HybridCluster.emitCompass(clusterId: clusterId, payload: isEnabled)
    }

    func instrumentClusterController(
        _ instrumentClusterController: CPInstrumentClusterController,
        didChangeSpeedLimitSetting speedLimitSetting: CPInstrumentClusterSetting
    ) {
        let isEnabled = speedLimitSetting != .disabled
        HybridCluster.emitSpeedLimit(clusterId: clusterId, payload: isEnabled)
    }

    // MARK: AutoPlayScene
    override func traitCollectionDidChange(traitCollection: UITraitCollection) {
        super.traitCollectionDidChange(traitCollection: traitCollection)
        applyAttributedInactiveDescriptionVariants()
        HybridCluster.emitColorScheme(
            clusterId: clusterId,
            colorScheme: traitCollection.userInterfaceStyle == .dark
                ? .dark : .light
        )
    }

    func sceneWillResignActive(_ scene: UIScene) {
        setState(state: .willdisappear)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        setState(state: .diddisappear)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        setState(state: .willappear)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        setState(state: .didappear)
    }

    // MARK: ClusterSceneDelegate
    func setAttributedInactiveDescriptionVariants(
        attributedInactiveDescriptionVariants:
            [NitroAttributedString]
    ) {
        self.attributedInactiveDescriptionVariants =
            attributedInactiveDescriptionVariants
        applyAttributedInactiveDescriptionVariants()
    }

    func applyAttributedInactiveDescriptionVariants() {
        instrumentClusterController?.attributedInactiveDescriptionVariants =
            Parser.parseAttributedStrings(
                attributedStrings: attributedInactiveDescriptionVariants,
                traitCollection: traitCollection
            )
    }
}
