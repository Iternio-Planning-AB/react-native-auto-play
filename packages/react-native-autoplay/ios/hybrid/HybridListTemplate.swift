//
//  HybridListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

import NitroModules

class HybridListTemplate: HybridListTemplateSpec {
    func createListTemplate(config: ListTemplateConfig) throws {
        let template = ListTemplate(config: config)
        TemplateStore.addTemplate(
            template: template,
            templateId: config.id
        )
    }

    func updateListTemplateSections(
        templateId: String,
        sections: [NitroSection]?
    ) throws -> Promise<Void> {
        return Promise.async {
            guard
                let template = TemplateStore.getTemplate(templateId: templateId)
                    as? ListTemplate
            else {
                throw AutoPlayError.invalidTemplateType(
                    "\(templateId) is not a ListTemplate"
                )
            }

            await template.updateSections(sections: sections)
        }
    }
}
