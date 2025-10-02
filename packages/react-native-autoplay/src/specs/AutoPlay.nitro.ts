import type { HybridObject } from 'react-native-nitro-modules';
import type { AlertTemplateConfig } from '../templates/AlertTemplate';
import type { NitroMapTemplateConfig } from '../templates/MapTemplate';
import type { EventName, RemoveListener } from '../types/Event';
import type {
  PanGestureWithTranslationEventPayload,
  PinchGestureEventPayload,
  PressEventPayload,
} from '../types/GestureEvents';
import type { TemplateEventPayload, VisibilityState } from '../types/TemplateEvents';

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace all
   * @param eventType generic events
   * @returns token to remove the listener
   */
  addListener(eventType: EventName, callback: () => void): RemoveListener;

  /**
   * attach a listener for screen single tap press events
   * @namespace Android
   */
  addListenerDidPress(callback: (payload: PressEventPayload) => void): RemoveListener;

  /**
   * attach a listener for pinch to zoom and double tap events
   * @namespace Android
   */
  addListenerDidUpdatePinchGesture(
    callback: (payload: PinchGestureEventPayload) => void
  ): RemoveListener;

  /**
   * attach a listener for pan events
   * @namespace all
   */
  addListenerDidUpdatePanGestureWithTranslation(
    callback: (payload: PanGestureWithTranslationEventPayload) => void
  ): RemoveListener;

  /**
   * attach a listener for template will appear events
   */
  addListenerTemplateState(
    templateId: string,
    callback: (payload: TemplateEventPayload) => void
  ): RemoveListener;

  /**
   * adds a listener for the session/scene state
   * fires willAppear & didAppear when the scene/session is visible
   * fires willDisappear & didDisappear when the scene/session is not visible
   * @param mapTemplateId actually type of MapTemplateId but we can not use that one on nitro
   */
  addListenerRenderState(
    mapTemplateId: string,
    callback: (payload: VisibilityState) => void
  ): RemoveListener;

  /**
   * @namespace iOS // add similar thing for Android, probably a MessageTemplate then?
   */
  createAlertTemplate(config: AlertTemplateConfig): void;
  /**
   * @namespace iOS
   */
  presentTemplate(templateId: string): void;
  /**
   * @namespace iOS
   */
  dismissTemplate(templateId: string): void;

  /**
   * creates a map template that can render any react component
   */
  createMapTemplate(config: NitroMapTemplateConfig): void;

  setRootTemplate(templateId: string): void;
}
