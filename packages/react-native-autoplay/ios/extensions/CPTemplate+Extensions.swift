//
//  CPTemplate+Extensions.swift
//  Pods
//
//  Created by Manuel Auer on 14.10.25.
//

import CarPlay

extension CPTemplate {
    func getTemplateId() -> String? {
        guard let userInfo = self.userInfo as? [String: Any],
            let templateId = userInfo["id"] as? String
        else {
            return nil
        }

        return templateId
    }
}
