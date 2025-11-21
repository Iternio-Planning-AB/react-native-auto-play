//
//  InformationTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 05.11.25.
//

import CarPlay

class InformationTemplate: AutoPlayTemplate, AutoPlayHeaderProviding {
    let template: CPInformationTemplate
    var config: InformationTemplateConfig
    
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

    init(config: InformationTemplateConfig) {
        self.config = config

        template = CPInformationTemplate(
            title: Parser.parseText(text: config.title)!,
            layout: .leading,
            items: Parser.parseInformationItems(section: config.section),
            actions: Parser.parseInformationActions(actions: config.actions),
            id: config.id
        )
    }

    func invalidate() {
        setBarButtons(template: template, barButtons: barButtons)
        template.items = Parser.parseInformationItems(section: config.section)
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
    func updateSection(section: NitroSection) {
        config.section = section
        invalidate()
    }
}
