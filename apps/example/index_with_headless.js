/**
 * This is an alternative entry point that demonstrates how to use
 * HybridAutoPlay.isCarServiceRunning() to prevent heavy JS initialization
 * during notification-only headless starts on Android.
 *
 * Problem:
 * On Android, both Android Auto and Firebase notifications can start the app
 * process headlessly. In both cases index.js executes and all top-level imports
 * are evaluated eagerly — including the Redux store, middleware, and other side
 * effects. These keep the process alive after the notification is handled,
 * wasting resources and battery.
 *
 * Solution:
 * Use isCarServiceRunning() to distinguish between headless starts triggered by
 * Android Auto / CarPlay and those triggered by other sources (e.g. notifications).
 * Heavy modules are loaded via lazy require() calls that only execute when actually
 * needed — either when the car service is running, when the user opens the app
 * (Activity triggers runApplication), or when AA/CP connects later.
 *
 * Scenarios:
 * 1. App starts first, then AA/CP connects:
 *    - else branch taken, lazy component provider registered
 *    - Activity renders -> provider executes, loads store/App/car listeners
 *    - didConnect fires later -> car templates created
 *
 * 2. AA/CP starts without app open (headless):
 *    - if branch taken, everything loads immediately
 *    - Car UI works, phone UI mounts later if Activity starts
 *
 * 3. Notification comes in, no app, no AA/CP:
 *    - else branch taken, but component provider never called (no Activity)
 *    - didConnect never fires (no car)
 *    - No require() calls execute -> store/middleware never load -> clean exit
 *
 * 4. Notification comes in, then app or AA/CP starts shortly after:
 *    - else branch taken initially (lightweight)
 *    - Activity or didConnect triggers lazy loading when needed
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import { HybridAutoPlay } from '@iternio/react-native-auto-play';
import { name as appName } from './app.json';

let carListenersInitialized = false;

function initCarListeners() {
  if (carListenersInitialized) return;
  carListenersInitialized = true;
  const registerRunnable = require('./src/AutoPlay').default;
  registerRunnable();
}

if (HybridAutoPlay.isCarServiceRunning()) {
  const { StateWrapper } = require('./src/state/store');
  const App = require('./src/App').default;

  AppRegistry.setWrapperComponentProvider(() => StateWrapper);
  AppRegistry.registerComponent(appName, () => App);
  initCarListeners();
} else {
  AppRegistry.registerComponent(appName, () => {
    const { StateWrapper } = require('./src/state/store');
    const App = require('./src/App').default;
    initCarListeners();
    return (props) =>
      React.createElement(StateWrapper, null, React.createElement(App, props));
  });

  HybridAutoPlay.addListener('didConnect', initCarListeners);
}
