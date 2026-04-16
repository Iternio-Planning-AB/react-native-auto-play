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
   * Request microphone permission from the user.
   * On iOS: triggers the AVAudioSession record permission dialog.
   * On Android: triggers the Car App Library permission request (shown on the phone).
   * Returns true if permission was granted, false if denied.
   * @namespace all
   */
  requestVoiceInputPermission(): Promise<boolean>;

  /**
   * Start an in-app voice recording session.
   * On iOS: presents CPVoiceControlTemplate and begins capturing audio.
   * On Android: acquires audio focus and begins capturing via CarAudioRecord.
   * Resolves with the complete raw PCM buffer (16 kHz, 16-bit, mono) when
   * stopVoiceInput() is called.
   * Rejects if the microphone permission has not been granted or recording
   * fails to start.
   * @namespace all
   */
  startVoiceInput(silenceThresholdMs?: number, maxDurationMs?: number, listeningText?: string): Promise<ArrayBuffer>;

  /**
   * Stop the active voice recording session. Causes the Promise returned by
   * startVoiceInput() to resolve with the recorded audio.
   * On iOS: dismisses CPVoiceControlTemplate.
   * On Android: releases audio focus.
   * No-op if no recording is in progress.
   * @namespace all
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
}
