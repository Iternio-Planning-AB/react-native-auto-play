import CarPlay
import NitroModules

class HybridAutoPlay: HybridHybridAutoPlaySpec {
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
    
    func isConnected() throws -> Bool {
        return SceneStore.isRootModuleConnected()
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

    // MARK: set/push/pop templates
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
                if template is CPAlertTemplate {
                    let _ = try await interfaceController.presentTemplate(
                        template,
                        animated: true
                    )
                } else {
                    let _ = try await interfaceController.pushTemplate(
                        template,
                        animated: true
                    )
                }
            }
        }
    }

    func popTemplate(animate: Bool?) throws -> NitroModules.Promise<Void> {
        return Promise.async {
            return try await RootModule.withInterfaceController {
                interfaceController in
                
                let hasPresentedTemplate = await interfaceController.hasPresentedTemplate()
                if (hasPresentedTemplate) {
                    let presentedTemplateId = try await interfaceController.dismissTemplate(animated: animate ?? true)
                    if (presentedTemplateId != nil) {
                        HybridAutoPlay.removeListeners(templateId: presentedTemplateId!)
                    }
                    return
                }
                
                guard
                    let templateId = try await interfaceController.popTemplate(
                        animated: true
                    )
                else { return }
                HybridAutoPlay.removeListeners(templateId: templateId)
            }
        }
    }

    func popToRootTemplate(animate: Bool?) throws -> NitroModules.Promise<Void> {
        return Promise.async {
            try await RootModule.withInterfaceController {
                interfaceController in
                
                let hasPresentedTemplate = await interfaceController.hasPresentedTemplate()
                if (hasPresentedTemplate) {
                    let presentedTemplateId = try await interfaceController.dismissTemplate(animated: false)
                    if (presentedTemplateId != nil) {
                        HybridAutoPlay.removeListeners(templateId: presentedTemplateId!)
                    }
                }
                
                let templateIds =
                    try await interfaceController.popToRootTemplate(
                        animated: !hasPresentedTemplate && (animate ?? true)
                    )
                for templateId in templateIds {
                    HybridAutoPlay.removeListeners(templateId: templateId)
                }
            }
        }
    }

    func popToTemplate(templateId: String, animate: Bool?) throws -> Promise<Void> {
        return Promise.async {
            return try await RootModule.withInterfaceController {
                interfaceController in
                
                let hasPresentedTemplate = await interfaceController.hasPresentedTemplate()
                if (hasPresentedTemplate) {
                    let presentedTemplateId = try await interfaceController.dismissTemplate(animated: animate ?? true)
                    if (presentedTemplateId != nil) {
                        HybridAutoPlay.removeListeners(templateId: presentedTemplateId!)
                    }
                }

                let templateIds = try await interfaceController.popToTemplate(
                    templateId: templateId,
                    animated: true
                )
                templateIds.forEach { templateId in
                    HybridAutoPlay.removeListeners(templateId: templateId)
                }
            }
        }
    }

    // MARK: generic template updates
    func setTemplateHeaderActions(templateId: String, headerActions: [NitroAction]?) throws
    {
        try RootModule.withTemplate(templateId: templateId) {
            template in
            template.barButtons = headerActions
            template.setBarButtons()
        }
    }

    // MARK: events
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
