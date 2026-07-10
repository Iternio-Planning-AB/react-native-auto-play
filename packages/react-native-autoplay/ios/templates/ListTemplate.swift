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

    init(config: ListTemplateConfig) {
        self.config = config

        sections = config.sections
        let title = Parser.parseText(text: config.title)

        if #available(iOS 27.0, *), config.mapConfig != nil {
            mapPanel = CPMapPanel(
                title: title,
                sections: (config.sections ?? []).map { section in
                    CPMapPanelSection(title: section.title, items: [])
                },
                buttonConfiguration: nil
            )
        }
        else {
            template = CPListTemplate(
                title: title,
                sections: [],
                assistantCellConfiguration: nil,
                id: config.id
            )
        }

        super.init()

        barButtons = config.headerActions

        if #available(iOS 27.0, *), let mapPanel = mapPanel as? CPMapPanel {
            let delegate = AutoPlayMapPanelDelegate(template: self, templateId: config.id)
            mapPanelDelegate = delegate
            mapPanel.delegate = delegate
        }
    }

    @MainActor
    override func _invalidate() {
        guard let traitCollection = SceneStore.getRootTraitCollection() else {
            return
        }

        if #available(iOS 27.0, *), let mapPanel = mapPanel as? CPMapPanel {
            let panelSections = Parser.parseMapPanelSections(
                sections: sections,
                updateSection: self.updateSection(section:sectionIndex:),
                traitCollection: traitCollection
            )

            zip(mapPanel.sections, panelSections).forEach { existingSection, updatedSection in
                existingSection.title = updatedSection.title
                existingSection.items = updatedSection.items
            }

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
