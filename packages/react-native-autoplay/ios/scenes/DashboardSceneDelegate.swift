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
    override init() {
        super.init(moduleName: "AutoPlayDashboard")
    }
    
    func templateApplicationDashboardScene(
        _ templateApplicationDashboardScene:
            CPTemplateApplicationDashboardScene,
        didConnect dashboardController: CPDashboardController,
        to window: UIWindow
    ) {
        self.window = window
        
        let props: [String: Any] = [
            "colorScheme": window.screen.traitCollection
                .userInterfaceStyle == .dark ? "dark" : "light",
            "window": [
                "height": window.screen.bounds.size.height,
                "width": window.screen.bounds.size.width,
                "scale": window.screen.scale,
            ],
        ]
        
        connect(props: props)
        // RNCarPlay.connect(withDashboardController: dashboardController, window: window)
    }

    func templateApplicationDashboardScene(
        _ templateApplicationDashboardScene:
            CPTemplateApplicationDashboardScene,
        didDisconnectDashboardController dashboardController:
            CPDashboardController,
        from window: UIWindow
    ) {
        disconnect()
        // RNCarPlay.disconnectFromDashboardController()
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
