//
//  HybridPointOfInterestTemplate.swift
//  Pods
//

import NitroModules

class HybridPointOfInterestTemplate: HybridPointOfInterestTemplateSpec {
    func createPointOfInterestTemplate(config: PointOfInterestTemplateConfig) throws {
        let template = PointOfInterestTemplate(config: config)

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updatePointOfInterestTemplateItems(
        templateId: String,
        items: [PointOfInterest]
    ) throws -> Promise<Void> {
        return Promise.async {
            try await MainActor.run {
                try RootModule.withAutoPlayTemplate(templateId: templateId) {
                    (template: PointOfInterestTemplate) in
                    template.updateItems(items: items)
                }
            }
        }
    }
}
