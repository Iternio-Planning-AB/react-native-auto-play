




# React Native Auto Play

**React Native Auto Play** provides a comprehensive solution for integrating your React Native application with both **Apple CarPlay** and **Android Auto**. This library allows you to build automotive-specific user interfaces using familiar React Native components and concepts.

[![npm version](https://img.shields.io/npm/v/@iternio/react-native-auto-play.svg)](https://www.npmjs.com/package/@iternio/react-native-auto-play)
[![npm downloads](https://img.shields.io/npm/dm/@iternio/react-native-auto-play.svg)](https://www.npmjs.com/package/@iternio/react-native-auto-play)
[![License](https://img.shields.io/npm/l/@iternio/react-native-auto-play.svg)](https://github.com/Iternio-Planning-AB/react-native-auto-play/blob/master/LICENSE.md)

## Features

-   **Cross-Platform:** Write once, run on both Apple CarPlay and Android Auto.
-  **Both Architectures:** Supports both the legacy and the new React Native architecture.
-   **Template-Based UI:** Utilize a rich set of templates like `MapTemplate`, `ListTemplate`, `GridTemplate`, and more to build UIs that comply with automotive design guidelines.
-   **Navigation APIs:** Build full-featured navigation experiences with APIs for trip management, maneuvers, and route guidance.
-   **Dashboard & Cluster Support:** Extend your app's presence to the CarPlay Dashboard (CarPlay only) and instrument cluster displays (CarPlay & Android Auto).
-   **Hooks-Based API:** A modern and intuitive API using React Hooks (`useMapTemplate`, `useVoiceInput`, etc.) for interacting with the automotive system.
-   **Headless Operation:** Runs in the background to keep the automotive experience alive even when the main app is not in the foreground.
-   **Powered by [NitroModules](https://nitro.margelo.com/)**

## Installation

1.  **Install the package and its peer dependencies:**

    ```bash
    yarn add @iternio/react-native-auto-play react-native-nitro-modules
    ```

2.  **For iOS, install the pods:**

    ```bash
    cd ios && pod install && cd ..
    ```

3.  **For Android, the library will be autolinked.**

## Platform Setup

### iOS

#### Bundle identifier
To get the CarPlay app showing up you need to set a proper Bundle Identifier:
-   Open   `example.xcodeproj`
-   Select the example target, go to the  **Signing & Capabilities**  tab.
-   Under  **Signing > Bundle Identifier**, enter your unique bundle ID (e.g.,  `at.g4rb4g3.autoplay.example`).

#### Entitlements
Create a `Entitlements.plist` file in your project, paste the content below and adjust the **com.apple.developer.carplay-maps** key to your needs. Check [Apple docs](https://developer.apple.com/documentation/carplay/requesting-carplay-entitlements) for details.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>com.apple.developer.carplay-maps</key>
        <true/>
        <key>application-identifier</key>
        <string>$(AppIdentifierPrefix)$(CFBundleIdentifier)</string>
    </dict>
</plist>
```
-   Open   `example.xcodeproj`
- Select the example target, go to the **Build Settings tab** and filter for entitlement.
- On **Code Signing Entitlements** enter the path to the Entitlements.plist file you just created.

#### Scene delegates
Depending on your needs you need to set up the scene delegates. The library brings following delegates:

- WindowApplicationSceneDelegate - The main scene visible on your mobile device
- HeadUnitSceneDelegate - The main scene on CarPlay device
- DashboardSceneDelegate - Scene visible on the CarPlay overview screen usualy with some other widgets like calendar, weather or music.
- ClusterSceneDelegate - Scene visible on a cars instrument cluster.

Paste this into your Info.plist and adjust it to your needs. Check [Apple docs](https://developer.apple.com/documentation/carplay/displaying-content-in-carplay) for details.
```xml
<key>UIApplicationSceneManifest</key>
	<dict>
		<key>CPSupportsDashboardNavigationScene</key>
		<true/>
		<key>CPSupportsInstrumentClusterNavigationScene</key>
		<true/>
		<key>UIApplicationSupportsMultipleScenes</key>
		<true/>
		<key>UISceneConfigurations</key>
		<dict>
			<key>CPTemplateApplicationDashboardSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneClassName</key>
					<string>CPTemplateApplicationDashboardScene</string>
					<key>UISceneConfigurationName</key>
					<string>CarPlayDashboard</string>
					<key>UISceneDelegateClassName</key>
					<string>DashboardSceneDelegate</string>
				</dict>
			</array>
			<key>CPTemplateApplicationInstrumentClusterSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneClassName</key>
					<string>CPTemplateApplicationInstrumentClusterScene</string>
					<key>UISceneConfigurationName</key>
					<string>CarPlayCluster</string>
					<key>UISceneDelegateClassName</key>
					<string>ClusterSceneDelegate</string>
				</dict>
			</array>
			<key>CPTemplateApplicationSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneClassName</key>
					<string>CPTemplateApplicationScene</string>
					<key>UISceneConfigurationName</key>
					<string>CarPlayHeadUnit</string>
					<key>UISceneDelegateClassName</key>
					<string>HeadUnitSceneDelegate</string>
				</dict>
			</array>
			<key>UIWindowSceneSessionRoleApplication</key>
			<array>
				<dict>
					<key>UISceneClassName</key>
					<string>UIWindowScene</string>
					<key>UISceneConfigurationName</key>
					<string>WindowApplication</string>
					<key>UISceneDelegateClassName</key>
					<string>WindowApplicationSceneDelegate</string>
				</dict>
			</array>
		</dict>
	</dict>
```

#### MapTemplate
if you want to make use of the MapTemplate and render react components you need to add this to your AppDelegate.swift
This should cover old and new architecture, adjust to your needs!

```swift
@objc func getRootViewForAutoplay(
    moduleName: String,
    initialProperties: [String: Any]?
  ) -> UIView? {
    if RCTIsNewArchEnabled() {
      if let factory = reactNativeFactory?.rootViewFactory as? ExpoReactRootViewFactory {
         return factory.superView(
          withModuleName: moduleName,
          initialProperties: initialProperties,
          launchOptions: nil
        )
      }
      
      return reactNativeFactory?.rootViewFactory.view(
        withModuleName: moduleName,
        initialProperties: initialProperties
      )
    }

    if let rootView = window?.rootViewController?.view as? RCTRootView {
      return RCTRootView(
        bridge: rootView.bridge,
        moduleName: moduleName,
        initialProperties: initialProperties
      )
    }

    return nil
  }
```

#### MapTemplate maneuver dark & light mode
It is recommended to attach a listener to MapTemplate.onAppearanceDidChange and send maneuver updates based on this to make sure the colors are applied properly.
Reason for this is that CarPlay does not allow for color updates on maneuvers shown on the screen. You need to send maneuvers with a new id to get them updated properly on the screen.
The color properties do not need to handle the mode change, best practice is to use ThemedColor whenever possible and set appropriate light and dark mode colors.
This is mainly required on CarPlay for now since Android Auto lacks light mode.

#### Dashboard buttons
In case you wanna open up your CarPlay app from one of the CarPlay dashboard buttons set `launchHeadUnitScene` on the button and add this to your Info.plist. Make sure to apply your "Bundle Identifier" instead of the example one.
```xml
<key>CFBundleURLTypes</key>
<array>
	<dict>
		<key>CFBundleTypeRole</key>
		<string>Editor</string>
		<key>CFBundleURLSchemes</key>
		<array>
			<string>at.g4rb4g3.autoplay.example</string>
		</array>
	</dict>
</array>
```

### Android Auto
No platform specific setup required - we got you covered with all the required stuff.

### Android Auto Customization
You can customize certain behaviors of the library on Android Auto by setting properties in your app's `android/gradle.properties` file.

-   **Telemetry Update Interval**: Control how often telemetry data is updated.
    ```properties
    ReactNativeAutoPlay_androidTelemetryUpdateInterval=4000
    ```
    The value is in milliseconds. The default is `4000`.

-   **UI Scale Factor**: Apply a scaling factor to the React Native UI rendered on the car screen. This does not affect the templates.
    ```properties
    ReactNativeAutoPlay_androidAutoScaleFactor=1.5f
    ```
    The default value is `1.5`.

-   **Cluster Splash Screen**: Customize the splash screen shown on the instrument cluster.
    ```properties
    # Delay in milliseconds after the root component is rendered before the splash screen hides.
    ReactNativeAutoPlay_clusterSplashDelayMs=1000
    # Duration of the splash screen fade out animation in milliseconds.
    ReactNativeAutoPlay_clusterSplashDurationMs=500
    ```
    The default values are `1000` for the delay and `500` for the duration.

## Icons
The library is using [Material Symbols](https://fonts.google.com/icons) for iconography. The font is bundled with the library, so no extra setup is required. You can use these icons on both Android Auto and CarPlay.

It is also possible to use custom bundled images (e.g. PNG, WEBP or Vector Drawables). Make sure to add them to your native projects.
- iOS: Add to your `Images.xcassets`
- Android: Add to `res/drawable`

## Usage

### 1. Register the AutoPlay Components

You need to register your AutoPlay components in your app's entry file (e.g., `index.js`). This includes setting up the headless task that runs when CarPlay or Android Auto is connected.

```javascript
// index.js
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';
import registerAutoPlay from './src/AutoPlay'; // Your AutoPlay setup

AppRegistry.registerComponent(appName, () => App);
registerAutoPlay();
```

### 2. Create the AutoPlay Experience

Create a file (e.g., `src/AutoPlay.js`) to define your automotive UI. This is where you will configure your templates and the React components they will render.

```tsx
// src/AutoPlay.tsx
import {
  AutoPlayCluster,
  CarPlayDashboard,
  HybridAutoPlay,
  MapTemplate,
  useMapTemplate,
} from '@iternio/react-native-auto-play';
import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';

// A simple component that can be reused across different screens
const MyCarScreen = ({ title }: { title: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: 'white', fontSize: 24 }}>{title}</Text>
  </View>
);

// The React component to be rendered inside the MapTemplate
const MapScreen = () => {
  const mapTemplate = useMapTemplate();

  useEffect(() => {
    // Show an alert on the car screen when the component mounts
    mapTemplate?.showAlert({
      id: 'welcome-alert',
      title: { text: 'Welcome!' },
      subtitle: { text: 'Your app is now running on the car screen.' },
      durationMs: 5000,
      priority: 'low',
    });
  }, [mapTemplate]);

  return <MyCarScreen title="Hello, Map!" />;
};

const registerAutoPlay = () => {
  const onConnect = () => {
    // When a car is connected, create a MapTemplate and set it as the root
    const rootTemplate = new MapTemplate({
      component: MapScreen, // Render our map component
      headerActions: {
        android: [
          {
            type: 'image',
            image: { name: 'search', type: 'glyph' },
            onPress: () => console.log('Search pressed'),
          },
          {
            type: 'image',
            image: { name: 'cog', type: 'glyph' },
            onPress: () => console.log('Settings pressed'),
          },
        ],
        ios: {
          leadingNavigationBarButtons: [
            {
              type: 'image',
              image: { name: 'search', type: 'glyph' },
              onPress: () => console.log('Search pressed'),
            },
          ],
          trailingNavigationBarButtons: [
            {
              type: 'image',
              image: { name: 'cog', type: 'glyph' },
              onPress: () => console.log('Settings pressed'),
            },
          ],
        },
      },
    });

    rootTemplate.setRootTemplate();
  };

  // Register components for the Dashboard and Cluster
  if (Platform.OS === 'ios') {
    CarPlayDashboard.setComponent(() => <MyCarScreen title="Hello, Dashboard!" />);
  }
  AutoPlayCluster.setComponent(() => <MyCarScreen title="Hello, Cluster!" />);


  // Add listeners for car connection and disconnection events
  HybridAutoPlay.addListener('didConnect', onConnect);
  HybridAutoPlay.addListener('didDisconnect', () => {
    console.log('Car disconnected');
  });
};
export default registerAutoPlay;
```

## API Reference

### Main Object

-   `HybridAutoPlay`: The primary interface for interacting with the native module, handling connection status and events.

### Localization
The library allows you to pass distances and durations and formats them according to the system defaults.
For iOS make sure to provide all supported app languages in Info.plist CFBundleLocalizations for this to work properly, missing languages will use CFBundleDevelopmentRegion as fallback which is **en** most of the time. This results in a mix up with the region which might result in **en**_AT instead of **de**_AT for example.

### Component Props

#### RootComponentInitialProps

Every component registered with a template (e.g., via `MapTemplate`'s `component` prop) or a scene (e.g., `CarPlayDashboard.setComponent`) receives `RootComponentInitialProps` as its props. This object contains important information about the environment where the component is being rendered.

-   `id`: A unique identifier for the screen. Can be `AutoPlayRoot` for the main screen, `CarPlayDashboard` for the dashboard, or a UUID for cluster displays.
-   `rootTag`: The React Native root tag for the view.
-   `colorScheme`: The initial color scheme (`'dark'` or `'light'`). Listen for changes with the `onAppearanceDidChange` event on the template.
-   `window`: An object containing the dimensions and scale of the screen:
    -   `width`: The width of the screen.
    -   `height`: The height of the screen.
    -   `scale`: The screen's scale factor.

**iOS Specific Properties:**

On iOS, the component registered with `AutoPlayCluster.setComponent` receives additional props in its `RootComponentInitialProps` that indicate user preferences for the cluster display. You can also listen for changes to these settings.

-   `compass: boolean`: Indicates if the compass display is enabled by the user. The initial value is passed as a prop.
-   `speedLimit: boolean`: Indicates if the speed limit display is enabled by the user. The initial value is passed as a prop.

You can listen for changes to these settings using listeners on the `AutoPlayCluster` object:

```tsx
// Listen for compass setting changes
const compassCleanup = AutoPlayCluster.addListenerCompass((clusterId, isEnabled) => {
  console.log(`Compass is now ${isEnabled ? 'enabled' : 'disabled'} for cluster ${clusterId}`);
});

// Listen for speed limit setting changes
const speedLimitCleanup = AutoPlayCluster.addListenerSpeedLimit((clusterId, isEnabled) => {
  console.log(`Speed limit is now ${isEnabled ? 'enabled' : 'disabled'} for cluster ${clusterId}`);
});

// Don't forget to clean up the listeners when your component unmounts
useEffect(() => {
  return () => {
    compassCleanup();
    speedLimitCleanup();
  };
}, []);
```


### Templates

-   `MapTemplate`: For navigation apps.
-   `ListTemplate`: To display a list of items.
-   `GridTemplate`: To display a grid of items.
-   `SearchTemplate`: For search functionality.
-   `InformationTemplate`: For showing information with actions.
-   `MessageTemplate`: For displaying messages.

### Hooks

-   `useMapTemplate()`: Get a reference to the parent `MapTemplate` instance.
-   `useVoiceInput()`: Access voice input functionality - Android Auto only.
-   `useSafeAreaInsets()`: Get safe area insets for any root component.
-   `useFocusedEffect()`: A useEffect alternative that executes when the specified component is visible to the user - use any of the `AutoPlayModules` enum or a cluster uuid to sepcify the component the effect should listen for.
-   `useAndroidAutoTelemetry()`: Access to car telemetry data on Android Auto.
    ```tsx
    import {
      useAndroidAutoTelemetry,
      AndroidAutoTelemetryPermissions,
    } from '@iternio/react-native-auto-play';

    const MyComponent = () => {
      const { telemetry, permissionsGranted, error } = useAndroidAutoTelemetry({
        requiredPermissions: [
          AndroidAutoTelemetryPermissions.Speed,
          AndroidAutoTelemetryPermissions.Energy,
          AndroidAutoTelemetryPermissions.Odometer,
        ],
      });

      if (!permissionsGranted) {
        return <Text>Waiting for telemetry permissions...</Text>;
      }

      if (error) {
        return <Text>Error getting telemetry: {error}</Text>;
      }

      return (
        <View>
          <Text>Speed: {telemetry?.speed?.value} km/h</Text>
          <Text>Fuel Level: {telemetry?.fuelLevel?.value}%</Text>
          <Text>Battery Level: {telemetry?.batteryLevel?.value}%</Text>
          <Text>Range: {telemetry?.range?.value} km</Text>
          <Text>Odometer: {telemetry?.odometer?.value} km</Text>
        </View>
      );
    }
    ```
    The `telemetry` object may contain the following fields. Each field is an object with a `value` and a `timestamp`.
    - `speed`: Speed in km/h.
    - `fuelLevel`: Fuel level in %.
    - `batteryLevel`: Battery level in %.
    - `range`: Range in km.
    - `odometer`: Odometer in km.
    - `vehicle`: Vehicle information (model name, model year, manufacturer).


### Scenes

-   `CarPlayDashboard`: A component to render content on the CarPlay dashboard (CarPlay only).
-   `AutoPlayCluster`: A component to render content on the instrument cluster (CarPlay & Android Auto).

## Known Issues

### iOS

-   **Broken exceptions with `react-native-skia`**: When using `react-native-skia` up to version `2.4.7`, exceptions on iOS are not reported correctly. This is fixed in newer versions of `react-native-skia`. For more details, see this [pull request](https://github.com/Shopify/react-native-skia/pull/3595).
-   **AppState on iOS**: The `AppState` module from React Native does not work correctly on iOS because this library uses scenes, which are not supported by the stock `AppState` module. This library provides a custom state listener that works for both Android and iOS. Use `HybridAutoPlay.addListenerRenderState` instead of `AppState`.
-   **Timers stop on screen lock**: iOS stops all timers when the device's main screen is turned off. To ensure timers continue to run (which is often necessary for background tasks related to autoplay), a patch for `react-native` is required. A patch is included in the root `patches/` directory and can be applied using `patch-package`.
-   **expo-splash-screen stuck on iOS**: The `expo-splash-screen` module is broken on iOS because it does not support scenes, which are used by this library. This can cause the splash screen to be stuck on either the mobile device or on CarPlay. To fix this, a patch for `expo-splash-screen` is included in the root `patches/` directory and can be applied using `patch-package`. After applying the patch, you can hide the splash screen for a specific scene by passing the module name to the `hide` or `hideAsync` function. The module name can be one of the values from the `AutoPlayModules` enum or the UUID of a cluster screen.
    ```tsx
    import { hideAsync } from 'expo-splash-screen';
    import { AutoPlayModules } from '@iternio/react-native-auto-play';

    // Hide the splash screen for the main app
    hideAsync(AutoPlayModules.App);

    // Hide the splash screen for the CarPlay screen
    hideAsync(AutoPlayModules.AutoPlayRoot);
    ```

## Contributing

Contributions are welcome! Please submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE.md) file for details.

