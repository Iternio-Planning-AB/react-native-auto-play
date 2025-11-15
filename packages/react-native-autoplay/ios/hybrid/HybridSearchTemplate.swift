
//
//  HybridSearchTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 28.10.25.
//

class HybridSearchTemplate: HybridSearchTemplateSpec {
    func updateSearchResults(templateId: String, results: NitroSection) throws {
        try RootModule.withScene { scene in
            if let template = scene.templateStore.getTemplate(
                templateId: templateId
            ) as? SearchTemplate {
                template.updateSearchResults(results: results)
            }
        }
    }
    
    func createSearchTemplate(config: SearchTemplateConfig) throws {
        let template = SearchTemplate(config: config)
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }
}
