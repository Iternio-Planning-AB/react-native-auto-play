//
//  HybridListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

import NitroModules

class HybridListTemplate: HybridHybridListTemplateSpec {
    func createListTemplate(config: ListTemplateConfig) throws -> Promise<Void>
    {
        return Promise.async {
            try await MainActor.run {
                let template = ListTemplate(config: config)
                try RootModule.withScene { scene in
                    scene.templateStore.addTemplate(
                        template: template,
                        templateId: config.id
                    )
                }
            }
        }
    }

    func updateListTemplateSections(
        templateId: String,
        sections: [NitroSection]?
    ) throws -> Promise<Void> {
        return Promise.async {
            try await MainActor.run {
                try RootModule.withScene { scene in
                    if let template = scene.templateStore.getTemplate(
                        templateId: templateId
                    ) as? ListTemplate {
                        template.updateSections(sections: sections)
                    }
                }
            }
        }
    }
}
