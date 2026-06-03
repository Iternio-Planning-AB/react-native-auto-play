import type { HybridObject } from 'react-native-nitro-modules';
import type { TemplateConfig } from '../templates/Template';
import type {
  CleanupCallback,
  EventName,
  Location,
  SafeAreaInsets,
  VisibilityState,
} from '../types/Event';
import type { NitroAction } from '../utils/NitroAction';

export interface NitroTemplateConfig extends TemplateConfig {
  id: string;
}

export interface AutoPlay extends HybridObject<{ android: 'kotlin'; ios: 'swift' }> {
  /**
   * attach a listener for didConnect and didDisconnect
   * @namespace all
   * @param eventType generic events
   * @returns callback to remove the listener
   */
  addListener(eventType: EventName, callback: () => void): CleanupCallback;

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
   * Adds a listener for voice input events fired by the OS (Android Auto only).
   * On iOS this is a no-op — use startVoiceInput instead.
   * @param callback the callback to receive the voice input
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerVoiceInput(
    callback: (coordinates: Location | undefined, query: string | undefined) => void
  ): CleanupCallback;

  /**
   * Returns true if microphone permission has already been granted.
   */
  hasVoiceInputPermission(): boolean;

  /**
   * Request microphone permission from the user.
   * On Android: uses the car context when Android Auto is connected, otherwise
   * falls back to the React Native application context.
   * On iOS: uses AVAudioApplication (iOS 17+) or AVAudioSession (iOS 15–16).
   * Returns true if permission was granted, false if denied.
   */
  requestVoiceInputPermission(): Promise<boolean>;

  /**
   * Start an in-app voice recording session.
   * On Android: acquires audio focus and captures via CarAudioRecord when
   * Android Auto is connected, otherwise uses standard AudioRecord.
   * On iOS: presents CPVoiceControlTemplate (when a car is connected) and
   * captures audio via AVAudioEngine.
   * Resolves with the complete raw PCM buffer (16 kHz, 16-bit, mono) when
   * silence is detected, the max duration is reached, or stopVoiceInput() is called.
   * Rejects if microphone permission has not been granted or recording fails to start.
   */
  startVoiceInput(
    silenceThresholdMs?: number,
    maxDurationMs?: number,
    listeningText?: string
  ): Promise<ArrayBuffer>;

  /**
   * Stop the active voice recording session early. Causes the Promise returned
   * by startVoiceInput() to resolve with the audio captured so far.
   * No-op if no recording is in progress.
   */
  stopVoiceInput(): void;

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
