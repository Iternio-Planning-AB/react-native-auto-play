//
//  TemplateStore.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay

class TemplateStore {
    private static var store: [String: AutoPlayTemplate] = [:]

    static func getCPTemplate(templateId key: String) -> CPTemplate? {
        return store[key]?.getTemplate()
    }

    static func getTemplate(templateId: String) -> AutoPlayTemplate? {
        return store[templateId]
    }

    static func addTemplate(template: AutoPlayTemplate, templateId: String) {
        store[templateId] = template
    }

    static func removeTemplate(templateId: String) {
        store[templateId]?.onPopped()

        store.removeValue(forKey: templateId)
    }

    static func removeTemplates(templateIds: [String]) {
        templateIds.forEach { templateId in
            store[templateId]?.onPopped()
        }

        store = store.filter { !templateIds.contains($0.key) }
    }

    static func purge() {
        store = store.filter { !($0.value.getTemplate() is CPSearchTemplate) }
    }

    static func traitCollectionDidChange() {
        store.values.forEach { template in template.traitCollectionDidChange() }
    }
}
