import type { HybridObject } from 'react-native-nitro-modules';
import type { TemplateConfig } from '../templates/Template';
import type { CleanupCallback, EventName, SafeAreaInsets, VisibilityState } from '../types/Event';
import type { NitroAction } from '../utils/NitroAction';

export interface NitroTemplateConfig extends TemplateConfig {
  id: string;
}

export interface HybridAutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
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
   * @param animate - defaults to true
   */
  popTemplate(animate?: boolean): Promise<void>;

  /**
   * remove all templates from the stack except the root template
   * @param animate - defaults to true
   */
  popToRootTemplate(animate?: boolean): Promise<void>;

  /**
   * removes all templates until the specified one is the top template
   */
  popToTemplate(templateId: string, animate?: boolean): Promise<void>;

  /**
   * callback for safe area insets changes
   * @param insets the insets that you use to determine the safe area for this view.
   */
  addSafeAreaInsetsListener(
    moduleName: string,
    callback: (insets: SafeAreaInsets) => void
  ): CleanupCallback;

  /**
   * update a templates headerActions
   */
  setTemplateHeaderActions(templateId: string, headerActions?: Array<NitroAction>): void;
}
