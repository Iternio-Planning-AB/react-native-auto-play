import React

class HybridAutoPlay: HybridAutoPlaySpec {
    private static var listeners = [EventName: [String: () -> Void]]()
    private static var panGestureListeners = [
        String: (PanGestureWithTranslationEventPayload) -> Void
    ]()

    private static var templateStateListeners = [
        String: (TemplateEventPayload) -> Void
    ]()

    private static var renderStateListeners = [
        String: (VisibilityState) -> Void
    ]()

    private static var isJsReady = false
    private static var eventQueue: [EventName] = []
    private static var jsBundleObserver: NSObjectProtocol?

    override init() {
        // we listen for the bundle loaded notification to make sure we
        // emit events that were recevied before js was ready
        // captures only basic events like connect, disconnect...

        let name =
            RCTIsNewArchEnabled()
            ? Notification.Name("RCTInstanceDidLoadBundle")
            : Notification.Name("RCTJavaScriptDidLoadNotification")

        HybridAutoPlay.jsBundleObserver = NotificationCenter.default
            .addObserver(
                forName: name,
                object: nil,
                queue: nil,
            ) { notification in
                HybridAutoPlay.isJsReady = true

                HybridAutoPlay.eventQueue.forEach {
                    HybridAutoPlay.emit(event: $0)
                }

                if let observer = HybridAutoPlay.jsBundleObserver {
                    NotificationCenter.default.removeObserver(observer)
                }
            }
    }

    func addListener(eventType: EventName, callback: @escaping () -> Void)
        throws -> () -> Void
    {
        let uuid = UUID().uuidString
        HybridAutoPlay.listeners[eventType, default: [:]][uuid] = callback
        
        if eventType == .didconnect && SceneStore.isRootModuleConnected() {
            callback()
        }

        return {
            HybridAutoPlay.listeners[eventType]?.removeValue(forKey: uuid)
        }
    }

    func addListenerDidPress(callback: @escaping (PressEventPayload) -> Void)
        throws
        -> () -> Void
    {
        throw fatalError("addListenerDidPress not supported on this platform")
    }

    func addListenerDidUpdatePinchGesture(
        callback: @escaping (PinchGestureEventPayload) -> Void
    ) throws -> () -> Void {
        throw fatalError(
            "addListenerDidUpdatePinchGesture not supported on this platform"
        )
    }

    func addListenerDidUpdatePanGestureWithTranslation(
        callback: @escaping (PanGestureWithTranslationEventPayload) -> Void
    ) throws -> () -> Void {
        let uuid = UUID().uuidString
        HybridAutoPlay.panGestureListeners[uuid] = callback

        return {
            HybridAutoPlay.panGestureListeners.removeValue(forKey: uuid)
        }
    }

    func addListenerTemplateState(
        templateId: String,
        callback: @escaping (TemplateEventPayload) -> Void
    ) throws -> () -> Void {
        HybridAutoPlay.templateStateListeners[templateId] = callback

        return {
            HybridAutoPlay.templateStateListeners.removeValue(
                forKey: templateId
            )
        }
    }

    func addListenerRenderState(
        mapTemplateId: String,
        callback: @escaping (VisibilityState) -> Void
    ) throws -> () -> Void {
        HybridAutoPlay.renderStateListeners[mapTemplateId] = callback
        
        if let state = SceneStore.getState(moduleName: mapTemplateId) {
            callback(state)
        }

        return {
            HybridAutoPlay.renderStateListeners.removeValue(
                forKey: mapTemplateId
            )
        }
    }

    func createAlertTemplate(config: AlertTemplateConfig) throws {
        //TODO
    }

    func presentTemplate(templateId: String) throws {
        //TODO
    }

    func dismissTemplate(templateId: String) throws {
        //TODO
    }

    func createMapTemplate(config: TemplateConfig) throws {
        //TODO
    }

    func setRootTemplate(templateId: String) throws {
        SceneStore.getScene(moduleName: templateId)?.setRootTemplate()
    }

    static func emit(event: EventName) {
        if !HybridAutoPlay.isJsReady {
            HybridAutoPlay.eventQueue.append(event)
            return
        }

        HybridAutoPlay.listeners[event]?.values.forEach {
            $0()
        }
    }

    static func emitTemplateState(
        templateId: String,
        templateState: VisibilityState,
        animated: Bool = false
    ) {
        if let callback = HybridAutoPlay.templateStateListeners[templateId] {
            callback(
                TemplateEventPayload(animated: animated, state: templateState)
            )
        }
    }

    static func emitRenderState(mapTemplateId: String, state: VisibilityState) {
        if let callback = HybridAutoPlay.renderStateListeners[mapTemplateId] {
            callback(state)
        }
    }
}
