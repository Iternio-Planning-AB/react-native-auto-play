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
