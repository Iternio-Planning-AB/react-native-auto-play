import type { HybridObject } from 'react-native-nitro-modules';
import type { CleanupCallback } from '../types/Event';
import type { NavigationAction } from '../types/NavigationAction';
import type { NavigationIntent } from '../types/NavigationIntent';

export interface AndroidAutoNavigation extends HybridObject<{ android: 'kotlin' }> {
  /**
   * Adds a listener for navigation intents sent by the OS, e.g. "navigate to X", "add a stop at X"
   * or "find charging stations" by voice (Android Auto and Android Automotive).
   * An intent that arrived while no listener was registered, e.g. the one that cold-started the
   * app, is delivered to the first listener added afterwards and then dropped. It is also dropped
   * when the head unit disconnects.
   * @param callback receives every navigation intent
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerNavigationIntent(callback: (intent: NavigationIntent) => void): CleanupCallback;

  /**
   * Adds a listener for custom navigation actions sent by the OS, e.g. "mute navigation" or
   * "avoid tolls" by voice (Android Auto and Android Automotive). Actions are not held for a later
   * listener; they only matter while the app navigates, so register it while a head unit is
   * connected.
   * @param callback receives every action
   * @returns callback to remove the listener
   * @namespace Android
   */
  addListenerNavigationAction(callback: (action: NavigationAction) => void): CleanupCallback;
}
