//
//  TemplateUpdateQueue.swift
//  Pods
//

import NitroModules

/// Runs template updates and navigation calls on the main actor one after another, in the order
/// JS issued them. `Promise.async` starts an unstructured `Task` per call and those can reach the
/// main actor in any order, so e.g. `setHeaderActions(A)` followed by `setHeaderActions(B)` could
/// leave A on screen. push/pop/setRoot also suspend while CarPlay animates, which without the
/// queue lets a later call run in between and desync the navigation stack.
enum TemplateUpdateQueue {
    private static let lock = NSLock()
    private static var tail: Task<Void, Never>?

    /// Must be called synchronously from the hybrid method, so the queue order is the JS call
    /// order. An operation must never await another enqueued operation, it would wait for itself.
    static func enqueue<T>(
        _ operation: @escaping @MainActor () async throws -> T
    ) -> Promise<T> {
        let promise = Promise<T>()

        lock.lock()
        defer { lock.unlock() }

        let previous = tail
        tail = Task { @MainActor in
            await previous?.value

            do {
                promise.resolve(withResult: try await operation())
            }
            catch {
                promise.reject(withError: error)
            }
        }

        return promise
    }

    /// For sync hybrid methods, which have no promise to hand back to JS.
    static func post(_ operation: @escaping @MainActor () -> Void) {
        let _: Promise<Void> = enqueue(operation)
    }
}
