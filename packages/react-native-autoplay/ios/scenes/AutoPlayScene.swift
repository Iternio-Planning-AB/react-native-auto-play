//
//  AutoPlayScene.swift
//  Pods
//
//  Created by Manuel Auer on 02.10.25.
//

import CarPlay

#if RCT_NEW_ARCH_ENABLED
    import React
#endif

class AutoPlayScene: UIResponder {
    var initialProperties: [String: Any] = [:]
    var moduleName: String?
    var window: UIWindow?
    var isConnected = false
    var interfaceController: AutoPlayInterfaceController?
    var templateStore = TemplateStore()
    var traitCollection = UIScreen.main.traitCollection
    var safeAreaInsets = UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)

    override init() {}

    init(moduleName: String) {
        self.moduleName = moduleName
        initialProperties["id"] = moduleName

        super.init()

        SceneStore.addScene(moduleName: moduleName, scene: self)
    }

    func connect(props: [String: Any]) {
        isConnected = true

        initialProperties = initialProperties.merging(props) { current, _ in
            current
        }

        if let window = self.window {
            ViewUtils.showLaunchScreen(window: window)
            safeAreaInsets = window.safeAreaInsets
        }
    }

    func disconnect() {
        #if RCT_NEW_ARCH_ENABLED
            if let rootView = self.window?.rootViewController?.view
                as? RCTSurfaceHostingProxyRootView
            {
                rootView.surface.stop()
            }
        #else
            if let rootView = self.window?.rootViewController?.view
                as? RCTRootView
            {
                if let contentView = rootView.contentView as? RCTInvalidating {
                    contentView.invalidate()
                }
            }
        #endif

        self.window = nil
        isConnected = false

        guard let moduleName = self.moduleName else {
            return
        }

        SceneStore.removeScene(moduleName: moduleName)
    }

    func setState(state: VisibilityState) {
        guard let moduleName = self.moduleName else {
            return
        }

        SceneStore.setState(moduleName: moduleName, state: state)
    }

    func initRootView() {
        DispatchQueue.main.async {
            guard let window = self.window else {
                return
            }
            guard let moduleName = self.moduleName else {
                return
            }

            guard
                let rootView = ViewUtils.getRootView(
                    moduleName: moduleName,
                    initialProps: self.initialProperties
                )
            else { return }

            window.rootViewController = AutoPlaySceneViewController(
                view: rootView,
                moduleName: moduleName
            )
            window.makeKeyAndVisible()
        }
    }

    open func traitCollectionDidChange(traitCollection: UITraitCollection) {
        self.traitCollection = traitCollection
        TemplateStore.traitCollectionDidChange()
    }

    open func safeAreaInsetsDidChange(safeAreaInsets: UIEdgeInsets) {
        self.safeAreaInsets = safeAreaInsets
        HybridAutoPlay.emitSafeAreaInsets(
            moduleName: moduleName!,
            safeAreaInsets: safeAreaInsets
        )
    }
}
