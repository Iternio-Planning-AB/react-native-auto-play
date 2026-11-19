//
//  AutoPlayScene.swift
//  Pods
//
//  Created by Manuel Auer on 02.10.25.
//

import CarPlay

class AutoPlayScene: UIResponder {
    var initialProperties: [String: Any] = [:]
    let moduleName: String
    var window: UIWindow?
    var isConnected = false
    var interfaceController: AutoPlayInterfaceController?
    var templateStore = TemplateStore()
    var traitCollection = UIScreen.main.traitCollection
    var safeAreaInsets = UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)

    override init() {
        fatalError(
            "init() should never be called - use init(moduleName: String) instead"
        )
    }

    /// passed to the host's `autoPlayNativeBackdrop(for:moduleName:)`
    var nativeBackdropDisplay: String { "root" }

    init(moduleName: String) {
        self.moduleName = moduleName
        initialProperties["id"] = moduleName

        super.init()

        AutoPlayReactHost.shared().start()
        SceneStore.addScene(moduleName: moduleName, scene: self)
    }

    func connect(props: [String: Any]) {
        isConnected = true

        initialProperties = initialProperties.merging(props) { current, _ in
            current
        }

        // Get trait collection from the CarPlay interface controller
        if let carTraitCollection = interfaceController?.interfaceController
            .carTraitCollection
        {
            self.traitCollection = carTraitCollection
        }

        if let window = self.window {
            ViewUtils.showLaunchScreen(window: window)
            safeAreaInsets = window.safeAreaInsets
        }
    }

    func disconnect() {
        NitroSurface.stop(self.window?.rootViewController?.view)
        self.window = nil
        isConnected = false

        templateStore.disconnect()
        SceneStore.removeScene(moduleName: moduleName, scene: self)
    }

    func setState(state: VisibilityState) {
        SceneStore.setState(moduleName: moduleName, state: state)
    }

    @MainActor
    func initRootView() throws {
        guard let window = self.window else {
            throw AutoPlayError.noUiWindow(
                "window nil for module: \(moduleName)"
            )
        }

        let reactView = AutoPlayReactHost.shared().view(
            moduleName: moduleName,
            initialProperties: self.initialProperties
        )

        var rootView = reactView
        if let backdrop = AutoPlayReactHost.shared().nativeBackdrop(
            display: nativeBackdropDisplay,
            moduleName: moduleName
        ) {
            rootView = ViewUtils.stack(reactView: reactView, onTopOf: backdrop)
        }

        window.rootViewController = AutoPlaySceneViewController(
            view: rootView,
            moduleName: moduleName
        )
        window.makeKeyAndVisible()
    }

    open func traitCollectionDidChange(traitCollection: UITraitCollection) {
        if self.traitCollection.userInterfaceStyle
            == traitCollection.userInterfaceStyle
        {
            return
        }
        self.traitCollection = traitCollection
        templateStore.traitCollectionDidChange()
    }

    open func safeAreaInsetsDidChange(safeAreaInsets: UIEdgeInsets) {
        self.safeAreaInsets = safeAreaInsets
        HybridAutoPlay.emitSafeAreaInsets(
            moduleName: moduleName,
            safeAreaInsets: safeAreaInsets
        )
    }
}
