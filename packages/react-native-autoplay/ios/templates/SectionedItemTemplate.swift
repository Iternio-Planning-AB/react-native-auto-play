//
//  SectionedItemTemplate.swift
//  Pods
//

import CarPlay

/// `CPListTemplate` with grid sections as image rows, `CPMapPanel` with `mapConfig` on iOS 27+.
class SectionedItemTemplate: AutoPlayHeaderProviding {
    /// `nil` when this template renders as a map panel instead (see `mapPanel`).
    private(set) var template: CPListTemplate?
    var config: SectionedItemTemplateConfig

    var sections: [NitroSectionedItemSection]?

    /// Whether this template renders as a `CPMapPanel` instead of a plain `CPListTemplate`.
    private let usesMapPanel: Bool

    /// Built lazily on the first `_invalidate()` call, see `InformationTemplate.mapPanel`.
    /// `Any` because `CPMapPanel` needs iOS 27+.
    private var mapPanel: Any?

    /// Keeps the delegate alive since `CPMapPanel.delegate` is `weak`, `Any` like `mapPanel`.
    private var mapPanelDelegate: Any?

    /// Pressed grid button, rendered disabled until the timer clears it, survives section rebuilds.
    private var pressedGridButton: (sectionIndex: Int, buttonIndex: Int)?
    private var pressedGridButtonTask: Task<Void, Never>?
    private static let pressedGridButtonDurationNs: UInt64 = 100_000_000

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

    init(config: SectionedItemTemplateConfig) {
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
            mapPanel.sections = Parser.parseSectionedItemPanelSections(
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
            Parser.parseSectionedItemSections(
                sections: sections,
                updateSection: self.updateSection(section:sectionIndex:),
                pressedGridButton: pressedGridButton,
                onGridButtonPressed: self.gridButtonPressed(sectionIndex:buttonIndex:),
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
    private func gridButtonPressed(sectionIndex: Int, buttonIndex: Int) {
        pressedGridButton = (sectionIndex, buttonIndex)
        pressedGridButtonTask?.cancel()
        pressedGridButtonTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: SectionedItemTemplate.pressedGridButtonDurationNs)
            guard !Task.isCancelled, let self else { return }
            self.pressedGridButton = nil
            self.invalidate()
        }
    }

    /// Only list sections update themselves (toggle state).
    @MainActor
    private func updateSection(section: NitroSection, sectionIndex: Int) {
        self.sections?[sectionIndex] = .first(section)
        invalidate()
    }

    @MainActor
    func updateSections(sections: [NitroSectionedItemSection]?) {
        self.sections = sections
        invalidate()
    }
}
