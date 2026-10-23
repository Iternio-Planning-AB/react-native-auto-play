//
//  HybridInformationTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 05.11.25.
//

import NitroModules

class HybridInformationTemplate: HybridInformationTemplateSpec {

    func createInformationTemplate(config: InformationTemplateConfig) throws {
        let template = InformationTemplate(config: config)

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateInformationTemplateSections(
        templateId: String,
        section: NitroSection
    ) throws -> Promise<Void> {
        return TemplateUpdateQueue.enqueue {
            try RootModule.withAutoPlayTemplate(templateId: templateId) {
                (template: InformationTemplate) in
                template.updateSection(section: section)
            }
        }
    }
}
