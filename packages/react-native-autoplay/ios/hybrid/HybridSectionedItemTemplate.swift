//
//  HybridSectionedItemTemplate.swift
//  Pods
//

import NitroModules

class HybridSectionedItemTemplate: HybridSectionedItemTemplateSpec {
    func createSectionedItemTemplate(config: SectionedItemTemplateConfig) throws {
        let template = SectionedItemTemplate(config: config)

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateSectionedItemTemplateSections(
        templateId: String,
        sections: [NitroSectionedItemSection]?
    ) throws -> Promise<Void> {
        return Promise.async {
            try await MainActor.run {
                try RootModule.withAutoPlayTemplate(templateId: templateId) {
                    (template: SectionedItemTemplate) in
                    template.updateSections(sections: sections)
                }
            }
        }
    }
}
