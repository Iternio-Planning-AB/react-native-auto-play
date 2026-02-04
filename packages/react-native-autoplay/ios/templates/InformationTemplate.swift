//
//  InformationTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 05.11.25.
//

import CarPlay

class InformationTemplate: AutoPlayHeaderProviding {
    let template: CPInformationTemplate
    var config: InformationTemplateConfig

    var section: NitroSection

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    init(config: InformationTemplateConfig) {
        self.config = config

        section = config.section

        template = CPInformationTemplate(
            title: Parser.parseText(text: config.title)!,
            layout: .leading,
            items: Parser.parseInformationItems(section: section),
            actions: Parser.parseInformationActions(actions: config.actions),
            id: config.id
        )

        super.init()

        barButtons = config.headerActions
    }

    @MainActor
    override func _invalidate() {
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
