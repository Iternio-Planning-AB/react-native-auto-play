//
//  TemplateStore.swift
//  Pods
//
//  Created by Manuel Auer on 03.10.25.
//
import CarPlay

class TemplateStore {
    /// Guards `store`. Templates are added from the JS thread (the
    /// `createXTemplate` hybrid methods are synchronous and never hop actors)
    /// while the CarPlay delegate callbacks remove/purge them on the main thread
    private let lock = NSLock()
    private var store: [String: AutoPlayTemplate] = [:]

    private func withLock<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    func getCPTemplate(templateId key: String) -> CPTemplate? {
        return try? withLock { store[key] }?.getTemplate()
    }

    func getTemplate(templateId: String) throws -> AutoPlayTemplate {
        if let template = withLock({ store[templateId] }) {
            return template
        }
        throw AutoPlayError.templateNotFound(templateId)
    }

    func addTemplate(template: AutoPlayTemplate, templateId: String) {
        withLock { store[templateId] = template }
    }

    func removeTemplate(templateId: String) {
        let removed = withLock { store.removeValue(forKey: templateId) }

        removed?.onPopped()
    }

    func removeTemplates(templateIds: [String]) {
        let removed = withLock {
            templateIds.compactMap { store.removeValue(forKey: $0) }
        }

        removed.forEach { template in template.onPopped() }
    }

    func purge() {
        /// These templates were popped by a native CarPlay button we cannot intercept, so they need an `onPopped()`
        let removed = withLock {
            let searchTemplates = store.filter {
                (try? $0.value.getTemplate() is CPSearchTemplate) ?? false
            }
            searchTemplates.keys.forEach { store.removeValue(forKey: $0) }

            return Array(searchTemplates.values)
        }

        removed.forEach { template in template.onPopped() }
    }

    @MainActor
    func traitCollectionDidChange() {
        let templates = withLock { Array(store.values) }

        templates.forEach { template in template.traitCollectionDidChange() }
    }

    func disconnect() {
        /// notify every visible template about it being gone
        let removed = withLock {
            let templates = Array(store.values)
            store = [:]

            return templates
        }

        removed.forEach { template in template.onPopped() }
    }
}
