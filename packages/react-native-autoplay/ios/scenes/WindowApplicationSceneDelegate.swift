//
//  WindowApplicationSceneDelegate.swift
//  ABRP
//
//  Created by Manuel Auer on 28.09.25.
//

import Foundation
import UIKit

@objc(WindowApplicationSceneDelegate)
class WindowApplicationSceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard session.role == .windowApplication else { return }
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        self.window = window

        /// the URL is passed on to React Native as well, but it only reaches JS when this call
        /// starts the React instance, not when a CarPlay scene started it already - the linking
        /// manager below covers that case
        AutoPlayReactHost.shared().startMain(
            in: window,
            connectionOptions: connectionOptions
        )

        if let urlContext = connectionOptions.urlContexts.first {
            // Linking API -> on app start
            NitroLinkingManager.shared().openURL(urlContext)
        }

        if let userActivity = connectionOptions.userActivities.first(where: {
            userActivity in
            userActivity.webpageURL != nil
        }) {
            // Universal Links -> on app start
            NitroLinkingManager.shared().continue(userActivity)
        }
    }

    func scene(
        _ scene: UIScene,
        openURLContexts URLContexts: Set<UIOpenURLContext>
    ) {
        // Linking API -> app already running
        guard let urlContext = URLContexts.first else { return }
        NitroLinkingManager.shared().openURL(urlContext)
    }

    func scene(
        _ scene: UIScene,
        continue userActivity: NSUserActivity
    ) {
        // Universal Links -> app already running
        NitroLinkingManager.shared().continue(userActivity)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        SceneStore.setState(
            moduleName: SceneStore.windowSceneModuleName,
            state: .didappear
        )
    }

    func sceneWillResignActive(_ scene: UIScene) {
        SceneStore.setState(
            moduleName: SceneStore.windowSceneModuleName,
            state: .willdisappear
        )
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        SceneStore.setState(
            moduleName: SceneStore.windowSceneModuleName,
            state: .willappear
        )
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        SceneStore.setState(
            moduleName: SceneStore.windowSceneModuleName,
            state: .diddisappear
        )
    }
}
