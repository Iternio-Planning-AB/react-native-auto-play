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
    /// while the CarPlay delegate callbacks remove/purge them on the main
    /// thread, and Swift dictionaries are not thread-safe.
    private let lock = NSLock()
    private var store: [String: AutoPlayTemplate] = [:]

    private func withLock<T>(_ body: () -> T) -> T {
        lock.lock()
        defer { lock.unlock() }
        return body()
    }

    func getCPTemplate(templateId key: String) -> CPTemplate? {
        return withLock { store[key] }?.getTemplate()
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
        // Remove first, then notify outside the lock: `onPopped` runs a JS
        // callback which can re-enter the store (see
        // VoiceInputTemplate.onDidDisappear).
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
        withLock {
            store = store.filter {
                !($0.value.getTemplate() is CPSearchTemplate)
            }
        }
    }

    @MainActor
    func traitCollectionDidChange() {
        let templates = withLock { Array(store.values) }

        templates.forEach { template in template.traitCollectionDidChange() }
    }

    func disconnect() {
        withLock { store = [:] }
    }
}
