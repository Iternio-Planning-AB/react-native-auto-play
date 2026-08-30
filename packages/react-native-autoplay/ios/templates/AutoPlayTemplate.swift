//
//  Template.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//

import CarPlay

class AutoPlayTemplate: NSObject {
    public private(set) var autoDismissMs: Double?

    func getTemplate() throws -> CPTemplate {
        fatalError("getTemplate not implemented")
    }

    /// Templates that render as an overlay panel on an existing root `CPMapTemplate`
    /// (iOS 27+, e.g. `ListTemplate` with `mapConfig` set) override this to return their
    /// `CPMapPanel` instead of providing a `CPTemplate` via `getTemplate()`. Returned as `Any`
    /// since `CPMapPanel` is only available on iOS 27+ while this class supports iOS 15.1+.
    func getPanel() -> Any? {
        return nil
    }

    /// Header actions to apply to the root map template's bar while this template renders as
    /// a map panel (see `getPanel()`) — distinct from any `barButtons` used for a plain
    /// `CPTemplate`, since the panel itself has no nav bar of its own.
    func getPanelHeaderActions() -> [NitroAction]? {
        return nil
    }

    /// Map buttons to apply to the root map template while this renders as a map panel (see `getPanel()`).
    func getPanelMapButtons() -> [NitroMapButton]? {
        return nil
    }

    @MainActor final func invalidate() {
        if SceneStore.getRootScene() == nil {
            return
        }

        _invalidate()
    }

    /// Override in subclasses to perform template invalidation.
    /// Do not call this method directly. Call `invalidate()` instead.
    @MainActor func _invalidate() {}
    @MainActor func traitCollectionDidChange() {}

    func onWillAppear(animated: Bool) {}
    func onDidAppear(animated: Bool) {}
    func onWillDisappear(animated: Bool) {}
    func onDidDisappear(animated: Bool) {}
    func onPopped() {}
}

class AutoPlayHeaderProviding: AutoPlayTemplate {
    var barButtons: [NitroAction]?
}

@MainActor
func setBarButtons(template: CPTemplate, barButtons: [NitroAction]?) {
    guard let template = template as? CPBarButtonProviding else { return }

    guard let traitCollection = SceneStore.getRootTraitCollection() else {
        return
    }

    if let headerActions = barButtons {
        let parsedActions = Parser.parseHeaderActions(
            headerActions: headerActions,
            traitCollection: traitCollection
        )

        template.backButton = parsedActions.backButton
        template.leadingNavigationBarButtons =
            parsedActions.leadingNavigationBarButtons
        template.trailingNavigationBarButtons =
            parsedActions.trailingNavigationBarButtons
    }
}
