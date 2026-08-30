//
//  MessageTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 17.10.25.
//

import CarPlay

class MessageTemplate: AutoPlayTemplate {
    /// `nil` when this template renders as a map panel instead (see `mapPanel`).
    private(set) var template: CPAlertTemplate?
    var config: MessageTemplateConfig

    /// Whether this template renders as a `CPMapPanel` instead of a plain `CPAlertTemplate`.
    private let usesMapPanel: Bool

    /// Built lazily on the first `_invalidate()` call rather than in `init()`, same reasoning as `InformationTemplate`: `CPMapPanel.buttonConfiguration` is readonly and needs `traitCollection` for its optional symbol button image, which isn't safe to fetch off the main thread that `init()` isn't guaranteed to run on. Boxed as `Any` since `CPMapPanel` itself is only available on iOS 27+ while this class supports a much lower deployment target.
    private var mapPanel: Any?

    /// `CPMapPanel.delegate` is `weak`, so this keeps the shared delegate alive for as long as the panel exists. Boxed as `Any` for the same reason as `mapPanel`.
    private var mapPanelDelegate: Any?

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() throws -> CPTemplate {
        guard let template else {
            throw AutoPlayError.templateIsMapPanel(config.id)
        }
        return template
    }

    override func getPanel() -> Any? {
        return mapPanel
    }

    override func getPanelHeaderActions() -> [NitroAction]? {
        return config.headerActions
    }

    override func getPanelMapButtons() -> [NitroMapButton]? {
        return config.mapConfig?.mapButtons
    }

    init(config: MessageTemplateConfig) {
        self.config = config

        if #available(iOS 27.0, *) {
            usesMapPanel = config.mapConfig != nil
        }
        else {
            usesMapPanel = false
        }

        if !usesMapPanel {
            template = CPAlertTemplate(
                titleVariants: [Parser.parseText(text: config.message)!],
                actions: Parser.parseAlertActions(alertActions: config.actions),
                id: config.id
            )
        }
    }

    @MainActor
    override func _invalidate() {
        guard usesMapPanel, #available(iOS 27.0, *), mapPanel == nil else { return }
        guard let traitCollection = SceneStore.getRootTraitCollection() else { return }

        // The message and its actions are only ever set once and never updated afterwards,
        // so there's nothing to keep in sync with the panel's content later.
        let panel = CPMapPanel(
            title: Parser.parseText(text: config.title),
            sections: [
                CPMapPanelSection(
                    title: nil,
                    items: [
                        CPMapPanelItem(
                            listItem: CPListItem(text: Parser.parseText(text: config.message), detailText: nil)
                        )
                    ]
                )
            ],
            buttonConfiguration: Parser.parsePanelButtonConfiguration(
                actions: config.actions,
                traitCollection: traitCollection
            )
        )

        mapPanel = panel

        let delegate = AutoPlayMapPanelDelegate(template: self, templateId: config.id)
        mapPanelDelegate = delegate
        panel.delegate = delegate
    }

    override func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    override func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    override func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    override func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    override func onPopped() {
        config.onPopped?()
    }
}
