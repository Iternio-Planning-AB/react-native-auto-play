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
        try RootModule.withScene { scene in
            if let template = scene.templateStore.getTemplate(
                templateId: templateId
            ) as? GridTemplate {
                template.updateButtons(buttons: buttons)
            }
        }
    }
}
