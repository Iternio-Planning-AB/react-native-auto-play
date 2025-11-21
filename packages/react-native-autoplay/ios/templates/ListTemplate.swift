//
//  ListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

class ListTemplate: AutoPlayTemplate, AutoPlayHeaderProviding {
    let template: CPListTemplate
    var config: ListTemplateConfig
    
    var barButtons: [NitroAction]? {
        get {
            return config.headerActions
        }
        set {
            config.headerActions = newValue
            setBarButtons(template: template, barButtons: newValue)
        }
    }
    
    var autoDismissMs: Double? {
        return config.autoDismissMs
    }
    
    func getTemplate() -> CPTemplate {
        return template
    }

    init(config: ListTemplateConfig) {
        self.config = config

        template = CPListTemplate(
            title: Parser.parseText(text: config.title),
            sections: [],
            assistantCellConfiguration: nil,
            id: config.id
        )
    }

    @MainActor
    func invalidate() {
        setBarButtons(template: template, barButtons: barButtons)

        template.updateSections(
            Parser.parseSections(
                sections: config.sections,
                updateSection: self.updateSection(section:sectionIndex:),
                traitCollection: SceneStore.getRootTraitCollection()
            )
        )
    }

    func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    func onPopped() {
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
