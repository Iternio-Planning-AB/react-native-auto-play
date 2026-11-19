import type { HybridObject } from 'react-native-nitro-modules';
import type { TemplateConfig } from '../templates/Template';
import type { CarLocation } from '../types/CarLocation';
import type {
  CleanupCallback,
  EventName,
  Location,
  SafeAreaInsets,
  VisibilityState,
} from '../types/Event';
import type { NavigationAction } from '../types/NavigationAction';
import type { NavigationIntent } from '../types/NavigationIntent';
import type { NitroAction } from '../utils/NitroAction';

export interface NitroTemplateConfig extends TemplateConfig {
  id: string;
}

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * attach a listener for didConnect and didDisconnect
   * @namespace all
   * @param eventType generic events
   * @param callback receives the id of the session that connected or disconnected, see getCurrentSessionId
   * @returns callback to remove the listener
   */
  addListener(eventType: EventName, callback: (sessionId: number) => void): CleanupCallback;

  /**
   * The id of the connected head unit session, a new one is assigned on every connect.
   * Compare it with the id didConnect passed after any await, a mismatch means the session the
   * listener was called for is gone and its templates were freed.
   * @namespace all
   * @returns the session id, undefined while no head unit is connected
   */
  getCurrentSessionId(): number | undefined;

  /**
   * adds a listener for the session/scene state
   * fires willAppear & didAppear when the scene/session is visible
   * fires willDisappear & didDisappear when the scene/session is not visible
   * @param moduleName on of @AutoPlayModules, a cluster scene uuid or your main for the WindowApplicationSceneDelegate
   */
  addListenerRenderState(
    moduleName: string,
    callback: (payload: VisibilityState) => void
  ): CleanupCallback;

  /**
   * Adds a listener for navigation intents sent by the OS, e.g. "navigate to X" or "add a stop at X"
   * by voice (Android Auto and Android Automotive).
   * An intent that arrived while no navigation intent or voice input listener was registered, e.g.
   * the one that cold-started the app, is delivered to the first listener added afterwards and then
   * dropped. It is also dropped when the head unit disconnects.
   * On iOS this is a no-op.
   * @param callback receives every navigation intent
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerNavigationIntent(callback: (intent: NavigationIntent) => void): CleanupCallback;

  /**
   * Adds a listener for custom navigation actions sent by the OS, e.g. "mute navigation" or
   * "avoid tolls" by voice (Android Auto). Actions are not held for a later listener; they only
   * matter while the app navigates, so register it while a head unit is connected.
   * On iOS this is a no-op.
   * @param callback receives every action
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerNavigationAction(callback: (action: NavigationAction) => void): CleanupCallback;

  /**
   * Adds a listener for voice input events fired by the OS (Android Auto only).
   * On iOS this is a no-op — use startVoiceInput instead.
   * @deprecated use addListenerNavigationIntent, which also carries intent, avoid, mode and entry
   * @param callback the callback to receive the voice input
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerVoiceInput(
    callback: (coordinates: Location | undefined, query: string | undefined) => void
  ): CleanupCallback;

  /**
   * Streams the head unit's own location (Android Auto CarSensors, fastest rate) while a head unit
   * is connected and at least one listener is registered. A new listener first receives the last
   * non-success status, if any. Adding a listener retries a failed registration, e.g. after the
   * location permission was granted.
   * No-op on iOS and Android Automotive, where the platform location already is the car's.
   * @param callback receives every fix and every status change
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerCarLocation(callback: (location: CarLocation) => void): CleanupCallback;

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
  setTemplateHeaderActions(templateId: string, headerActions?: Array<NitroAction>): Promise<void>;

  /**
   * Check if AutoPlay is connected.
   * @returns true if AutoPlay is connected, false otherwise.
   */
  isConnected(): boolean;

  /**
   * Check if the native AutoPlay is currently running.
   * Use this to distinguish a headless execution triggered by AA / CP
   * from one triggered by other sources (e.g. notification updates).
   */
  isCarServiceRunning(): boolean;
}
