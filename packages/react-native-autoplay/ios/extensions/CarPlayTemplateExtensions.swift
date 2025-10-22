//
//  CarPlayTemplateExtensions.swift
//  Pods
//
//  Created by Manuel Auer on 22.10.25.
//

import CarPlay

func initTemplate(template: CPTemplate, id: String) {
    var info: [String: Any] = [:]
    info["id"] = id
    template.userInfo = info
}

extension CPTemplate {
    convenience init(id: String) {
        self.init()
        initTemplate(template: self, id: id)
    }
    @objc var id: String {
        return (self.userInfo as? [String: Any])?["id"] as! String
    }
}

extension CPGridTemplate {
    convenience init(title: String?, gridButtons: [CPGridButton], id: String) {
        self.init(title: title, gridButtons: gridButtons)
        initTemplate(template: self, id: id)
    }
}

extension CPListTemplate {
    convenience init(
        title: String?,
        sections: [CPListSection],
        assistantCellConfiguration: CPAssistantCellConfiguration?,
        id: String
    ) {
        self.init(
            title: title,
            sections: sections,
            assistantCellConfiguration: assistantCellConfiguration
        )
        initTemplate(template: self, id: id)
    }
    @available(iOS 26.0, *)
    convenience init(
        title: String?,
        sections: [CPListSection],
        assistantCellConfiguration: CPAssistantCellConfiguration?,
        headerGridButtons: [CPGridButton]?,
        id: String
    ) {
        self.init(
            title: title,
            sections: sections,
            assistantCellConfiguration: assistantCellConfiguration,
            headerGridButtons: headerGridButtons
        )
        initTemplate(template: self, id: id)
    }
}

extension CPAlertTemplate {
    convenience init(
        titleVariants: [String],
        actions: [CPAlertAction],
        id: String
    ) {
        self.init(titleVariants: titleVariants, actions: actions)
        initTemplate(template: self, id: id)
    }
}
