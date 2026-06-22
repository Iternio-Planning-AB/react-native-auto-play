//
//  AutoPlayInterfaceController.swift
//  Pods
//
//  Created by Manuel Auer on 12.10.25.
//

import CarPlay

@MainActor
class AutoPlayInterfaceController: NSObject, CPInterfaceControllerDelegate {
    let interfaceController: CPInterfaceController

    /// `CPMapTemplate` exposes no way to inspect its panel stack (only push/pop operations),
    /// so this mirrors the combined logical navigation stack of regular pushed templates and
    /// panels pushed onto a `CPMapTemplate`, in push order, to know what `popTemplate` etc.
    /// need to pop next.
    private enum NavigationEntry {
        case template(id: String)
        case panel(id: String, mapTemplate: CPMapTemplate)

        var id: String {
            switch self {
            case .template(let id): return id
            case .panel(let id, _): return id
            }
        }
    }

    private var navigationStack: [NavigationEntry] = []

    init(
        interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController

        super.init()

        self.interfaceController.delegate = self
    }

    var carTraitCollection: UITraitCollection {
        return interfaceController.carTraitCollection
    }

    var rootTemplate: CPTemplate {
        interfaceController.rootTemplate
    }

    var templates: [CPTemplate] {
        interfaceController.templates
    }

    var rootTemplateId: String? {
        return interfaceController.rootTemplate.id
    }

    func pushTemplate(
        _ templateToPush: CPTemplate,
        animated: Bool
    ) async throws -> Bool {
        let result = try await interfaceController.pushTemplate(
            templateToPush,
            animated: animated
        )

        navigationStack.append(.template(id: templateToPush.id))

        return result
    }

    /// Pushes `panel` onto the current root template, which must already be a `CPMapTemplate`
    /// (e.g. a `MapTemplate` previously set via `setRootTemplate`).
    @available(iOS 27.0, *)
    func pushPanel(
        _ panel: CPMapPanel,
        templateId: String
    ) async throws {
        guard let mapTemplate = rootTemplate as? CPMapTemplate else {
            throw AutoPlayError.rootTemplateNotMapTemplate(
                "\(templateId) has mapConfig set, which requires the root template to be a CPMapTemplate"
            )
        }

        try await withCheckedThrowingContinuation {
            (continuation: CheckedContinuation<Void, Error>) in
            mapTemplate.pushPanel(panel) { _, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                continuation.resume()
            }
        }

        navigationStack.append(.panel(id: templateId, mapTemplate: mapTemplate))
    }

    func setRootTemplate(
        _ rootTemplate: CPTemplate,
        animated: Bool
    ) async throws -> Bool {
        let result = try await interfaceController.setRootTemplate(
            rootTemplate,
            animated: animated
        )

        // TODO: check if we need to hide any panels or if setRootTemplate handles this

        navigationStack = [.template(id: rootTemplate.id)]

        return result
    }

    /// Whether `templateId` is the top entry of the combined template/panel navigation stack.
    func isTopEntry(templateId: String) -> Bool {
        return navigationStack.last?.id == templateId
    }

    /// Removes the navigation-stack entry for `templateId` if present; idempotent if it's
    /// already gone. For `.template` entries, `popTopEntry` removes the entry directly for
    /// app-initiated pops, and `templateDidDisappear` calls this for CarPlay-initiated pops
    /// (e.g. its built-in back button) that `popTopEntry` never sees. For `.panel` entries,
    /// `popTopEntry` doesn't touch `navigationStack` at all — `CPMapPanelDelegate.panelDidHide`
    /// calling this is the only place a panel entry is removed, covering both app-initiated
    /// and CarPlay-initiated pops alike.
    func removeNavigationEntryIfPresent(templateId: String) {
        navigationStack.removeAll { $0.id == templateId }
    }

    /// Ids of all panel entries currently in the navigation stack, in push order. `navigationStack`
    /// itself is private, so this is the minimal data `CPMapPanelDelegate` callbacks need to
    /// simulate cover/reveal lifecycle events themselves — `CPMapPanelDelegate` has no
    /// equivalent of `CPInterfaceControllerDelegate` telling a covered/revealed panel about it.
    @available(iOS 27.0, *)
    var panelTemplateIds: [String] {
        navigationStack.compactMap { entry in
            if case .panel(let id, _) = entry { return id }
            return nil
        }
    }

    /// Whether any panel exists in the stack, even if currently covered by a regular template.
    @available(iOS 27.0, *)
    var hasPanel: Bool {
        !panelTemplateIds.isEmpty
    }

    func popTemplate(
        animated: Bool
    ) async throws -> String? {
        return try await popTopEntry(animated: animated)
    }

    /// Pops whatever is on top of the combined navigation stack: a regular pushed template via
    /// `CPInterfaceController.popTemplate`, or a panel via `CPMapTemplate.popPanelWithCompletion`.
    private func popTopEntry(animated: Bool) async throws -> String? {
        // Ensure at least one entry (the root) remains
        guard navigationStack.count > 1, let top = navigationStack.last else { return nil }

        switch top {
        case .template(let templateId):
            try await interfaceController.popTemplate(animated: animated)

            try RootModule.withTemplateStore { templateStore in
                templateStore.removeTemplate(templateId: templateId)
            }

            removeNavigationEntryIfPresent(templateId: templateId)

            return templateId

        case .panel(let templateId, let mapTemplate):
            guard #available(iOS 27.0, *) else { return nil }
            
            try await mapTemplate.popPanel()
            
            return templateId
        }
    }

