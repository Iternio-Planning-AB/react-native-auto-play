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
        guard
            let rootViewController = UIApplication.shared.delegate?.window??
                .rootViewController
        else { return }

        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = rootViewController
        window.makeKeyAndVisible()

        self.window = window

        if let url = connectionOptions.urlContexts.first?.url {
            // Linking API -> on app start
            NitroLinkingManager.shared().launchURL = url
        }

        if let userActivity = connectionOptions.userActivities.first(where: {
            userActivity in
            userActivity.webpageURL != nil
        }) {
            // Universal Links -> on app start
            NitroLinkingManager.shared().launchURL = userActivity.webpageURL
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
