//
//  HybridGridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

import NitroModules

class HybridGridTemplate: HybridGridTemplateSpec {
    func createGridTemplate(config: GridTemplateConfig) throws {
        let template = GridTemplate(config: config)

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateGridTemplateButtons(
        templateId: String,
        buttons: [NitroGridButton]
    ) throws -> Promise<Void> {
        return TemplateUpdateQueue.enqueue {
            try RootModule.withAutoPlayTemplate(templateId: templateId) {
                (template: GridTemplate) in
                template.updateButtons(buttons: buttons)
            }
        }
    }
}
