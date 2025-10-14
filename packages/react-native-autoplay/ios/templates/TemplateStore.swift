//
//  TemplateStore.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay

class TemplateStore {
    private var store: [String: AutoPlayTemplate] = [:]

    func getCPTemplate(templateId key: String) -> CPTemplate? {
        return store[key]?.template
    }

    func getTemplate(templateId: String) -> AutoPlayTemplate? {
        return store[templateId]
    }

    func addTemplate(template: AutoPlayTemplate, templateId: String) {
        store[templateId] = template
    }

    func removeTemplate(templateId: String) {
        store[templateId]?.onPopped()
        
        store.removeValue(forKey: templateId)
    }

    func removeTemplates(templateIds: [String]) {
        templateIds.forEach { templateId in
            store[templateId]?.onPopped()
        }
        
        store = store.filter { !templateIds.contains($0.key) }
    }
}
