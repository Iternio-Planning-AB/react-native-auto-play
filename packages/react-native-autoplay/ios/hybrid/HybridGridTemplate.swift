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

        TemplateStore.addTemplate(
            template: template,
            templateId: config.id
        )
    }

    func updateGridTemplateButtons(
        templateId: String,
        buttons: [NitroGridButton]
    ) throws -> Promise<Void> {
        return Promise.async {
            guard
                let template = TemplateStore.getTemplate(templateId: templateId)
                    as? GridTemplate
            else {
                throw AutoPlayError.templateNotFound(templateId)
            }

            await template.updateButtons(buttons: buttons)
        }
    }
}
