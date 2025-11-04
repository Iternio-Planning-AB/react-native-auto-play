//
//  HybridGridTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 15.10.25.
//

import NitroModules

class HybridGridTemplate: HybridHybridGridTemplateSpec {
    func createGridTemplate(config: GridTemplateConfig) throws -> Promise<Void> {
        return Promise.async {
            try await MainActor.run {
                let template = GridTemplate(config: config)
                try RootModule.withScene { scene in
                    scene.templateStore.addTemplate(
                        template: template,
                        templateId: config.id
                    )
                }
            }
        }
    }

    func updateGridTemplateButtons(
        templateId: String,
        buttons: [NitroGridButton]
    ) throws -> Promise<Void> {
        return Promise.async {
            try await MainActor.run {
                try RootModule.withScene { scene in
                    if let template = scene.templateStore.getTemplate(
                        templateId: templateId
                    ) as? GridTemplate {
                        template.updateButtons(buttons: buttons)
                    }
                }
            }
        }
    }
}
