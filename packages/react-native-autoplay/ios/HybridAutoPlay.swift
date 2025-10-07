import CarPlay
import NitroModules

class HybridAutoPlay: HybridAutoPlaySpec {
    private static var listeners = [EventName: [String: () -> Void]]()
    private static var templateStateListeners = [
        String: [(TemplateEventPayload) -> Void]
    ]()
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

    func addListenerTemplateState(
        templateId: String,
        callback: @escaping (TemplateEventPayload) -> Void
    ) throws -> () -> Void {
        if HybridAutoPlay.templateStateListeners[templateId] != nil {
            HybridAutoPlay.templateStateListeners[templateId]?.append(callback)
        } else {
            HybridAutoPlay.templateStateListeners[templateId] = [callback]
        }

        return {
            HybridAutoPlay.templateStateListeners[templateId]?.removeAll {
                $0 as AnyObject === callback as AnyObject
            }
            if HybridAutoPlay.templateStateListeners[templateId]?.isEmpty
                ?? false
            {
                HybridAutoPlay.templateStateListeners.removeValue(
                    forKey: templateId
                )
            }
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

    func createMapTemplate(config: NitroMapTemplateConfig) throws -> () -> Void
    {
        let removeTemplateStateListener = try? addListenerTemplateState(
            templateId: config.id
        ) { state in
            switch state.state {
            case .willappear:
                config.onWillAppear?(state.animated)
            case .didappear:
                config.onDidAppear?(state.animated)
            case .willdisappear:
                config.onWillDisappear?(state.animated)
            case .diddisappear:
                config.onDidDisappear?(state.animated)
            }
        }

        let template = MapTemplate(config: config)
        TemplateStore.addTemplate(template: template, templateId: config.id)

        return {
            removeTemplateStateListener?()
            TemplateStore.removeTemplate(templateId: config.id)
        }
    }

    func setRootTemplate(templateId: String) throws -> Promise<String?> {
        guard
            let template = TemplateStore.getCPTemplate(
                templateId: templateId
            ),
            let scene = SceneStore.getScene(
                moduleName: SceneStore.rootModuleName
            ),
            let interfaceController = scene.interfaceController
        else {
            return Promise.async {
                return
                    "Failed to set root template: Template or scene or interfaceController not found, did you call a craeteXXXTemplate function?"
            }

        }

        return Promise.async {
            if template is CPMapTemplate {
                await MainActor.run {
                    scene.initRootView()
                }
            }

            do {
                try await interfaceController.setRootTemplate(
                    template,
                    animated: false
                )
            } catch (let error) {
                return "Failed to set root template: \(error)"
            }

            return nil
        }
    }

    func setTemplateMapButtons(templateId: String, buttons: [NitroMapButton]?) throws {
        guard
            let mapTemplate = TemplateStore.getTemplate(templateId: templateId)
                as? MapTemplate
        else {
            throw TemplateError.templateNotFound(templateId)
        }

        mapTemplate.config.mapButtons = buttons
        mapTemplate.invalidate()
    }

    func setTemplateActions(templateId: String, actions: [NitroAction]?) throws {
        guard let template = TemplateStore.getTemplate(templateId: templateId)
        else {
            throw TemplateError.templateNotFound(templateId)
        }
    
        // TODO: this must be more generic
        if let template = template as? MapTemplate {
            template.config.actions = actions
            template.invalidate()
        }
    }

    static func emit(event: EventName) {
        HybridAutoPlay.listeners[event]?.values.forEach {
            $0()
        }
    }

    static func emitTemplateState(
        template: CPTemplate,
        templateState: VisibilityState,
        animated: Bool
    ) {
        guard let userInfo = template.userInfo as? [String: Any],
            let templateId = userInfo["id"] as? String
        else {
            return
        }

        let payload = TemplateEventPayload(
            animated: animated,
            state: templateState
        )

        HybridAutoPlay.templateStateListeners[templateId]?.forEach { callback in
            callback(payload)
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
}
