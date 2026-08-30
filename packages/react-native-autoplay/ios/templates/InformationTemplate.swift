//
//  InformationTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 05.11.25.
//

import CarPlay

class InformationTemplate: AutoPlayHeaderProviding {
    /// `nil` when this template renders as a map panel instead (see `mapPanel`).
    private(set) var template: CPInformationTemplate?
    var config: InformationTemplateConfig

    var section: NitroSection

    /// Whether this template renders as a `CPMapPanel` instead of a plain `CPInformationTemplate`.
    private let usesMapPanel: Bool

    /// Built lazily on the first `_invalidate()` call rather than in `init()`: `CPMapPanel.buttonConfiguration`
    /// is readonly, so unlike sections it can't be patched in later, and building it needs
    /// `traitCollection` for the optional symbol button image — only safe to fetch on the
    /// main thread, which `init()` isn't guaranteed to run on. Boxed as `Any` since `CPMapPanel`
    /// itself is only available on iOS 27+ while this class supports a much lower deployment target.
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
        return barButtons
    }

    override func getPanelMapButtons() -> [NitroMapButton]? {
        return config.mapConfig?.mapButtons
    }

    init(config: InformationTemplateConfig) {
        self.config = config

        section = config.section

        if #available(iOS 27.0, *) {
            usesMapPanel = config.mapConfig != nil
        }
        else {
            usesMapPanel = false
        }

        if !usesMapPanel {
            template = CPInformationTemplate(
                title: Parser.parseText(text: config.title)!,
                layout: .leading,
                items: Parser.parseInformationItems(section: section),
                actions: Parser.parseInformationActions(actions: config.actions),
                id: config.id
            )
        }

        super.init()

        barButtons = config.headerActions
    }

    @MainActor
    override func _invalidate() {
        if usesMapPanel, #available(iOS 27.0, *) {
            guard let mapPanel = mapPanel as? CPMapPanel else {
                guard let traitCollection = SceneStore.getRootTraitCollection() else { return }

                // InformationTemplate's actions are only ever set once and never updated
                // afterwards, so there's nothing to keep in sync with buttonConfiguration later.
                let panel = CPMapPanel(
                    title: Parser.parseText(text: config.title),
                    sections: [
                        CPMapPanelSection(
                            title: nil,
                            items: Parser.parseInformationPanelItems(section: section)
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

                return
            }

            mapPanel.sections.first?.items = Parser.parseInformationPanelItems(section: section)
            return
        }

        guard let template else { return }

        setBarButtons(template: template, barButtons: barButtons)
        template.items = Parser.parseInformationItems(section: section)
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

    @MainActor
    func updateSection(section: NitroSection) {
        self.section = section
        invalidate()
    }
}
