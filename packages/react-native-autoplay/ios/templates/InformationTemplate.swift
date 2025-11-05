//
//  InformationTemplate.swift
//  Pods
//
//  Created by Samuel Brucksch on 05.11.25.
//

import CarPlay

class InformationTemplate: AutoPlayTemplate {
    var config: InformationTemplateConfig
    
    init(config: InformationTemplateConfig) {
        self.config = config
        
        let template = CPInformationTemplate(title: Parser.parseText(text: config.title)!, layout: CPInformationTemplateLayout.leading, items: [], actions: Parser.parseInformationActions(actions: config.actions), id: config.id)

        super.init(
            template: template,
            header: config.headerActions
        )

        invalidate()
    }
    
    override func invalidate() {
        guard let template = self.template as? CPInformationTemplate else {
            return
        }

        setBarButtons()
        
        template.items = Parser.parseInformationItems(section: config.section)
    }
    
    override func onWillAppear(animated: Bool) {
        config.onWillAppear?(animated)
    }

    override func onDidAppear(animated: Bool) {
        config.onDidAppear?(animated)
    }

    override func onWillDisappear(animated: Bool) {
        config.onWillDisappear?(animated)
    }

    override func onDidDisappear(animated: Bool) {
        config.onDidDisappear?(animated)
    }

    override func onPopped() {
        config.onPopped?()
    }
    
    func updateSection(section: NitroSection) {
        config.section = section
        invalidate()
    }
    
}
