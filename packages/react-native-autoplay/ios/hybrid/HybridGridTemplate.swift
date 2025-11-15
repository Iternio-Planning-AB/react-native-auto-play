//
//  HybridGridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

class HybridGridTemplate: HybridGridTemplateSpec {
    func createGridTemplate(config: GridTemplateConfig) throws {
        let template = GridTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateGridTemplateButtons(
        templateId: String,
        buttons: [NitroGridButton]
    ) throws {
        try RootModule.withAutoPlayTemplate(templateId: templateId) {
            (template: GridTemplate) in
            template.updateButtons(buttons: buttons)
        }
    }
}
