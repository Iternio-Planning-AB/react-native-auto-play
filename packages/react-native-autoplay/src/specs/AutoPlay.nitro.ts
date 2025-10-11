import type { HybridObject } from 'react-native-nitro-modules';
import type { AlertTemplateConfig } from '../templates/AlertTemplate';
import type { NitroGridTemplateConfig } from '../templates/GridTemplate';
import type { NitroListTemplateConfig } from '../templates/ListTemplate';
import type { NitroMapTemplateConfig } from '../templates/MapTemplate';
import type { CleanupCallback, EventName, SafeAreaInsets, VisibilityState } from '../types/Event';
import type { NitroAction } from '../utils/NitroAction';
import type { NitroGridButton } from '../utils/NitroGrid';
import type { NitroMapButton } from '../utils/NitroMapButton';

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * attach a listener for generic notifications like didConnect, didDisconnect, ...
   * @namespace all
   * @param eventType generic events
   * @returns token to remove the listener
   */
  addListener(eventType: EventName, callback: () => void): CleanupCallback;

  /**
   * adds a listener for the session/scene state
   * fires willAppear & didAppear when the scene/session is visible
   * fires willDisappear & didDisappear when the scene/session is not visible
   * @param mapTemplateId actually type of MapTemplateId but we can not use that one on nitro
   */
  addListenerRenderState(
    mapTemplateId: string,
    callback: (payload: VisibilityState) => void
  ): CleanupCallback;

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
  createMapTemplate(config: NitroMapTemplateConfig): CleanupCallback;

  createListTemplate(config: NitroListTemplateConfig): CleanupCallback;
  updateListTemplateSections(
    templateId: string,
    sections: NitroListTemplateConfig['sections']
  ): void;

  createGridTemplate(config: NitroGridTemplateConfig): CleanupCallback;
  updateGridTemplateButtons(templateId: string, buttons: Array<NitroGridButton>): void;

  /**
   * sets the specified template as root template, initializes a new stack
   * Promise might contain an error message in case setting root template failed
   * can be used on any Android screen/iOS scene
   */
  setRootTemplate(templateId: string): Promise<void>;

  /**
   * push a template to the AutoPlayRoot Android screen/iOS scene
   */
  pushTemplate(templateId: string): Promise<void>;

  /**
   * remove the top template from the stack
   */
  popTemplate(): Promise<void>;

  /**
   * remove all templates from the stack except the root template
   */
  popToRootTemplate(): Promise<void>;

  /**
   * callback for safe area insets changes
   * @param insets the insets that you use to determine the safe area for this view.
   */
  addSafeAreaInsetsListener(
    moduleName: string,
    callback: (insets: SafeAreaInsets) => void
  ): CleanupCallback;

  /**
   * update the map buttons on a map template
   */
  setTemplateMapButtons(templateId: string, buttons?: Array<NitroMapButton>): void;

  /**
   * update a templates actions
   */
  setTemplateActions(templateId: string, actions?: Array<NitroAction>): void;
}
