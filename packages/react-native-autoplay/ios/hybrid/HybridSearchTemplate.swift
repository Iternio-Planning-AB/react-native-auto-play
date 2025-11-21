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
        TemplateStore.addTemplate(
            template: template,
            templateId: config.id
        )
    }

    func updateSearchResults(templateId: String, results: NitroSection) throws
        -> Promise<Void>
    {
        return Promise.async {
            guard
                let template = TemplateStore.getTemplate(templateId: templateId)
                    as? SearchTemplate
            else {
                throw AutoPlayError.invalidTemplateType(
                    "\(templateId) is not a SearchTemplate"
                )
            }

            await template.updateSearchResults(results: results)
        }
    }
}
