//
//  ListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

class ListTemplate: AutoPlayHeaderProviding {
    /// `nil` when this template renders as a map panel instead (see `mapPanel`).
    private(set) var template: CPListTemplate?
    var config: ListTemplateConfig

    var sections: [NitroSection]?

    /// Whether this template renders as a `CPMapPanel` instead of a plain `CPListTemplate`.
    private let usesMapPanel: Bool

    /// Built lazily on the first `_invalidate()` call, see `InformationTemplate.mapPanel`:
    /// the readonly `buttonConfiguration` needs `traitCollection` for its symbol button image.
    /// Boxed as `Any` since `CPMapPanel` itself is only available on
    /// iOS 27+ while this class supports a much lower deployment target.
    private var mapPanel: Any?

    /// `CPMapPanel.delegate` is `weak`, so this keeps the shared delegate alive for as long as
    /// the panel exists. Boxed as `Any` for the same reason as `mapPanel`.
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

    override func getPanelShowsCloseButton() -> Bool {
        return config.platform?.showsPanelCloseButton ?? false
    }

    init(config: ListTemplateConfig) {
        self.config = config

        sections = config.sections

        if #available(iOS 27.0, *) {
            usesMapPanel = config.mapConfig != nil
        }
        else {
            usesMapPanel = false
        }

        if !usesMapPanel {
            template = CPListTemplate(
                title: Parser.parseText(text: config.title),
                sections: [],
                assistantCellConfiguration: nil,
                id: config.id
            )
        }

        super.init()

        barButtons = config.headerActions
    }

    @available(iOS 27.0, *)
    @MainActor
    private func getOrCreateMapPanel(traitCollection: UITraitCollection) -> CPMapPanel {
        if let mapPanel = mapPanel as? CPMapPanel {
            return mapPanel
        }

        let panel = CPMapPanel(
            title: Parser.parseText(text: config.title),
            sections: [],
            buttonConfiguration: Parser.parsePanelButtonConfiguration(
                actions: config.platform?.panelButtonConfiguration,
                traitCollection: traitCollection
            )
        )
        mapPanel = panel

        let delegate = AutoPlayMapPanelDelegate(template: self, templateId: config.id)
        mapPanelDelegate = delegate
        panel.delegate = delegate

        return panel
    }

    @MainActor
    override func _invalidate() {
        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        if usesMapPanel, #available(iOS 27.0, *) {
            let mapPanel = getOrCreateMapPanel(traitCollection: traitCollection)
            mapPanel.sections = Parser.parseMapPanelSections(
                sections: sections,
                updateSection: self.updateSection(section:sectionIndex:),
                traitCollection: traitCollection
            )
            mapPanel.logItemOverflow(panelId: config.id)

            reapplyPanelBarIfVisible(self, templateId: config.id)
            return
        }

        guard let template else { return }

        setBarButtons(template: template, barButtons: barButtons)

        template.updateSections(
            Parser.parseSections(
                sections: sections,
                updateSection: self.updateSection(section:sectionIndex:),
                traitCollection: traitCollection
            )
        )
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
    private func updateSection(section: NitroSection, sectionIndex: Int) {
        self.sections?[sectionIndex] = section
        invalidate()
    }

    @MainActor
    func updateSections(sections: [NitroSection]?) {
        self.sections = sections
        invalidate()
    }
}
