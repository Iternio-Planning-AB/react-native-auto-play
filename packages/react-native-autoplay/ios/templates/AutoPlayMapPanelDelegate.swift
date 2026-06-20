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

            try? await RootModule.withInterfaceController { interfaceController in
                previousPanelId = interfaceController.panelTemplateIds
                    .filter { $0 != templateId }
                    .last
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
    /// KNOWN ISSUE (iOS 27 beta): `panelDidHide` is verified to fire for the back-button case
    /// above, but is *not* called when the panel is dismissed via CarPlay's built-in close (X)
    /// button — confirmed on device. `panelDidShow` fires correctly on push, so the delegate
    /// itself is wired correctly; this looks like a CarPlay bug specific to the close button on
    /// this beta SDK, not something fixable from here.  Re-test against newer iOS 27 betas.
    func panelDidHide(_ panel: CPMapPanel) {
        let templateId = self.templateId
        let template = self.template

        Task { @MainActor in
            var revealedPanelId: String?

            // Read panelTemplateIds after removing this entry, in the same MainActor-isolated
            // closure, so there's no race between the removal and the check for what's now on
            // top.
            try? await RootModule.withInterfaceController { interfaceController in
                interfaceController.removeNavigationEntryIfPresent(templateId: templateId)
                revealedPanelId = interfaceController.panelTemplateIds.last
            }

            template?.onWillDisappear(animated: true)
            template?.onDidDisappear(animated: true)

            try? RootModule.withTemplateStore { templateStore in
                templateStore.removeTemplate(templateId: templateId)
            }

            HybridAutoPlay.removeListeners(templateId: templateId)

            guard let revealedPanelId else { return }

            try? RootModule.withAutoPlayTemplate(templateId: revealedPanelId) {
                (template: AutoPlayTemplate) in
                template.onWillAppear(animated: true)
                template.onDidAppear(animated: true)
            }
        }
    }
}
