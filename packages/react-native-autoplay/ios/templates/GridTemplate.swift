//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: AutoPlayTemplate {
    var config: GridTemplateConfig

    init(config: GridTemplateConfig) {
        self.config = config

        let template = CPGridTemplate(
            title: Parser.parseText(text: config.title),
            gridButtons: []
        )

        super.init(
            templateId: config.id,
            template: template,
            header: config.headerActions
        )

        invalidate()
    }

    override func invalidate() {
        guard let template = self.template as? CPGridTemplate else {
            return
        }

        setBarButtons()

        let buttons = config.buttons.map { button in
            CPGridButton(
                titleVariants: [Parser.parseText(text: button.title)!],
                image: SymbolFont.imageFromNitroImage(image: button.image)!
            ) { _ in
                button.onPress()
            }
        }

        template.updateGridButtons(buttons)
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

    func updateButtons(buttons: [NitroGridButton]) {
        config.buttons = buttons
        invalidate()
    }
}
