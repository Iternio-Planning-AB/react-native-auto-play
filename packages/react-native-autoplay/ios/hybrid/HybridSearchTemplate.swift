//
//  HybridSearchTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 28.10.25.
//

import NitroModules

class HybridSearchTemplate: HybridSearchTemplateSpec {
    func createSearchTemplate(config: SearchTemplateConfig) throws {
        let template = SearchTemplate(config: config)

        try RootModule.withTemplateStore { templateStore in
            templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }

    func updateSearchResults(templateId: String, results: NitroSection) throws
        -> Promise<Void>
    {
        return TemplateUpdateQueue.enqueue {
            try RootModule.withAutoPlayTemplate(templateId: templateId) {
                (template: SearchTemplate) in
                template.updateSearchResults(results: results)
            }
        }
    }
}
