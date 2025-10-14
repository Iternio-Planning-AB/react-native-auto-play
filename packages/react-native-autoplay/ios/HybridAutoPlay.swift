import CarPlay
import NitroModules

class HybridAutoPlay: HybridAutoPlaySpec {
    private static var listeners = [EventName: [String: () -> Void]]()
    private static var renderStateListeners = [
        String: [(VisibilityState) -> Void]
    ]()
    private static var safeAreaInsetsListeners = [
        String: [(SafeAreaInsets) -> Void]
    ]()

    func addListener(eventType: EventName, callback: @escaping () -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        HybridAutoPlay.listeners[eventType, default: [:]][uuid] = callback

        if eventType == .didconnect && SceneStore.isRootModuleConnected() {
            callback()
        }

        return {
            HybridAutoPlay.listeners[eventType]?.removeValue(forKey: uuid)
        }
    }

    func addListenerRenderState(
        mapTemplateId: String,
        callback: @escaping (VisibilityState) -> Void
    ) throws -> () -> Void {
        if HybridAutoPlay.renderStateListeners[mapTemplateId] != nil {
            HybridAutoPlay.renderStateListeners[mapTemplateId]?.append(callback)
        } else {
            HybridAutoPlay.renderStateListeners[mapTemplateId] = [callback]
        }

        if let state = SceneStore.getState(moduleName: mapTemplateId) {
            callback(state)
        }

        return {
            HybridAutoPlay.renderStateListeners[mapTemplateId]?.removeAll {
                $0 as AnyObject === callback as AnyObject
            }
            if HybridAutoPlay.renderStateListeners[mapTemplateId]?.isEmpty
                ?? false
            {
                HybridAutoPlay.renderStateListeners.removeValue(
                    forKey: mapTemplateId
                )
            }
        }
    }

    func addSafeAreaInsetsListener(
        moduleName: String,
        callback: @escaping (SafeAreaInsets) -> Void
    ) throws -> () -> Void {
        if HybridAutoPlay.safeAreaInsetsListeners[moduleName] != nil {
            HybridAutoPlay.safeAreaInsetsListeners[moduleName]?.append(callback)
        } else {
            HybridAutoPlay.safeAreaInsetsListeners[moduleName] = [callback]
        }

        return {
            HybridAutoPlay.safeAreaInsetsListeners[moduleName]?.removeAll {
                $0 as AnyObject === callback as AnyObject
            }
            if HybridAutoPlay.safeAreaInsetsListeners[moduleName]?.isEmpty
                ?? false
            {
                HybridAutoPlay.safeAreaInsetsListeners.removeValue(
                    forKey: moduleName
                )
            }
        }
    }

    func createAlertTemplate(config: AlertTemplateConfig) throws {
        //TODO
    }

    func presentTemplate(templateId: String) throws {
        //TODO
    }

    func dismissTemplate(templateId: String) throws {
        //TODO
    }

    func createMapTemplate(config: MapTemplateConfig) throws {
        let template = MapTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func createListTemplate(config: ListTemplateConfig) throws {
        let template = ListTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateListTemplateSections(
        templateId: String,
        sections: [NitroSection]?
    ) throws {
        try RootModule.withScene { scene in
            if let template = scene.templateStore.getTemplate(
                templateId: templateId
            ) as? ListTemplate {
                template.updateSections(sections: sections)
            }
        }
    }

    func createGridTemplate(config: GridTemplateConfig) throws {
        let template = GridTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateGridTemplateButtons(
        templateId: String,
        buttons: [NitroGridButton]
    ) throws {
        try RootModule.withScene { scene in
            if let template = scene.templateStore.getTemplate(
                templateId: templateId
            ) as? GridTemplate {
                template.updateButtons(buttons: buttons)
            }
        }
    }

    func setRootTemplate(templateId: String) throws -> Promise<Void> {
        return Promise.async {
            try await RootModule.withSceneTemplateAndInterfaceController(
                templateId: templateId
            ) { template, scene, interfaceController in
                if template is CPMapTemplate {
                    await MainActor.run {
                        scene.initRootView()
                    }
                }

                let _ = try await interfaceController.setRootTemplate(
                    template,
                    animated: false
                )
            }
        }
    }

    func pushTemplate(templateId: String) throws
        -> NitroModules.Promise<Void>
    {
        return Promise.async {
            return try await RootModule.withTemplateAndInterfaceController(
                templateId: templateId
            ) { template, interfaceController in
                let _ = try await interfaceController.pushTemplate(
                    template,
                    animated: true
                )
            }
        }
    }

    func popTemplate() throws -> NitroModules.Promise<Void> {
        return Promise.async {
            return try await RootModule.withInterfaceController {
                interfaceController in
                guard
                    let templateId = try await interfaceController.popTemplate(
                        animated: true
                    )
                else { return }
                HybridAutoPlay.removeListeners(templateId: templateId)
            }
        }
    }

    func popToRootTemplate() throws -> NitroModules.Promise<Void> {
        return Promise.async {
            try await RootModule.withInterfaceController {
                interfaceController in
                let templateIds =
                    try await interfaceController.popToRootTemplate(
                        animated: true
                    )
                for templateId in templateIds {
                    HybridAutoPlay.removeListeners(templateId: templateId)
                }
            }
        }
    }

    func popToTemplate(templateId: String) throws -> Promise<Void> {
        return Promise.async {
            return try await RootModule.withInterfaceController {
                interfaceController in

                let templateIds = try await interfaceController.pop(
                    to: templateId,
                    animated: true
                )
                templateIds.forEach { templateId in
                    HybridAutoPlay.removeListeners(templateId: templateId)
                }
            }
        }
    }

    func setTemplateMapButtons(templateId: String, buttons: [NitroMapButton]?)
        throws
    {
        try RootModule.withTemplate(templateId: templateId) {
            template in
            guard let template = template as? MapTemplate else {
                return
            }

            template.config.mapButtons = buttons
            template.invalidate()
        }
    }

    func setTemplateActions(templateId: String, actions: [NitroAction]?) throws
    {
        try RootModule.withTemplate(templateId: templateId) {
            template in
            guard let template = template else { return }

            template.barButtons = actions
            template.setBarButtons()
        }
    }

    static func emit(event: EventName) {
        HybridAutoPlay.listeners[event]?.values.forEach {
            $0()
        }
    }

    static func emitRenderState(mapTemplateId: String, state: VisibilityState) {
        HybridAutoPlay.renderStateListeners[mapTemplateId]?.forEach {
            callback in
            callback(state)
        }
    }

    static func emitSafeAreaInsets(
        moduleName: String,
        safeAreaInsets: UIEdgeInsets
    ) {
        let insets = SafeAreaInsets(
            top: safeAreaInsets.top,
            left: safeAreaInsets.left,
            bottom: safeAreaInsets.bottom,
            right: safeAreaInsets.right,
            isLegacyLayout: nil
        )
        HybridAutoPlay.safeAreaInsetsListeners[moduleName]?.forEach {
            callback in callback(insets)
        }
    }

    static func removeListeners(templateId: String) {
        HybridAutoPlay.renderStateListeners.removeValue(forKey: templateId)
        HybridAutoPlay.safeAreaInsetsListeners.removeValue(forKey: templateId)
    }
}
