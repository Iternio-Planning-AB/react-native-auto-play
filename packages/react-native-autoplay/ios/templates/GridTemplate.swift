//
//  GridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 11.10.25.
//

import CarPlay

class GridTemplate: Template {
    var config: NitroGridTemplateConfig

    init(config: NitroGridTemplateConfig) {
        self.config = config

        let template = CPGridTemplate(
            title: Parser.parseText(text: config.title),
            gridButtons: []
        )

        super.init(
            templateId: config.id,
            template: template,
            header: config.actions
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
    
    func updateButtons(buttons: [NitroGridButton]) {
        config.buttons = buttons
        invalidate()
    }
}
