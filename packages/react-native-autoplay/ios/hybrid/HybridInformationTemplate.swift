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
        TemplateStore.addTemplate(
            template: template,
            templateId: config.id
        )
    }

    func updateInformationTemplateSections(
        templateId: String,
        section: NitroSection
    ) throws -> Promise<Void> {
        return Promise.async {
            guard
                let template = TemplateStore.getTemplate(templateId: templateId)
                    as? InformationTemplate
            else {
                throw AutoPlayError.invalidTemplateType(
                    "\(templateId) is not an InformationTemplate"
                )
            }

            await template.updateSection(section: section)
        }
    }
}
