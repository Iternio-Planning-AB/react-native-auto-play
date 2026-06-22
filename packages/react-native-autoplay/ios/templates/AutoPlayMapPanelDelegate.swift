//
//  AutoPlayMapPanelDelegate.swift
//  Pods
//

import CarPlay

/// Shared `CPMapPanel.Delegate` for any `AutoPlayTemplate` that renders as a map panel
/// (`ListTemplate`, and future panel-backed templates like a grid). `CPMapPanel.delegate` is
/// `weak`, so the owning template must keep a strong reference to this instance for as long as
/// the panel exists.
@available(iOS 27.0, *)
class AutoPlayMapPanelDelegate: NSObject, CPMapPanel.Delegate {
    private weak var template: AutoPlayTemplate?
    private let templateId: String

    init(template: AutoPlayTemplate, templateId: String) {
        self.template = template
        self.templateId = templateId
    }

    /// There's no "will appear" delegate method, so `onWillAppear` and `onDidAppear` fire
    /// together here. Also fires `onWillDisappear` and `onDidDisappear` on whichever panel was on top
    /// before this one, since CPMapPanelDelegate never notifies a covered panel itself —
    /// `panelDidShow` only tells us about the panel that just appeared.
    func panelDidShow(_ panel: CPMapPanel) {
        template?.onWillAppear(animated: true)
        template?.onDidAppear(animated: true)

        let templateId = self.templateId

        Task { @MainActor in
            var previousPanelId: String?
            var mapTemplate: CPMapTemplate?

            try? await RootModule.withInterfaceController { interfaceController in
                mapTemplate = interfaceController.rootTemplate as? CPMapTemplate
                previousPanelId =
                    interfaceController.panelTemplateIds
                    .filter { $0 != templateId }
                    .last
            }

            // This panel owns the map template's bar buttons and map buttons while it's on top.
            if let mapTemplate {
                applyPanelHeaderActions(self.template?.getPanelHeaderActions(), to: mapTemplate)
                applyPanelMapButtons(self.template?.getPanelMapButtons(), to: mapTemplate)
            }

            guard let previousPanelId else { return }

            try? RootModule.withAutoPlayTemplate(templateId: previousPanelId) {
                (template: AutoPlayTemplate) in
                template.onWillDisappear(animated: true)
                template.onDidDisappear(animated: true)
            }
        }
    }

    /// There's no "will disappear" delegate method, so `onWillDisappear` and `onDidDisappear`
    /// fire together here. Also fires `onWillAppear` and `onDidAppear` on whichever panel is now on
    /// top after this one is removed, since CPMapPanelDelegate never notifies a revealed panel
    /// itself — `panelDidHide` only tells us about the panel that just disappeared.
    ///
    /// KNOWN ISSUE (iOS 27 beta): The panel delegate method `panelDidHide(_ panel: CPMapPanel)` might not be called. (177590525)
    /// https://developer.apple.com/documentation/ios-ipados-release-notes/ios-ipados-27-release-notes#CarPlay
    func panelDidHide(_ panel: CPMapPanel) {
        let templateId = self.templateId
        let template = self.template

        Task { @MainActor in
            var revealedPanelId: String?
            var mapTemplate: CPMapTemplate?

            // Read panelTemplateIds after removing this entry, in the same MainActor-isolated
            // closure, so there's no race between the removal and the check for what's now on
            // top.
            try? await RootModule.withInterfaceController { interfaceController in
                interfaceController.removeNavigationEntryIfPresent(templateId: templateId)
                revealedPanelId = interfaceController.panelTemplateIds.last
                mapTemplate = interfaceController.rootTemplate as? CPMapTemplate
            }

            template?.onWillDisappear(animated: true)
            template?.onDidDisappear(animated: true)

            try? RootModule.withTemplateStore { templateStore in
                templateStore.removeTemplate(templateId: templateId)
            }

            HybridAutoPlay.removeListeners(templateId: templateId)

            if let revealedPanelId {
                // Another panel is now on top: it reclaims the bar/map buttons and its own appear pair, same as a fresh push.
                try? RootModule.withAutoPlayTemplate(templateId: revealedPanelId) {
                    (revealed: AutoPlayTemplate) in
                    if let mapTemplate {
                        applyPanelHeaderActions(revealed.getPanelHeaderActions(), to: mapTemplate)
                        applyPanelMapButtons(revealed.getPanelMapButtons(), to: mapTemplate)
                    }
                    revealed.onWillAppear(animated: true)
                    revealed.onDidAppear(animated: true)
                }
            }
            else if let mapTemplate {
                // No panel remains: let the map template reclaim its own bar/map buttons.
                try? RootModule.withAutoPlayTemplate(templateId: mapTemplate.id) {
                    (root: AutoPlayTemplate) in
                    root.invalidate()
                }
            }
        }
    }
}

/// apply header buttons according to mapConfig.headerActions or remove the map provided buttons in case none are specified for the panel
@available(iOS 27.0, *)
@MainActor
private func applyPanelHeaderActions(_ headerActions: [NitroAction]?, to mapTemplate: CPMapTemplate) {
    guard let headerActions else {
        mapTemplate.backButton = nil
        mapTemplate.leadingNavigationBarButtons = []
        mapTemplate.trailingNavigationBarButtons = []
        return
    }

    setBarButtons(template: mapTemplate, barButtons: headerActions)
}

/// Applies mapConfig.mapButtons to the map template, or clears them if the panel specifies none.
@available(iOS 27.0, *)
@MainActor
private func applyPanelMapButtons(_ mapButtons: [NitroMapButton]?, to mapTemplate: CPMapTemplate) {
    // Only need the root MapTemplate for its onPanButtonPress callback, since a .pan button still controls the same underlying map.
    try? RootModule.withAutoPlayTemplate(templateId: mapTemplate.id) { (root: MapTemplate) in
        mapTemplate.mapButtons = Parser.parseMapButtons(
            mapButtons: mapButtons ?? [],
            onPanButtonPress: root.onPanButtonPress
        )
    }
}
