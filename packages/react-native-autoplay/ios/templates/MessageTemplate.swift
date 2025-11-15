//
//  MessageTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 17.10.25.
//

import CarPlay

class MessageTemplate: AutoPlayTemplate {
    let template: CPAlertTemplate
    var config: MessageTemplateConfig
    
    var autoDismissMs: Double? {
        return config.autoDismissMs
    }

    func getTemplate() -> CPTemplate {
        return template
    }

    init(config: MessageTemplateConfig) {
        self.config = config

        template = CPAlertTemplate(
            titleVariants: [Parser.parseText(text: config.message)!],
            actions: Parser.parseAlertActions(alertActions: config.actions),
            id: config.id
        )
    }
    
    func invalidate() {
        // this template can not be updated
    }

    func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    func onPopped() {
        config.onPopped?()
    }
}
