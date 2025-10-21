//
//  MessageTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 17.10.25.
//

import CarPlay

class MessageTemplate: AutoPlayTemplate {
    var config: MessageTemplateConfig

    init(config: MessageTemplateConfig) {
        self.config = config

        let template = CPAlertTemplate(
            titleVariants: [Parser.parseText(text: config.message)!],
            actions: Parser.parseAlertActions(alertActions: config.actions)
        )

        super.init(
            templateId: config.id,
            template: template,
            header: config.headerActions
        )
    }

    override func onWillAppear(animted: Bool) {
        config.onWillAppear?(animted)
    }

    override func onDidAppear(animted: Bool) {
        config.onDidAppear?(animted)
    }

    override func onWillDisappear(animted: Bool) {
        config.onWillDisappear?(animted)
    }

    override func onDidDisappear(animted: Bool) {
        config.onDidDisappear?(animted)
    }

    override func onPopped() {
        config.onPopped?()
    }
}
