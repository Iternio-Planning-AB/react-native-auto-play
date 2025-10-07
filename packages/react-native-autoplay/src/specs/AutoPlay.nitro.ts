import type { HybridObject } from 'react-native-nitro-modules';
import type { AlertTemplateConfig } from '../templates/AlertTemplate';
import type { NitroMapTemplateConfig } from '../templates/MapTemplate';
import type { EventName, RemoveListener, SafeAreaInsets, VisibilityState } from '../types/Event';
import type { NitroMapButton } from '../utils/NitroMapButton';

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace all
   * @param eventType generic events
   * @returns token to remove the listener
   */
  addListener(eventType: EventName, callback: () => void): RemoveListener;

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
   * @returns a cleanup function, eg: removes attached listeners
   */
  createMapTemplate(config: NitroMapTemplateConfig): () => void;

  /**
   * sets the specified template as root template, initializes a new stack
   * Promise might contain an error message in case setting root template failed
   */
  setRootTemplate(templateId: string): Promise<string | null>;

  /**
   * callback for safe area insets changes
   * @param insets the insets that you use to determine the safe area for this view.
   */
  addSafeAreaInsetsListener(
    moduleName: string,
    callback: (insets: SafeAreaInsets) => void
  ): RemoveListener;

  /**
   * update the map buttons on a map template
   */
  setMapButtons(templateId: string, buttons?: Array<NitroMapButton>): void;
}
