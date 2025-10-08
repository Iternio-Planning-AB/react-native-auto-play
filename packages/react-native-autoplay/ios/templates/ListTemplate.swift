//
//  ListTemplate.swift
//  Pods
//
//  Created by Manuel Auer on 08.10.25.
//

import CarPlay

class ListTemplate: Template {
    var config: NitroListTemplateConfig
    
    init(config: NitroListTemplateConfig) {
        self.config = config
        
        let template = CPListTemplate(title: config.title, sections: [])
        template.userInfo = ["id": config.id]
        
        super.init(template: template)
        
        invalidate()
    }
    
    func invalidate() {
        guard let template = self.template as? CPListTemplate else {
            return
        }
        
        if let actions = config.actions {
            let parsedActions = Parser.parseActions(actions: actions)
            
            template.backButton = parsedActions.backButton
            template.leadingNavigationBarButtons = parsedActions.leadingNavigationBarButtons
            template.trailingNavigationBarButtons = parsedActions.trailingNavigationBarButtons
        }
    }
}
