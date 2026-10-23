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

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateListTemplateSections(
        templateId: String,
        sections: [NitroSection]?
    ) throws -> Promise<Void> {
        return TemplateUpdateQueue.enqueue {
            try RootModule.withAutoPlayTemplate(templateId: templateId) {
                (template: ListTemplate) in
                template.updateSections(sections: sections)
            }
        }
    }
}
