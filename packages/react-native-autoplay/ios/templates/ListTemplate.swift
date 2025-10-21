//
//  ListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

class ListTemplate: AutoPlayTemplate {
    var config: ListTemplateConfig

    init(config: ListTemplateConfig) {
        self.config = config

        let template = CPListTemplate(
            title: Parser.parseText(text: config.title),
            sections: []
        )

        super.init(
            templateId: config.id,
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
                updateSection: self.updateSection(section:sectionIndex:)
            )
        )
    }

    override func onWillAppear(animted: Bool) {
        config.onWillAppear?(animted)
    }

    override func onDidAppear(animted: Bool) {
        config.onDidAppear?(animted)
    }

    override func onWillDisappear(animted: Bool) {
        config.onWillDisappear?(animted)
    }

    override func onDidDisappear(animted: Bool) {
        config.onDidDisappear?(animted)
    }

    override func onPopped() {
        config.onPopped?()
    }

    private func updateSection(section: NitroSection, sectionIndex: Int) {
        config.sections?[sectionIndex] = section
        invalidate()
    }

    func updateSections(sections: [NitroSection]?) {
        config.sections = sections
        invalidate()
    }
}
