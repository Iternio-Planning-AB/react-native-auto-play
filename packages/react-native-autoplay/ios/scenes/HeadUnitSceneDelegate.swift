//
//  HeadunitSceneDelegate.swift
//
//  Created by Manuel Auer on 28.09.25.
//

import CarPlay
import Foundation

@objc(HeadUnitSceneDelegate)
class HeadUnitSceneDelegate: AutoPlayScene, CPTemplateApplicationSceneDelegate {
    private var sessionId: Int?

    override init() {
        super.init(moduleName: SceneStore.rootModuleName)
    }

    private func startSession() {
        let sessionId = SceneStore.startRootSession()
        self.sessionId = sessionId
        HybridAutoPlay.emit(event: .didconnect, sessionId: sessionId)
    }

    private func endSession() {
        guard let sessionId = sessionId else { return }
        self.sessionId = nil
        SceneStore.endRootSession(sessionId: sessionId)
        HybridAutoPlay.emit(event: .diddisconnect, sessionId: sessionId)
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

        stopStaleNavigationOnConnect()
        connect(props: props)
        startSession()
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = AutoPlayInterfaceController(
            interfaceController: interfaceController
        )

        connect(props: [
            "colorScheme": interfaceController.carTraitCollection
                .userInterfaceStyle == .dark ? "dark" : "light"
        ])
        startSession()
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnect interfaceController: CPInterfaceController,
        from window: CPWindow
    ) {
        stopNavigationOnDisconnect()
        disconnect()
        endSession()
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController:
            CPInterfaceController
    ) {
        disconnect()
        endSession()
    }

    private var rootMapTemplate: MapTemplate? {
        return try? templateStore.getTemplate(
            templateId: SceneStore.rootModuleName
        ) as? MapTemplate
    }

    /// a session that is not finished on disconnect stays active on the CarPlay side and can make
    /// the session start after the next connect fail
    private func stopNavigationOnDisconnect() {
        rootMapTemplate?.stopNavigation()
    }

    /// the scene can connect again without a disconnect in between (e.g. after the app was in the
    /// background), a session left over from before would make the next session start fail
    private func stopStaleNavigationOnConnect() {
        if let mapTemplate = rootMapTemplate, mapTemplate.isNavigationSessionActive {
            mapTemplate.stopNavigation()
        }
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
