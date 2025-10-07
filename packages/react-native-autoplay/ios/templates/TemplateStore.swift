//
//  TemplateStore.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay

enum TemplateError: Error {
    case templateNotFound(String)
}

class TemplateStore {
    private static var store: [String: Template] = [:]

    static func getCPTemplate(templateId key: String) -> CPTemplate? {
        return store[key]?.template
    }
    
    static func getTemplate(templateId: String) -> Template? {
        return store[templateId]
    }

    static func addTemplate(template: Template, templateId: String) {
        store[templateId] = template
    }

    static func removeTemplate(templateId: String) {
        store.removeValue(forKey: templateId)
    }
}
