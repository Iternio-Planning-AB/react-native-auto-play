import type { HybridObject } from 'react-native-nitro-modules';
import type { EventName, RemoveListener } from '../types/Event';
import type {
  PanGestureWithTranslationEvent,
  PinchGestureEvent,
  PressEvent,
} from '../types/GestureEvents';
import type { TemplateEvent } from '../types/TemplateEvents';

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
  addListenerDidPress(callback: (payload: PressEvent) => void): RemoveListener;

  /**
   * attach a listener for pinch to zoom and double tap events
   * @namespace Android
   */
  addListenerDidUpdatePinchGesture(callback: (payload: PinchGestureEvent) => void): RemoveListener;

  /**
   * attach a listener for pan events
   * @namespace all
   */
  addListenerDidUpdatePanGestureWithTranslation(
    callback: (payload: PanGestureWithTranslationEvent) => void
  ): RemoveListener;

  /**
   * attach a listener for template will appear events
   */
  addListenerWillAppear(
    templateId: string,
    callback: (payload: TemplateEvent | null) => void
  ): RemoveListener;

  /**
   * attach a listener for template did appear events
   */
  addListenerDidAppear(
    templateId: string,
    callback: (payload: TemplateEvent | null) => void
  ): RemoveListener;

  /**
   * attach a listener for template will disappear events
   */
  addListenerWillDisappear(
    templateId: string,
    callback: (payload: TemplateEvent | null) => void
  ): RemoveListener;

  /**
   * attach a listener for template did disappear events
   */
  addListenerDidDisappear(
    templateId: string,
    callback: (payload: TemplateEvent | null) => void
  ): RemoveListener;
}
