//
//  ListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

class ListTemplate: AutoPlayTemplate {
    var config: ListTemplateConfig

    @MainActor
    init(config: ListTemplateConfig) {
        self.config = config

        let template = CPListTemplate(
            title: Parser.parseText(text: config.title),
            sections: [],
            assistantCellConfiguration: nil,
            id: config.id
        )

        super.init(
            template: template,
            header: config.headerActions
        )

        invalidate()
    }

    override func invalidate() {
        guard let template = self.template as? CPListTemplate else {
            return
        }

        setBarButtons()

        template.updateSections(
            Parser.parseSections(
                sections: config.sections,
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
        config.sections?[sectionIndex] = section
        invalidate()
    }

    @MainActor
    func updateSections(sections: [NitroSection]?) {
        config.sections = sections
        invalidate()
    }
}
