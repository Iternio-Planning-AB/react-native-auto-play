import type { HybridObject } from 'react-native-nitro-modules';
import type { AlertTemplateConfig } from '../templates/AlertTemplate';
import type { NitroMapTemplateConfig } from '../templates/MapTemplate';
import type { EventName, RemoveListener } from '../types/Event';
import type {
  PanGestureWithTranslationEventPayload,
  PinchGestureEventPayload,
  PressEventPayload,
} from '../types/GestureEvents';
import type { TemplateEventPayload, TemplateState } from '../types/TemplateEvents';

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
    templateState: TemplateState,
    callback: (payload: TemplateEventPayload | null) => void
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
