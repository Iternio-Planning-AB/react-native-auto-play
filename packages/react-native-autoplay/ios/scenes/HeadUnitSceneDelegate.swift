//
//  HeadunitSceneDelegate.swift
//
//  Created by Manuel Auer on 28.09.25.
//

import CarPlay
import Foundation
import React

@objc(HeadUnitSceneDelegate)
class HeadUnitSceneDelegate: AutoPlayScene, CPTemplateApplicationSceneDelegate
{
    var interfaceController: CPInterfaceController?
    
    override init() {
        super.init(moduleName: SceneStore.rootModuleName)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController,
        to window: CPWindow
    ) {
        self.window = window
        self.interfaceController = interfaceController
                
        let props: [String: Any] = [
            "colorScheme": window.screen.traitCollection
                .userInterfaceStyle == .dark ? "dark" : "light",
            "window": [
                "height": window.bounds.size.height,
                "width": window.bounds.size.width,
                "scale": window.screen.scale,
            ],
        ]
        
        connect(props: props)
        HybridAutoPlay.emit(event: .didconnect)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController:
            CPInterfaceController
    ) {
        HybridAutoPlay.emit(event: .diddisconnect)
        disconnect()
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
