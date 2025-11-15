//
//  HybridListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

class HybridListTemplate: HybridListTemplateSpec {
    func createListTemplate(config: ListTemplateConfig) throws {
        let template = ListTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateListTemplateSections(
        templateId: String,
        sections: [NitroSection]?
    ) throws {
        try RootModule.withScene { scene in
            if let template = scene.templateStore.getTemplate(
                templateId: templateId
            ) as? ListTemplate {
                template.updateSections(sections: sections)
            }
        }
    }
}
