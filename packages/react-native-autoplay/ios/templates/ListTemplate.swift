//
//  ListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

class ListTemplate: AutoPlayHeaderProviding {
    let template: CPListTemplate
    var config: ListTemplateConfig

    var sections: [NitroSection]?

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    init(config: ListTemplateConfig) {
        self.config = config

        sections = config.sections

        template = CPListTemplate(
            title: Parser.parseText(text: config.title),
            sections: [],
            assistantCellConfiguration: nil,
            id: config.id
        )

        super.init()

        barButtons = config.headerActions
    }

    @MainActor
    override func _invalidate() {
        setBarButtons(template: template, barButtons: barButtons)

        template.updateSections(
            Parser.parseSections(
                sections: sections,
                updateSection: self.updateSection(section:sectionIndex:),
                traitCollection: SceneStore.getRootTraitCollection()
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
