//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: AutoPlayHeaderProviding {
    let template: CPGridTemplate
    var config: GridTemplateConfig

    var buttons: [NitroGridButton]

    override var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    override func getTemplate() -> CPTemplate {
        return template
    }

    init(config: GridTemplateConfig) {
        self.config = config
        buttons = config.buttons

        template = CPGridTemplate(
            title: Parser.parseText(text: config.title),
            gridButtons: GridTemplate.parseButtons(buttons: buttons),
            id: config.id
        )

        super.init()

        barButtons = config.headerActions

    }

    static func parseButtons(buttons: [NitroGridButton]) -> [CPGridButton] {
        guard let traitCollection = SceneStore.getRootTraitCollection() else { return [] }
        return Parser.parseGridButtons(buttons: buttons, traitCollection: traitCollection)
    }

    @MainActor
    override func _invalidate() {
        setBarButtons(template: template, barButtons: barButtons)

        let buttons = GridTemplate.parseButtons(buttons: buttons)
        template.updateGridButtons(buttons)
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
    func updateButtons(buttons: [NitroGridButton]) {
        self.buttons = buttons
        invalidate()
    }
}
