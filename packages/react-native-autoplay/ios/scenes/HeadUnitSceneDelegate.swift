//
//  HeadunitSceneDelegate.swift
//
//  Created by Manuel Auer on 28.09.25.
//

import CarPlay
import Foundation

@objc(HeadUnitSceneDelegate)
class HeadUnitSceneDelegate: AutoPlayScene, CPTemplateApplicationSceneDelegate {
    override init() {
        super.init(moduleName: SceneStore.rootModuleName)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController,
        to window: CPWindow
    ) {
        self.window = window
        self.interfaceController = AutoPlayInterfaceController(
            interfaceController: interfaceController
        )

        let props: [String: Any] = [
            "colorScheme": interfaceController.carTraitCollection
                .userInterfaceStyle == .dark ? "dark" : "light",
            "window": [
                "height": window.bounds.size.height.rounded(),
                "width": window.bounds.size.width.rounded(),
                "scale": window.screen.scale.rounded(),
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

        let mapTemplate =
            TemplateStore.getTemplate(templateId: SceneStore.rootModuleName)
            as? MapTemplate
        mapTemplate?.stopNavigation()
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
