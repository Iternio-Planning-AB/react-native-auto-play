class HybridAutoPlay: HybridAutoPlaySpec {
    private var listeners = [EventName: [String: () -> Void]]()
    private var panGestureListeners = [
        String: (PanGestureWithTranslationEvent) -> Void
    ]()
    private var willAppearListeners = [String: [String: (TemplateEvent) -> Void]]()
    private var didAppearListeners = [String: [String: (TemplateEvent) -> Void]]()
    private var willDisappearListeners = [String: [String: (TemplateEvent) -> Void]]()
    private var didDisappearListeners = [String: [String: (TemplateEvent) -> Void]]()
    
    func addListener(eventType: EventName, callback: @escaping () -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        listeners[eventType, default: [:]][uuid] = callback

        return { [weak self] in
            guard let self = self else { return }
            self.listeners[eventType]?.removeValue(forKey: uuid)
        }
    }

    func addListenerDidPress(callback: @escaping (PressEvent) -> Void) throws
        -> () -> Void
    {
        throw fatalError("addListenerDidPress not supported on this platform")
    }

    func addListenerDidUpdatePinchGesture(
        callback: @escaping (PinchGestureEvent) -> Void
    ) throws -> () -> Void {
        throw fatalError(
            "addListenerDidUpdatePinchGesture not supported on this platform"
        )
    }

    func addListenerDidUpdatePanGestureWithTranslation(
        callback: @escaping (PanGestureWithTranslationEvent) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        panGestureListeners[uuid] = callback

        return { [weak self] in
            self?.panGestureListeners.removeValue(forKey: uuid)
        }
    }

    func addListenerWillAppear(templateId: String, callback: @escaping (TemplateEvent?) -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        var callbacks = willAppearListeners[templateId] ?? [:]
        callbacks[uuid] = callback
        willAppearListeners[templateId] = callbacks
        
        return { [weak self] in
            guard let self = self else { return }
            self.willAppearListeners[templateId]?.removeValue(forKey: uuid)
            if self.willAppearListeners[templateId]?.isEmpty == true {
                self.willAppearListeners.removeValue(forKey: templateId)
            }
        }
    }

    func addListenerDidAppear(templateId: String, callback: @escaping (TemplateEvent?) -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        var callbacks = didAppearListeners[templateId] ?? [:]
        callbacks[uuid] = callback
        didAppearListeners[templateId] = callbacks
        
        return { [weak self] in
            guard let self = self else { return }
            self.didAppearListeners[templateId]?.removeValue(forKey: uuid)
            if self.didAppearListeners[templateId]?.isEmpty == true {
                self.didAppearListeners.removeValue(forKey: templateId)
            }
        }
    }

    func addListenerWillDisappear(templateId: String, callback: @escaping (TemplateEvent?) -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        var callbacks = willDisappearListeners[templateId] ?? [:]
        callbacks[uuid] = callback
        willDisappearListeners[templateId] = callbacks
        
        return { [weak self] in
            guard let self = self else { return }
            self.willDisappearListeners[templateId]?.removeValue(forKey: uuid)
            if self.willDisappearListeners[templateId]?.isEmpty == true {
                self.willDisappearListeners.removeValue(forKey: templateId)
            }
        }
    }

    func addListenerDidDisappear(templateId: String, callback: @escaping (TemplateEvent?) -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        var callbacks = didDisappearListeners[templateId] ?? [:]
        callbacks[uuid] = callback
        didDisappearListeners[templateId] = callbacks
        
        return { [weak self] in
            guard let self = self else { return }
            self.didDisappearListeners[templateId]?.removeValue(forKey: uuid)
            if self.didDisappearListeners[templateId]?.isEmpty == true {
                self.didDisappearListeners.removeValue(forKey: templateId)
            }
        }
    }
}
