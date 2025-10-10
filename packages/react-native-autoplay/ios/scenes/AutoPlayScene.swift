//
//  AutoPlayScene.swift
//  Pods
//
//  Created by Manuel Auer on 02.10.25.
//

import CarPlay

class AutoPlayScene: UIResponder {
    public private(set) var state: VisibilityState = .diddisappear

    var initialProperties: [String: Any] = [:]
    var moduleName: String?
    var window: UIWindow?
    var isConnected = false
    var interfaceController: CPInterfaceController?
    var templateStore = TemplateStore()

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
        }
    }

    func disconnect() {
        self.window = nil
        isConnected = false

        guard let moduleName = self.moduleName else {
            return
        }

        SceneStore.removeScene(moduleName: moduleName)
    }

    func setState(state: VisibilityState) {
        self.state = state

        guard let moduleName = self.moduleName else {
            return
        }

        HybridAutoPlay.emitRenderState(
            mapTemplateId: moduleName,
            state: state
        )
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
}
