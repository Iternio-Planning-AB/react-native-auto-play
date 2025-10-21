//
//  HybridMessageTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 17.10.25.
//

class HybridMessageTemplate: HybridHybridMessageTemplateSpec {
    func createMessageTemplate(config: MessageTemplateConfig) throws {
        let template = MessageTemplate(config: config)
        
        try RootModule.withScene { scene in
            scene.templateStore.addTemplate(
                template: template,
                templateId: config.id
            )
        }
    }
}
