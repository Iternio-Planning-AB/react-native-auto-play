//
//  DashboardSceneDelegate.swift
//
//  Created by Manuel Auer on 28.09.25.
//

import CarPlay
import UIKit

@objc(DashboardSceneDelegate)
class DashboardSceneDelegate: AutoPlayScene,
    CPTemplateApplicationDashboardSceneDelegate
{
    var dashboardController: CPDashboardController?
    var templateApplicationDashboardScene: CPTemplateApplicationDashboardScene?

    override init() {
        super.init(moduleName: SceneStore.dashboardModuleName)
    }

    func templateApplicationDashboardScene(
        _ templateApplicationDashboardScene:
            CPTemplateApplicationDashboardScene,
        didConnect dashboardController: CPDashboardController,
        to window: UIWindow
    ) {
        self.window = window
        self.dashboardController = dashboardController
        self.templateApplicationDashboardScene =
            templateApplicationDashboardScene
        self.traitCollection =
            templateApplicationDashboardScene.dashboardWindow
            .traitCollection

        let props: [String: Any] = [
            "colorScheme": traitCollection
                .userInterfaceStyle == .dark ? "dark" : "light",
            "window": [
                // TODO: height & with reported from main screen it seems...
                "height": window.screen.bounds.size.height,
                "width": window.screen.bounds.size.width,
                "scale": traitCollection.displayScale,
            ],
        ]

        connect(props: props)
        HybridCarPlayDashboard.emit(event: .didconnect)
    }

    func templateApplicationDashboardScene(
        _ templateApplicationDashboardScene:
            CPTemplateApplicationDashboardScene,
        didDisconnectDashboardController dashboardController:
            CPDashboardController,
        from window: UIWindow
    ) {
        disconnect()
        HybridCarPlayDashboard.emit(event: .diddisconnect)

        self.dashboardController = nil
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

    @MainActor
    func setButtons(buttons: [NitroCarPlayDashboardButton]) {
        guard
            let traitCollection = templateApplicationDashboardScene?
                .dashboardWindow.traitCollection
        else { return }

        dashboardController?.shortcutButtons = buttons.map { button in
            CPDashboardButton(
                titleVariants: button.titleVariants,
                subtitleVariants: button.subtitleVariants,
                image: SymbolFont.imageFromNitroImage(
                    image: button.image,
                    traitCollection: traitCollection
                )!
            ) { _ in
                button.onPress()
            }
        }
    }

    override func traitCollectionDidChange(traitCollection: UITraitCollection) {
        super.traitCollectionDidChange(traitCollection: traitCollection)
        HybridCarPlayDashboard.emitColorScheme(
            colorScheme: traitCollection.userInterfaceStyle == .dark
                ? .dark : .light
        )
    }
}
