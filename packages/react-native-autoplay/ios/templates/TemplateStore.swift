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
        return try? store[key]?.getTemplate()
    }

    func getTemplate(templateId: String) throws -> AutoPlayTemplate {
        if let template = store[templateId] {
            return template
        }
        throw AutoPlayError.templateNotFound(templateId)
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

    @MainActor
    func traitCollectionDidChange() {
        store.values.forEach { template in template.traitCollectionDidChange() }
    }

    func disconnect() {
        store = [:]
    }
}
