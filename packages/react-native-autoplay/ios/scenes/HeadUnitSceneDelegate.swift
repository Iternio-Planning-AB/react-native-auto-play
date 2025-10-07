//
//  HeadunitSceneDelegate.swift
//
//  Created by Manuel Auer on 28.09.25.
//

import CarPlay
import Foundation
import React

@objc(HeadUnitSceneDelegate)
class HeadUnitSceneDelegate: AutoPlayScene, CPTemplateApplicationSceneDelegate,
    CPInterfaceControllerDelegate
{
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

        interfaceController.delegate = self

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

    func templateWillAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        HybridAutoPlay.emitTemplateState(
            template: aTemplate,
            templateState: .willappear,
            animated: animated
        )
    }

    func templateDidAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        HybridAutoPlay.emitTemplateState(
            template: aTemplate,
            templateState: .didappear,
            animated: animated
        )
    }

    func templateWillDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        HybridAutoPlay.emitTemplateState(
            template: aTemplate,
            templateState: .willdisappear,
            animated: animated
        )
    }

    func templateDidDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        HybridAutoPlay.emitTemplateState(
            template: aTemplate,
            templateState: .diddisappear,
            animated: animated
        )
    }
}
