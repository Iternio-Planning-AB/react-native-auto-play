import CarPlay
import NitroModules

struct StateListener {
    let id: UUID
    let callback: () -> Void
}

struct RenderStateListener {
    let id: UUID
    let callback: (VisibilityState) -> Void
}

struct SafeAreaListener {
    let id: UUID
    let callback: (SafeAreaInsets) -> Void
}

class HybridAutoPlay: HybridAutoPlaySpec {
    private static var listeners = [EventName: [StateListener]]()
    private static var renderStateListeners = [String: [RenderStateListener]]()
    private static var safeAreaInsetsListeners = [String: [SafeAreaListener]]()

    func addListener(eventType: EventName, callback: @escaping () -> Void)
        throws -> () -> Void
    {
        let listener = StateListener(id: UUID(), callback: callback)

        HybridAutoPlay.listeners[eventType, default: []].append(listener)

        if eventType == .didconnect && SceneStore.isRootModuleConnected() {
            callback()
        }

        return {
            HybridAutoPlay.listeners[eventType]?.removeAll {
                $0.id == listener.id
            }
            if HybridAutoPlay.listeners[eventType]?.isEmpty ?? false {
                HybridAutoPlay.listeners.removeValue(forKey: eventType)
            }
        }
    }

    func addListenerRenderState(
        moduleName: String,
        callback: @escaping (VisibilityState) -> Void
    ) throws -> () -> Void {
        let listener = RenderStateListener(id: UUID(), callback: callback)

        HybridAutoPlay.renderStateListeners[moduleName, default: []].append(
            listener
        )

        if let state = SceneStore.getState(moduleName: moduleName) {
            callback(state)
        }

        return {
            HybridAutoPlay.renderStateListeners[moduleName]?.removeAll {
                $0.id == listener.id
            }
            if HybridAutoPlay.renderStateListeners[moduleName]?.isEmpty
                ?? false
            {
                HybridAutoPlay.renderStateListeners.removeValue(
                    forKey: moduleName
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
        let listener = SafeAreaListener(id: UUID(), callback: callback)

        HybridAutoPlay.safeAreaInsetsListeners[moduleName, default: []].append(
            listener
        )

        if let safeAreaInsets = SceneStore.getScene(moduleName: moduleName)?
            .safeAreaInsets
        {
            let insets = HybridAutoPlay.getSafeAreaInsets(
                safeAreaInsets: safeAreaInsets
            )
            callback(insets)
        }

        return {
            HybridAutoPlay.safeAreaInsetsListeners[moduleName]?.removeAll {
                $0.id == listener.id
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
            guard
                let template = TemplateStore.getTemplate(
                    templateId: templateId
                )
            else {
                throw AutoPlayError.templateNotFound(templateId)
            }

            try await RootModule.withSceneAndInterfaceController {
                scene,
                interfaceController in
                let carPlayTemplate = template.getTemplate()
                
                if carPlayTemplate is CPMapTemplate {
                    await MainActor.run {
                        scene.initRootView()
                    }
                }

                await template.invalidate()

                let _ = try await interfaceController.setRootTemplate(
                    carPlayTemplate,
                    animated: false
                )
            }
        }
    }

    func pushTemplate(templateId: String) throws
        -> NitroModules.Promise<Void>
    {
        return Promise.async {
            guard
                let template = TemplateStore.getTemplate(
                    templateId: templateId
                )
            else {
                throw AutoPlayError.templateNotFound(templateId)
            }

            await template.invalidate()

            return try await RootModule.withInterfaceController {
                interfaceController in
                
                let carPlayTemplate = template.getTemplate()
                
                if carPlayTemplate is CPAlertTemplate {
                    let animated = try await
                        !interfaceController.dismissTemplate(
                            animated: false
                        )

                    let _ = try await interfaceController.presentTemplate(
                        carPlayTemplate,
                        animated: animated
                    )
                } else {
                    let _ = try await interfaceController.pushTemplate(
                        carPlayTemplate,
                        animated: true
                    )
                }

                if let autoDismissMs = TemplateStore.getTemplate(
                    templateId: templateId
                )?.autoDismissMs {
                    Task { @MainActor in
                        try await Task.sleep(
                            nanoseconds: UInt64(autoDismissMs) * 1_000_000
                        )

                        if interfaceController.topTemplateId == templateId
                            || interfaceController.interfaceController
                                .presentedTemplate?.id == templateId
                        {
                            try await self.popTemplate(animate: true).await()
                        }
                    }
                }
            }
        }
    }

    func popTemplate(animate: Bool?) throws -> NitroModules.Promise<Void> {
        return Promise.async {
            return try await RootModule.withInterfaceController {
                interfaceController in

                if try await interfaceController.dismissTemplate(
                    animated: animate ?? true
                ) {
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

    func popToRootTemplate(animate: Bool?) throws -> NitroModules.Promise<Void>
    {
        return Promise.async {
            try await RootModule.withInterfaceController {
                interfaceController in

                let hasPresentedTemplate =
                    try await interfaceController.dismissTemplate(
                        animated: false
                    )

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

    func popToTemplate(templateId: String, animate: Bool?) throws -> Promise<
        Void
    > {
        return Promise.async {
            return try await RootModule.withInterfaceController {
                interfaceController in

                let _ = try await interfaceController.dismissTemplate(
                    animated: animate ?? true
                )

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
    func setTemplateHeaderActions(
        templateId: String,
        headerActions: [NitroAction]?
    ) throws -> Promise<Void> {
        return Promise.async {
            try await MainActor.run {
                guard
                    var template = TemplateStore.getTemplate(
                        templateId: templateId
                    ) as? AutoPlayHeaderProviding
                else {
                    throw AutoPlayError.invalidTemplateType(
                        "\(templateId) does not support header actions"
                    )
                }
                template.barButtons = headerActions
            }
        }
    }

    // MARK: events
    static func emit(event: EventName) {
        HybridAutoPlay.listeners[event]?.forEach { listener in
            listener.callback()
        }
    }

    static func emitRenderState(moduleName: String, state: VisibilityState) {
        HybridAutoPlay.renderStateListeners[moduleName]?.forEach {
            listener in
            listener.callback(state)
        }
    }

    static func emitSafeAreaInsets(
        moduleName: String,
        safeAreaInsets: UIEdgeInsets
    ) {
        let insets = HybridAutoPlay.getSafeAreaInsets(
            safeAreaInsets: safeAreaInsets
        )
        HybridAutoPlay.safeAreaInsetsListeners[moduleName]?.forEach {
            listener in listener.callback(insets)
        }
    }

    static func removeListeners(templateId: String) {
        HybridAutoPlay.renderStateListeners.removeValue(forKey: templateId)
        HybridAutoPlay.safeAreaInsetsListeners.removeValue(forKey: templateId)
    }

    static func getSafeAreaInsets(safeAreaInsets: UIEdgeInsets)
        -> SafeAreaInsets
    {
        return SafeAreaInsets(
            top: safeAreaInsets.top,
            left: safeAreaInsets.left,
            bottom: safeAreaInsets.bottom,
            right: safeAreaInsets.right,
            isLegacyLayout: nil
        )
    }
}
