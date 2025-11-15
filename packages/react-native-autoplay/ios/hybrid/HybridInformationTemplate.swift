//
//  HybridInformationTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 05.11.25.
//

class HybridInformationTemplate : HybridInformationTemplateSpec {

    func createInformationTemplate(config: InformationTemplateConfig) throws {
        let template = InformationTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }
    
    func updateInformationTemplateSections(templateId: String, section: NitroSection) throws {
        try RootModule.withScene { scene in
            if let template = scene.templateStore.getTemplate(
                templateId: templateId
            ) as? InformationTemplate {
                template.updateSection(section: section)
            }
        }
    }
}