    func popToRootTemplate(
        animated: Bool
    ) async throws -> [String] {
        guard navigationStack.count > 1 else { return [] }

        let entriesToPop = Array(navigationStack.dropFirst())
        let poppedIds = entriesToPop.map { $0.id }

        if entriesToPop.contains(where: {
            if case .template = $0 { return true }
            return false
        }) {
            try await interfaceController.popToRootTemplate(animated: animated)
        }

        let panelTemplates = entriesToPop.compactMap({ entry in
            if case .panel = entry { return entry.id }
            return nil
        })

        if !panelTemplates.isEmpty, #available(iOS 27.0, *) {
            for templateId in panelTemplates {
                try? RootModule.withAutoPlayTemplate(templateId: templateId) {
                    (template: AutoPlayTemplate) in
                    template.onWillDisappear(animated: animated)
                }
            }

            try await RootModule.withInterfaceController { interfaceController in
                let mapTemplate = interfaceController.rootTemplate as? CPMapTemplate
                try await mapTemplate?.hidePanel()
            }

            for entry in entriesToPop {
                // mapTemplate?.hidePanel() does not invoke panelDidHide on AutoPlayMapPanelDelegate so we need to do this manually here, TODO: check on later releases if this is fixed
                guard case .panel(let templateId, _) = entry else { continue }
                try? RootModule.withAutoPlayTemplate(templateId: templateId) {
                    (template: AutoPlayTemplate) in
                    template.onDidDisappear(animated: animated)
                }
            }
        }

        try RootModule.withTemplateStore { templateStore in
            templateStore.removeTemplates(templateIds: poppedIds)
        }

        navigationStack = Array(navigationStack.prefix(1))

        return poppedIds
    }

    func popToTemplate(templateId: String, animated: Bool) async throws
        -> [String]
    {
        guard navigationStack.contains(where: { $0.id == templateId }) else {
            return []
        }

        var poppedIds: [String] = []

        while navigationStack.last?.id != templateId {
            guard let poppedId = try await popTopEntry(animated: animated) else {
                break
            }
            poppedIds.append(poppedId)
        }

        return poppedIds
    }

    func presentTemplate(
        _ templateToPresent: CPTemplate,
        animated: Bool
    ) async throws -> Bool {
        return try await interfaceController.presentTemplate(
            templateToPresent,
            animated: animated
        )
    }

    func dismissTemplate(
        animated: Bool
    ) async throws -> Bool {
        if interfaceController.presentedTemplate == nil {
            return false
        }

        try await interfaceController.dismissTemplate(
            animated: animated
        )

        return true
    }

    // MARK: CPInterfaceControllerDelegate
    func templateWillAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        try? RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: AutoPlayTemplate) in
            template.onWillAppear(
                animated: animated
            )
        }

        // Panels only attach to root, so only relevant when root reappears. The covering
        // entry hasn't been removed from navigationStack yet, so the revealed panel is one
        // before .last, not .last itself.
        if #available(iOS 27.0, *), templateId == rootTemplateId,
            let previous = navigationStack.dropLast().last,
            case .panel(let panelId, _) = previous
        {
            try? RootModule.withAutoPlayTemplate(templateId: panelId) {
                (template: AutoPlayTemplate) in
                template.onWillAppear(animated: animated)
                template.onDidAppear(animated: animated)
            }
        }
    }

    func templateDidAppear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        try? RootModule.withAutoPlayTemplate(
            templateId: templateId,
            perform: { (template: AutoPlayTemplate) in
                template.onDidAppear(
                    animated: animated
                )
            }
        )
    }

    func templateWillDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        try? RootModule.withAutoPlayTemplate(
            templateId: templateId,
            perform: {
                (template: AutoPlayTemplate)
                in
                template.onWillDisappear(
                    animated: animated
                )
            }
        )

        // Panels only attach to root, so only relevant when root is covered by a new push.
        // The new entry hasn't been appended to navigationStack yet, so .last is still the
        // panel being covered.
        if #available(iOS 27.0, *), templateId == rootTemplateId,
            let last = navigationStack.last,
            case .panel(let panelId, _) = last
        {
            try? RootModule.withAutoPlayTemplate(templateId: panelId) {
                (template: AutoPlayTemplate) in
                template.onWillDisappear(animated: animated)
                template.onDidDisappear(animated: animated)
            }
        }
    }

    func templateDidDisappear(
        _ aTemplate: CPTemplate,
        animated: Bool
    ) {
        let templateId = aTemplate.id

        try? RootModule.withAutoPlayTemplate(
            templateId: templateId,
            perform: { (template: AutoPlayTemplate) in
                template.onDidDisappear(
                    animated: animated
                )
            }
        )

        /// this makes sure onPopped for templates is only invoked when they are gone forever
        /// in case the template is just hidden by some other template it will not fire
        /// since CPAlertTemplate is presented and nothing can be pushed on top of it there is no special handling required
        guard !interfaceController.templates.contains(where: { $0.id == templateId }) else {
            return
        }

        removeNavigationEntryIfPresent(templateId: templateId)

        try? RootModule.withTemplateStore { templateStore in
            templateStore.removeTemplate(templateId: templateId)
        }

        HybridAutoPlay.removeListeners(
            templateId: templateId
        )
    }
}
