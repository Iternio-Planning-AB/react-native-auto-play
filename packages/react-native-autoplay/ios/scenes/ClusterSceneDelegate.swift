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
    var instrumentClusterController:CPInstrumentClusterController?
    
    override init() {
        super.init(moduleName: clusterId)
    }

    func templateApplicationInstrumentClusterScene(
        _ templateApplicationInstrumentClusterScene:
            CPTemplateApplicationInstrumentClusterScene,
        didConnect instrumentClusterController: CPInstrumentClusterController
    ) {
        instrumentClusterController.delegate = self
        self.instrumentClusterController = instrumentClusterController
        
        //        let contentStyle = templateApplicationInstrumentClusterScene
        //            .contentStyle
        //        RNCarPlay.connect(withInstrumentClusterController: instrumentClusterController,
        //                          contentStyle: contentStyle,
        //                          clusterId: clusterId)
    }

    func templateApplicationInstrumentClusterScene(
        _ templateApplicationInstrumentClusterScene:
            CPTemplateApplicationInstrumentClusterScene,
        didDisconnectInstrumentClusterController instrumentClusterController:
            CPInstrumentClusterController
    ) {
        
    }

    func instrumentClusterControllerDidConnect(
        _ instrumentClusterWindow: UIWindow
    ) {
        self.window = instrumentClusterWindow
        
        let props: [String: Any] = [
            "colorScheme": instrumentClusterWindow.screen.traitCollection
                .userInterfaceStyle == .dark ? "dark" : "light",
            "window": [
                "height": instrumentClusterWindow.screen.bounds.size.height,
                "width": instrumentClusterWindow.screen.bounds.size.width,
                "scale": instrumentClusterWindow.screen.scale,
            ],
        ]
        
        connect(props: props)
        HybridCluster.emit(event: .didconnect, clusterId: clusterId)
    }

    func instrumentClusterControllerDidDisconnectWindow(
        _ instrumentClusterWindow: UIWindow
    ) {
        disconnect()
        HybridCluster.emit(event: .diddisconnect, clusterId: clusterId)
    }

    func contentStyleDidChange(_ contentStyle: UIUserInterfaceStyle) {
        //        RNCarPlay.clusterContentStyleDidChange(contentStyle, clusterId: clusterId)
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
}
