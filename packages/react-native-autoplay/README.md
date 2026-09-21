




# React Native Auto Play

**React Native Auto Play** provides a comprehensive solution for integrating your React Native application with both **Apple CarPlay** and **Android Auto**. This library allows you to build automotive-specific user interfaces using familiar React Native components and concepts.

[![npm version](https://img.shields.io/npm/v/@iternio/react-native-auto-play.svg)](https://www.npmjs.com/package/@iternio/react-native-auto-play)
[![npm downloads](https://img.shields.io/npm/dm/@iternio/react-native-auto-play.svg)](https://www.npmjs.com/package/@iternio/react-native-auto-play)
[![License](https://img.shields.io/npm/l/@iternio/react-native-auto-play.svg)](https://github.com/Iternio-Planning-AB/react-native-auto-play/blob/master/LICENSE.md)

## Features

-   **Cross-Platform:** Write once, run on both Apple CarPlay and Android Auto.
-   **New Architecture:** Supports React Native new architecture only.
-   **Template-Based UI:** Utilize a rich set of templates like `MapTemplate`, `ListTemplate`, `GridTemplate`, and more to build UIs that comply with automotive design guidelines.
-   **Navigation APIs:** Build full-featured navigation experiences with APIs for trip management, maneuvers, and route guidance.
-   **Dashboard & Cluster Support:** Extend your app's presence to the CarPlay Dashboard (CarPlay only) and instrument cluster displays (CarPlay & Android Auto).
-   **Hooks-Based API:** A modern and intuitive API using React Hooks (`useMapTemplate`, `useVoiceInput`, etc.) for interacting with the automotive system.
-   **Headless Operation:** Runs in the background to keep the automotive experience alive even when the main app is not in the foreground.
-   **Powered by [NitroModules](https://nitro.margelo.com/)**

## Requirements

-   **iOS builds require Xcode 27+** (the iOS 27 SDK), even for apps that don't use any `mapConfig`/panel features — the library references `CPMapPanel`/`CPPanel` types internally behind `@available(iOS 27.0, *)` checks, but `@available` only defers *runtime* execution, not compile-time symbol resolution, so the SDK must be present to build at all.

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
-   Open your app's `.xcodeproj` in Xcode.
-   Select your app target, go to the  **Signing & Capabilities**  tab.
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
This is an example that works for bare react-native (>= 0.82) and Expo SDK 57, check [this](https://github.com/Iternio-Planning-AB/react-native-auto-play/blob/dbd33ff32ee58338282ffe0f8a970e687e1e3520/packages/react-native-autoplay/README.md?plain=1#L139) for older versions.

```swift
  @objc func getRootViewForAutoplay(
    moduleName: String,
    initialProperties: [String: Any]?
  ) -> UIView? {
    var autoPlayRootView: UIView?

    if let factory = reactNativeFactory?.rootViewFactory
      as? ExpoReactRootViewFactory
    {
      autoPlayRootView = factory.superView(
        withModuleName: moduleName,
        initialProperties: initialProperties,
        bundleConfiguration: RCTBundleConfiguration(),
        devMenuConfiguration: RCTDevMenuConfiguration(),
      )
    }

    if autoPlayRootView == nil,
      let factory = reactNativeFactory?.rootViewFactory
    {
      autoPlayRootView = factory.view(
        withModuleName: moduleName,
        initialProperties: initialProperties
      )
    }

    return autoPlayRootView
  }
```

#### MapTemplate maneuver dark & light mode
It is recommended to attach a listener to MapTemplate.onAppearanceDidChange and send maneuver updates based on this to make sure the colors are applied properly.
Reason for this is that CarPlay does not allow for color updates on maneuvers shown on the screen. You need to send maneuvers with a new id to get them updated properly on the screen.
The color properties do not need to handle the mode change, best practice is to use ThemedColor whenever possible and set appropriate light and dark mode colors.
This is mainly required on CarPlay. Android Auto redraws on its own when the day/night state changes, but note that Android Auto 17.8 introduced white templates in day mode while older versions always show dark templates. The car's day/night state (`isDarkMode`) is the same on both, so it does not tell you which template color you are drawn on. Use the `'default'` color for icons that have to stay readable in both cases, see **Icon colors and Android Auto light templates**.

#### CPListTemplate day/night header

**Known CarPlay platform bug, not fixable in this library:** on `ListTemplate` (`CPListTemplate`) only, the entire header — title text and buttons alike — doesn't track live light/dark mode switches; each toggle flips it to the *opposite* of the actual current theme instead, until the template is popped and pushed again. Other templates work fine, this seems to be an iOS 26 issue only.

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

#### ProGuard
In case you have ProGuard enabled (`def enableProguardInReleaseBuilds = true` in `android/app/build.gradle`), add the following rule to `android/app/proguard-rules.pro`:

```
-keep class com.margelo.nitro.swe.iternio.reactnativeautoplay.** { *; }
```

#### Native backdrop under the MapTemplate surface
On Android the React content of a `MapTemplate` is rendered onto the car screen through a virtual display. Some native views cannot be hosted there as React Native views — Fragment-based map SDK wrappers, for example, are bound to the phone `Activity`. For those the library can place a host-provided native `View` **under** the React surface of a display: the Android counterpart of the iOS `getRootViewForAutoplay` hook above. Your React tree then draws on top of it as an overlay. The factory is asked for the root display and for each cluster display, and may answer `null` for either.

```kotlin
interface NativeBackdrop {
    /** Added as the presentation root's FIRST child, match-parent. */
    val view: View

    /** The car's day/night changed (CarContext.isDarkMode) — redraw accordingly. */
    fun onColorSchemeChanged(dark: Boolean)

    /** Release everything; must be idempotent. */
    fun destroy()
}

/** Which car display is asking for a backdrop. */
enum class NativeBackdropDisplay { ROOT, CLUSTER }

object NativeBackdropRegistry {
    /** Return null to render that display without a backdrop. */
    @Volatile
    var factory: ((CarContext, NativeBackdropDisplay) -> NativeBackdrop?)? = null
}
```

Register the factory in your `Application.onCreate`, before the `CarAppService` can start:

```kotlin
NativeBackdropRegistry.factory = { carContext, display ->
    when (display) {
        NativeBackdropDisplay.ROOT -> MyMapBackdrop(carContext)
        NativeBackdropDisplay.CLUSTER -> null   // or a second map view for the cluster
    }
}
```

Lifecycle contract:

-   The factory is consulted once per presentation of each display — i.e. again after every surface resize — and each backdrop is destroyed when its presentation is replaced or the renderer stops. A `destroy()` that throws is logged and does not interrupt teardown.
-   A factory that throws is logged and ignored; the React surface still renders.
-   The React surface view is transparent only while a backdrop is attached. Without a registered factory nothing changes: the surface stays opaque as before.
-   `onColorSchemeChanged(dark)` is forwarded from each session's `onCarConfigurationChanged` to that display's backdrop, so it can follow the car's day/night setting (car app quality guideline MR-1). It fires regardless of which template is currently on screen.

### Android Auto Customization
You can customize certain behaviors of the library on Android Auto by setting properties in your app's `android/gradle.properties` file.

-   **App Category**: Declare which Android Auto / Automotive app type the `CarAppService` advertises — the Android counterpart to choosing your CarPlay scene type in `Info.plist`.
    ```properties
    ReactNativeAutoPlay_androidAutoAppCategory=navigation
    ```
    Supported values are `navigation`, `poi`, `parking`, `charging`, `iot`, `messaging`, `calling`, and `weather` (see the [supported app categories](https://developer.android.com/training/cars)); each maps to `androidx.car.app.category.<UPPERCASE>`. An unrecognized value fails the build. The default `navigation` keeps the existing behavior. Any other value selects a lean manifest that declares the chosen category and omits the navigation-only permissions (`NAVIGATION_TEMPLATES`, `MAP_TEMPLATES`, `ACCESS_SURFACE`), the `FEATURE_CLUSTER` category, and the `NAVIGATE`/`geo` intent filters — a non-navigation, no-map template app needs none of these, and declaring them gets the app reviewed against the navigation-app bar on the Play Store.

    On Android Automotive, the app-focus helpers on `HybridAndroidAutomotive` (`requestAppFocus`, `registerAppFocusListener`, `getAppFocusState`) request/observe **navigation** focus specifically; they are meant for navigation apps and should not be used with a non-navigation category.

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

### Android Automotive

This library also supports Android Automotive. To enable Android Automotive support, you need to configure a few properties in your Android project.

-   **`minSdkVersion`**: The minimum API level for Android Automotive is 29. You must set `minSdkVersion` to at least `29`. For Android Auto, the minimum is `24`.

-   **`isAutomotiveApp` flag**: You need to inform the library if this is an Automotive app by setting the `isAutomotiveApp` property to `true`. For Android Auto, it should be `false`.

You can set these properties directly in your `android/gradle.properties` file. **Note the
`ReactNativeAutoPlay_` prefix** — the library reads `rootProject.ext.<name>` first and falls
back to the prefixed project property, so an unprefixed `isAutomotiveApp=true` in
`gradle.properties` is silently ignored and you get an Android Auto build instead:

```properties
# For Android Automotive
ReactNativeAutoPlay_minSdkVersion=29
ReactNativeAutoPlay_isAutomotiveApp=true
```

If your app's `android/build.gradle` already defines `ext.minSdkVersion` (the React Native
template does), that `rootProject.ext` value wins over the property above — raise it there
instead.

Alternatively, if you need to support different build variants (e.g., for both Android Auto and Android Automotive from the same codebase), using `react-native-config` is the recommended approach.

1.  Install `react-native-config`:
    ```bash
    yarn add react-native-config
    ```

2.  Create different `.env` files for your variants. Create a default `.env` for Android Auto:
    ```
    # .env (for Android Auto)
    isAutomotiveApp=false
    minSdkVersion=24
    ```
    And an `.env.automotive` for Android Automotive:
    ```
    # .env.automotive
    minSdkVersion=29
    isAutomotiveApp=true
    ```

3.  In your `android/app/build.gradle`, apply the configuration from `react-native-config` based on your build flavors.
    ```groovy
    // android/app/build.gradle

    project.ext.envConfigFiles = [
        automotive: ".env.automotive",
        // other flavors...
    ]
    apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"

    if (project.ext.has("env")) {
        rootProject.ext.minSdkVersion = project.ext.env.minSdkVersion
        rootProject.ext.isAutomotiveApp = project.ext.env.isAutomotiveApp
    }
    ```
Adjust to the build variants your app provides. Check the example app for details.

This approach allows you to dynamically set the required flags based on your build variant, which is demonstrated in the example app.

#### App launch on Android Automotive

Android Automotive requires you to remove your app activity since it invokes the libraries Android Auto service in a different way. Not doing so will bring up 2 app icons on the Android Automotive launcher.
To get rid of your default activity, do an automotive specific build variant and add this AndroidManifest.xml for that variant.
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <application>
        <activity
            android:name=".MainActivity"
            tools:node="remove" /> <!-- remove main activity -->
    </application>

</manifest>
```
For details check the example app and its build variants.

#### Non-template Automotive app ####

The library can also be used for Android Automotive apps that do not make use of templates. In case you do a navigation app HybridAndroidAutomotive provides methods to monitor and request the app focus to let the system know your app is taking over the navigation focus.
Do not use app focus related functions on template applications as it fights with the navigation manager used on the map template.

#### A Note on Android Studio

When using build variants, Android Studio may not be aware of the selected variant during a Gradle sync. This can cause the IDE to show the incorrect implementation of native classes like `AndroidTelemetryObserver` (e.g., it might show the Android Auto version instead of the Automotive version).

To work around this and allow for debugging or enhancing the Android Automotive-specific implementation, you can temporarily set the automotive flags in your `gradle.properties` file or your default `.env` file before running a Gradle sync.

## Icons
The library does **not** bundle any icon font — the consuming app must provide one.

### Setup

1. Add a `.ttf` font file to your native projects:
   - **iOS** — add `<name>.ttf` to your app bundle (no `UIAppFonts` entry needed — the library registers it via CoreText automatically).
   - **Android** — place `<name>.ttf` in `res/font/`.

   For cross-platform compatibility use **lowercase names with underscores only** (e.g. `material_symbols`).

**or**

1. use expo-font
    ```js
    [
      'expo-font',
      {
        android: {
          fonts: [
            {
              fontFamily: 'MaterialSymbols',
              fontDefinitions: [
                {
                  path: './assets/fonts/material_symbols.ttf',
                  weight: 800,
                },
              ],
            },
          ],
        },
        ios: ['./assets/fonts/material_symbols.ttf'],
      },
    ],
    ```
    For cross-platform compatibility use **lowercase names with underscores only** (e.g. `material_symbols`).

2. Register the font and an optional glyph map at startup:

   ```ts
   import { setIconFont } from '@iternio/react-native-auto-play';
   import { glyphMap } from './assets/Glyphmap';

   setIconFont('material_symbols', glyphMap);
   ```

3. Use glyph images by name or code point:

   ```ts
   { type: 'glyph', name: 'directions_car' }
   { type: 'glyph', codepoint: 0xe531 }
   ```

`setIconFont` must be called once before the first glyph is used (subsequent calls are ignored). If no font is registered, the library throws an error when a glyph image is rendered.

### Type-safe glyph names

To get autocompletion and type checking for glyph names, create a declaration file in your app (e.g. `autoplay-glyphs.d.ts`):

```ts
import type { GlyphName } from './assets/Glyphmap';

declare module '@iternio/react-native-auto-play' {
  interface AutoPlayGlyphMap extends Record<GlyphName, number> {}
}
```

Without this augmentation, `name` accepts any `string`. With it, only keys from your glyph map are allowed and you get full autocompletion.

The example app uses [Material Symbols](https://fonts.google.com/icons). See `apps/example/assets/symbolFont/` for the glyph map generation script.

It is also possible to use custom bundled images (e.g. PNG, WEBP or Vector Drawables). Make sure to add them to your native projects.
- iOS: Add to your `Images.xcassets`
- Android: Add to `res/drawable`

### Icon colors and Android Auto light templates

Starting with **Android Auto 17.8** the host can show white (light) templates in day mode. Older versions (e.g. 17.6) always use dark templates, even in day mode. Both report the same car app API level, so an app cannot tell them apart, and a fixed icon color that is readable on one (white on dark) can be invisible on the other (white on white).

Use the color `'default'` for every monochrome icon that has to stay readable in both cases:

```ts
{ type: 'glyph', name: 'search', color: 'default' }
{ type: 'asset', image: require('./icon.png'), color: 'default' }
{ type: 'remote', uri: 'https://example.com/icon.png', color: 'default' }
```

-   **Android Auto**: the host tints the icon with its own default icon color for the template it is currently showing, so it follows dark and light templates on every Android Auto version.
-   **CarPlay**: `'default'` resolves to black in light mode and white in dark mode, so it is safe to use on iOS and does not change anything there.
-   **Glyphs** use `'default'` automatically when no `color` is set.
-   **Asset and remote images** are not tinted unless you set a `color`, so colorful images such as a logo keep their original colors. Only pass `'default'` for monochrome icons.
-   Any other color (a string or a `ThemedColor`) is applied as specified. Only use those where the color works on both dark and light templates, e.g. a colored icon.
-   Known limitation: the host may not apply the tint to header action icons on Android Auto 17.8. That is an issue in Android Auto itself, not something the library can work around.

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

### Core Types

#### AutoText
Most text props accept `AutoText` so you can localize and provide variants. You can pass either a string or an object with `text`/`variants` as used throughout the example app.

#### AutoImage
Images are provided as `AutoImage` objects with a `type` and `name`. The built-in icon set is Material Symbols (see **Icons**). You can also use bundled images from your native project.

#### RootComponentInitialProps
All root components rendered by templates/scenes receive `RootComponentInitialProps`:

-   `id`: Module identifier (e.g. `AutoPlayRoot`, `CarPlayDashboard`, or a cluster UUID).
-   `rootTag`: React Native root tag.
-   `colorScheme`: `'light' | 'dark'` initial color scheme (listen to `onAppearanceDidChange` on `MapTemplate` for updates). On Android Auto this is the car's day/night state and does not tell you whether the templates are dark or white (17.8+ can show white templates in day mode, older versions never do).
-   `window`: `{ width, height, scale }`.

### Template Configs (Props)

Below is a concise overview of the most important props per template. Optional props are marked as **optional**. Required props are marked as **required**.

#### MapTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `component` | `React.ComponentType<RootComponentInitialProps>` | ✅ | React component to render on the map surface. |
| `onStopNavigation` | `(template: MapTemplate) => void` | ✅ | Called when navigation is stopped by the system. |
| `headerActions` | `MapHeaderActions<MapTemplate>` | ❌ | Top action strip. See **Header Actions** below. |
| `mapButtons` | `MapButtons<MapTemplate>` | ❌ | 1–4 map buttons shown on the map. To get working gestures on the MapTemplate running on Android Auto you have to add a `MapPanButton` |
| `visibleTravelEstimate` | `'first'` `'last'` | ❌ | Which travel estimate to display. |
| `optionsPanel` | `OptionsPanelConfig<MapTemplate>` | ❌ | **iOS 27+ only, no-op on Android.** Panel shown when tapping the ellipsis button next to the travel estimates during active navigation. See **Options Panel** below. |
| `onDidPan` / `onDidUpdateZoomGestureWithCenter` | callbacks | ❌ | Map gesture events. |
| `onAppearanceDidChange` | `(colorScheme) => void` | ❌ | Listen for light/dark mode changes. |
| `onAutoDriveEnabled` | `(template) => void` | ⚠️ | Android-only auto drive callback. Make sure to take action when receiving this and simulate a drive to the set destination. [Check Android docs for details](https://developer.android.com/reference/androidx/car/app/navigation/NavigationManagerCallback#onAutoDriveEnabled()) |

#### ListTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `AutoText` | ✅ | Header title. |
| `sections` | `Section<ListTemplate>` | ❌ | List sections/rows. Not providing anything here will result in a loading indicator on Android and an empty list on iOS. |
| `headerActions` | `HeaderActions<ListTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `mapConfig` | `BaseMapTemplateConfig<ListTemplate>` | ❌ | Android map-with-content layout. **iOS 27+**: renders as a `CPMapPanel` on the current root map template instead. See **Map + Content** below. |

#### GridTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `AutoText` | ✅ | Header title. |
| `buttons` | `GridButton<GridTemplate>[]` | ✅ | Grid items. Providing an empty array will result in a loading indicator on Android and an empty template on iOS. |
| `headerActions` | `HeaderActions<GridTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `imageSize` | `'unset'` `'large'` `'medium'` `'small'` | ❌ | **Android only**, requires Android Car API 8. Controls grid item image size; defaults to `unset` (platform default layout). Ignored (with a `__DEV__` warning) when `mapConfig` is also set — `MapWithContentTemplate` doesn't support the sized grid content type. |
| `mapConfig` | `BaseMapTemplateConfig<GridTemplate>` | ❌ | Android map-with-content layout. **iOS 27+**: renders as a `CPMapPanel` on the current root map template instead. See **Map + Content** below. |

#### SearchTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `AutoText` | ✅ | Header title. |
| `results` | `SearchSection<SearchTemplate>` | ❌ | Initial results. |
| `headerActions` | `HeaderActions<SearchTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `searchHint` | `string` | ❌ | Android-only placeholder. |
| `initialSearchText` | `string` | ❌ | Android-only initial value. |
| `onSearchTextChanged` | `(text) => void` | ✅ | Fired on text input changes. |
| `onSearchTextSubmitted` | `(text) => void` | ✅ | Fired on submit. |

#### InformationTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `AutoText` | ✅ | Header title. |
| `items` | `InformationItems` | ❌ | 1–4 rows. |
| `actions` | platform-specific | ❌ | Up to 2 buttons on Android, up to 3 on iOS. **iOS 27+ with `mapConfig` set**: at most 1 `TextButton` plus 1 icon-only `ImageButton`, enforced at the type level. |
| `headerActions` | `HeaderActions<InformationTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `mapConfig` | `BaseMapTemplateConfig<InformationTemplate>` | ❌ | Android map-with-content layout. **iOS 27+**: renders as a `CPMapPanel` on the current root map template instead. See **Map + Content** below. |

#### MessageTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `message` | `AutoText` | ✅ | Main message text. |
| `title` | `AutoText` | ❌ | Android header title. |
| `image` | `AutoImage` | ❌ | Android-only image above the message. |
| `actions` | platform-specific | ❌ | Up to 2 buttons on Android, up to 3 on iOS. **iOS 27+ with `mapConfig` set**: at most 1 `TextButton` plus 1 icon-only `ImageButton`, enforced at the type level. |
| `headerActions` | `HeaderActions<MessageTemplate>` | ❌ | Header actions. See **Header Actions** below. **iOS**: `ios` only takes effect once this renders as a `CPMapPanel` (`mapConfig` set, iOS 27+) — without `mapConfig` (or below iOS 27) this is a full-screen `CPAlertTemplate` with no nav bar, so `ios` is silently unused. |
| `mapConfig` | `BaseMapTemplateConfig<MessageTemplate>` | ❌ | Android map-with-content layout. **iOS 27+**: renders as a `CPMapPanel` on the current root map template instead, trading the usual full-screen modal alert for panel content. See **Map + Content** below. |

#### SignInTemplateConfig (Android-only)

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `signInMethod` | `SignInMethod` | ✅ | The sign-in method configuration. Can be QRSignIn, PinSignIn, InputSignIn. |
| `title` | `string` | ❌ | Header title. |
| `additionalText` | `string` | ❌ | Additional descriptive text. |
| `instructions` | `string` | ❌ | Sign-in Instructions text. |
| `actions` | `ActionButton<SignInTemplate>[]` | ❌ | Up to 2 buttons. |
| `headerActions` | `SignInHeaderActions<SignInTemplate>` | ❌ | Header actions. See **Header Actions** below. |

**SignInMethod**

| Method | Type | Notes |
| --- | --- | --- |
| QR | `QrSignIn` | QR Code sign in |
| PIN | `PinSignIn` | PIN Code sign in (1–12 characters) |
| Input | `InputSignIn` | Text sign in, for example mail/username and password |

For InputSignIn the keyboard and input fields can be configured with following properties:

**KeyboardType enum:** `DEFAULT`, `EMAIL`, `PHONE`, `NUMBER`

**TextInputType enum:** `PASSWORD`, `DEFAULT`


### Header Actions (Important)

On Android, header actions may be omitted, although this is not recommended. If `headerActions` is `undefined`, the system automatically renders the app icon in the header. Because Android Auto enforces monochrome icons, this can result in a poor-looking button.

**Use these rules to avoid crashes:**

1. **For List/Grid/Information/Search/Message/SignIn templates on Android**, always pass the structured object format (alignment is implicit via `startHeaderAction`/`endHeaderActions`):

```ts
const headerActions: HeaderActions<MyTemplate> = {
  android: {
    startHeaderAction: { type: 'back', onPress: (t) => HybridAutoPlay.popTemplate() },
    endHeaderActions: [
      { type: 'image', image: { name: 'help', type: 'glyph' }, onPress: () => {} },
    ],
  },
  ios: {
    backButton: { type: 'back', onPress: (t) => HybridAutoPlay.popTemplate() },
    trailingNavigationBarButtons: [
      { type: 'image', image: { name: 'close', type: 'glyph' }, onPress: () => {} },
    ],
  },
};
```

⚠️ **Do not pass a raw array of actions** to `headerActions` on Android for these templates. Arrays are only valid for **MapTemplate** header actions (see below). Passing an array for header-based templates results in actions without alignment and can crash on Android.

2. **For MapTemplate on Android**, you can use the array format (1–4 actions) for the action strip:

```ts
const mapHeaderActions: MapTemplateConfig['headerActions'] = {
  android: [
    { type: 'image', image: { name: 'list', type: 'glyph' }, onPress: () => {} },
    { type: 'image', image: { name: 'search', type: 'glyph' }, onPress: () => {} },
  ],
  ios: {
    leadingNavigationBarButtons: [
      { type: 'image', image: { name: 'list', type: 'glyph' }, onPress: () => {} },
    ],
  },
};
```

**Header action shapes (structured overview):**

| Platform | Property | Shape | Limits / Notes |
| --- | --- | --- | --- |
| Android (header templates) | `headerActions.android` | `{ startHeaderAction?, endHeaderActions? }` | `endHeaderActions`: 1–2 buttons. `startHeaderAction` can be `appIcon`/`back`/custom. |
| Android (MapTemplate) | `headerActions.android` | `ActionButton[]` | 1–4 action strip buttons. |
| iOS | `headerActions.ios` | `{ backButton?, leadingNavigationBarButtons?, trailingNavigationBarButtons? }` | Each list supports 1–2 buttons. `backButton` optional (system back is added if omitted). |

### Actions & Button Types (Quick Reference)

-   **Android header actions** use `startHeaderAction` + `endHeaderActions`:
    - `startHeaderAction`: `AppButton | BackButton | ActionButton`
    - `endHeaderActions`: 1–2 buttons
    - **If `headerActions` is omitted**: Android renders the **app icon** automatically.
-   **iOS header actions** use:
    - `backButton` (optional, otherwise iOS provides a default back action)
    - `leadingNavigationBarButtons` (1–2)
    - `trailingNavigationBarButtons` (1–2)
-   **MapTemplate map buttons**: 1–4 buttons, including the special `pan` button.

### Event & Listener APIs

This section lists the available listeners and lifecycle callbacks so you can wire up connection state, visibility, cluster settings, and system events.

#### HybridAutoPlay listeners

| API | Payload | Notes |
| --- | --- | --- |
| `HybridAutoPlay.addListener(event, cb)` | event: `'didConnect'` `'didDisconnect'` | Connection changes for the head unit. |
| `HybridAutoPlay.addListenerRenderState(moduleName, cb)` | `cb(visibility: 'willAppear' \| 'didAppear' \| 'willDisappear' \| 'didDisappear')` | Use `AutoPlayModules.*` or a cluster UUID. |
| `HybridAutoPlay.addListenerVoiceInput(cb)` | `cb(location?, query?)` | Android-only. Fires when the OS triggers a voice input event (e.g. "Hey Google, navigate to…"). For in-app recording use `startVoiceInput` instead. |
| `HybridAutoPlay.addSafeAreaInsetsListener(moduleName, cb)` | `cb(insets)` | Safe area inset changes for any module. |

```ts
import { AutoPlayModules, HybridAutoPlay } from '@iternio/react-native-auto-play';

const cleanup = HybridAutoPlay.addListener('didConnect', () => {
  console.log('Head unit connected');
});

const removeVisibility = HybridAutoPlay.addListenerRenderState(
  AutoPlayModules.AutoPlayRoot,
  (state) => console.log('AutoPlayRoot state', state)
);
```

#### Template lifecycle callbacks

All templates accept these lifecycle callbacks in their config:

- `onWillAppear(animated?)`
- `onDidAppear(animated?)`
- `onWillDisappear(animated?)`
- `onDidDisappear(animated?)`
- `onPopped()` (not supported on all iOS templates, see notes in code)

```ts
const template = new ListTemplate({
  title: { text: 'Menu' },
  onWillAppear: () => console.log('will appear'),
  onPopped: () => console.log('popped forever'),
});
```

#### MapTemplate callbacks

Map-specific callbacks live on `MapTemplateConfig`:

- `onDidPan({ x, y })`
- `onDidUpdateZoomGestureWithCenter({ x, y }, scale)`
- `onClick({ x, y })` (Android)
- `onDoubleClick({ x, y })` (Android)
- `onAppearanceDidChange(colorScheme)`
- `onAutoDriveEnabled(template)` (Android)
- `onStopNavigation(template)` (**required**)

#### AutoPlayCluster listeners (instrument cluster)

| API | Payload | Notes |
| --- | --- | --- |
| `AutoPlayCluster.addListenerColorScheme(cb)` | `(clusterId, colorScheme)` | iOS + Android. |
| `AutoPlayCluster.addListenerZoom(cb)` | `(clusterId, zoomEvent)` | iOS only. |
| `AutoPlayCluster.addListenerCompass(cb)` | `(clusterId, enabled)` | iOS only. |
| `AutoPlayCluster.addListenerSpeedLimit(cb)` | `(clusterId, enabled)` | iOS only. |

```ts
const removeCompass = AutoPlayCluster.addListenerCompass((clusterId, enabled) => {
  console.log('Cluster', clusterId, 'compass', enabled);
});
```

#### CarPlayDashboard listeners (iOS)

| API | Payload | Notes |
| --- | --- | --- |
| `CarPlayDashboard.addListener(event, cb)` | event: `'didConnect'` `'didDisconnect'` | Connection changes for the dashboard scene. |
| `CarPlayDashboard.addListenerRenderState(cb)` | `cb(visibility)` | Scene visibility changes. |
| `CarPlayDashboard.addListenerColorScheme(cb)` | `cb(colorScheme)` | Light/dark changes. |

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

| Template | Purpose | Notes |
| --- | --- | --- |
| `MapTemplate` | Navigation, map rendering | Use as root; supports map buttons & navigation APIs. |
| `ListTemplate` | Lists/menus | Supports sections, radio/toggle rows. Can render as a CarPlay map panel, see **Map + Content**. |
| `GridTemplate` | Action grid | Use `GridButton` items. Can render as a CarPlay map panel, see **Map + Content**. |
| `SearchTemplate` | Search UI | Android-only search bar callbacks. |
| `InformationTemplate` | Info panels | Android uses PaneTemplate; iOS uses InformationTemplate. Can render as a CarPlay map panel, see **Map + Content**. |
| `MessageTemplate` | Modal messages | Always shown on top until popped (a true full-screen modal alert on iOS). Can render as a CarPlay map panel instead, see **Map + Content**. |

**Template quick examples:**

```ts
// MapTemplate
const map = new MapTemplate({
  component: MapScreen,
  onStopNavigation: () => {},
  headerActions: { android: [{ type: 'image', image: { name: 'list', type: 'glyph' }, onPress: () => {} }] },
});
map.setRootTemplate();

// ListTemplate
new ListTemplate({
  title: { text: 'Destinations' },
  sections: [{ type: 'default', title: 'Recent', items: [{ type: 'default', title: { text: 'Home' }, onPress: () => {} }] }],
  headerActions: { android: { startHeaderAction: { type: 'back', onPress: () => {} } } },
}).push();
```

### Map + Content (`mapConfig`)

`ListTemplate`, `GridTemplate`, `InformationTemplate`, and `MessageTemplate` all accept an optional `mapConfig` prop. Setting it (an empty object is enough — no actions need to be specified) gives the template a map background instead of its normal full-screen presentation. The two platforms implement this completely differently, so behavior and limitations differ accordingly.

```ts
new ListTemplate({
  title: { text: 'Nearby' },
  sections: [{ type: 'default', title: 'Stops', items: [{ type: 'default', title: { text: 'Charger' }, onPress: () => {} }] }],
  mapConfig: {},
}).push();
```

#### Android

`mapConfig` wraps the template in a `MapWithContentTemplate`, giving it a map background while the template's own content (list, grid, info, or message) is laid out on top.

#### iOS (27+)

`mapConfig` instead renders the template as a [`CPMapPanel`](https://developer.apple.com/documentation/carplay/cpmappanel) — an overlay shown **on the current root map template** (a `MapTemplate` set via `setRootTemplate()`). On iOS versions below 27, `mapConfig` is currently a no-op and the template renders normally (there is no map-background equivalent pre-27).

```ts
// Root map template must already be set for the panel to have somewhere to attach to
new MapTemplate({ component: MapScreen, onStopNavigation: () => {} }).setRootTemplate();

// Pushing this on top now shows it as an overlay panel on the map, instead of a full-screen list.
// headerActions.ios.backButton is required here — as the first (and only) panel in the stack it
// gets no native close/back control (see "Things that behave differently in panel mode" below),
// so without it the driver has no way to leave the panel.
new ListTemplate({
  title: { text: 'Nearby' },
  sections: [{ type: 'default', title: 'Stops', items: [{ type: 'default', title: { text: 'Charger' }, onPress: () => {} }] }],
  headerActions: { ios: { backButton: { type: 'back', onPress: () => HybridAutoPlay.popTemplate() } } },
  mapConfig: {},
}).push();
```

**Panels share the same push/pop stack as regular templates** — this is a library-level abstraction, not how Apple's API actually works. From your JS code's perspective, `.push()`, `HybridAutoPlay.popTemplate()`/`popToRootTemplate()`/`popToTemplate()`, and the lifecycle callbacks (`onWillAppear`, `onDidAppear`, etc.) behave the same whether the top of the stack is a panel or a regular pushed template — you can mix and pop through both without caring which is which. Natively, however, `CPMapPanel` is **not** part of `CPInterfaceController`'s template stack at all — Apple's API gives it its own, completely separate panel stack that lives on the `CPMapTemplate` that pushed it (`pushPanel`/`popPanel`/`CPMapPanelDelegate`, unrelated to `CPInterfaceController.pushTemplate`/`popTemplate`). This library tracks both stacks together internally and presents one unified stack to JS, so if you go looking at Apple's CarPlay documentation expecting to see panels integrated with `CPInterfaceController`, you won't find it there — that integration is something this library provides on top.

**Things that behave differently in panel mode:**

-   **`headerActions`/`mapButtons` ownership**: while a panel is shown, it takes over the root map template's bar buttons and floating map buttons — using the panel template's **own** `headerActions`/`mapConfig.mapButtons`, not `mapConfig.headerActions` (which is Android-only; on iOS it's ignored, since there's no separate header for the map behind a panel). The map template's own buttons are restored automatically once the panel is popped.
-   **The first panel must provide its own way to be closed**: CarPlay's native close button (✕) is always disabled on every panel — this library turns it off globally, and this is required for correct lifecycle tracking, not a style choice. Tapping ✕ on the topmost panel doesn't just pop that one panel — it discards the *entire* panel stack down to the map, covered panels included — but `CPMapPanelDelegate.panelDidHide` only ever fires once, for the topmost panel. This library would have no callback at all for the covered panels CarPlay silently destroyed underneath it: they'd stay tracked forever, `onPopped` would never fire for them, and their listeners/native templates would leak. The back chevron doesn't have this problem — it only ever pops one level, always the topmost panel — so it's left enabled: once a second panel is pushed, CarPlay shows it automatically to return to the first, and it isn't customizable. The first panel in the stack gets no such control, though, so it needs its own way out: `headerActions.ios.backButton` (supported by all four panel-capable templates, including `MessageTemplate` once `mapConfig` is set) or something inside the panel's own content (a list item, or `MessageTemplate`'s required `actions.ios[0]` `TextButton`) that calls `popTemplate()`/`popToRootTemplate()`. Without one, the driver has no way to leave that first panel short of `autoDismissMs`.
-   **`InformationTemplate`/`MessageTemplate` `actions`**: a `CPMapPanel`'s button configuration only supports one `TextButton` (with a title) plus one optional icon-only `ImageButton` (any title on it is dropped natively) — far fewer than the up-to-3-`TextButton` shape available without `mapConfig`. The type system enforces this: `actions.ios` is restricted to `[TextButton]` or `[TextButton, ImageButton]` whenever `mapConfig` is set.
-   **`MessageTemplate` stops being a true modal**: normally `MessageTemplate` is a full-screen, blocking alert (`CPAlertTemplate`) that covers everything regardless of OS version. With `mapConfig` set, it instead becomes dismissible panel content in the regular push/pop stack — a deliberate trade-off, not a partial implementation.

**Known iOS 27 beta limitations** (not something fixable in this library — re-test against newer betas):

-   The optional icon-only `symbolButton` in a panel's button configuration does not appear to respond to taps at all on this beta — the button renders correctly, but its press handler is never invoked by CarPlay.
-   `toggle` row accessory images render noticeably smaller inside a panel than in a regular (non-panel) `ListTemplate` — this is how Apple sizes `CPListItem.accessoryImage` on panels specifically, not something this library controls (see the `CPListItem.accessoryImage` known issue under **Options Panel** for the same underlying sizing bug's non-panel form).

### Waypoint Rows (`type: 'waypoint'`)

Any list section (`ListTemplate.sections`, or an `OptionsPanel` list section — see below) can include a `waypoint` row alongside the usual `default`/`toggle`/`radio`/`text` rows:

```ts
{
  type: 'waypoint',
  title: { text: 'Supercharger' },
  address: 'Main St 1\n1234 Springfield',
  coordinate: { latitude: 48.2, longitude: 16.37 },
  travelEstimates: {
    distance: { unit: 'kilometers', value: 12 },
    duration: { timezone: 'Europe/Vienna', seconds: 600 },
    visible: true,
  },
  image: { type: 'glyph', name: 'pin_drop' },
  onPress: () => {},
}
```

**iOS 27+ inside a `CPMapPanel`** (i.e. the enclosing `ListTemplate`/`GridTemplate` has `mapConfig` set, or this row is part of an `OptionsPanel` list section): renders as a real [`CPMapTemplateWaypoint`](https://developer.apple.com/documentation/carplay/cpmaptemplatewaypoint) item — `title` becomes the name, `address` the address, `image` the leading image (see the known-issue note below on image sizing). `travelEstimates.distance`/`.duration` are always sent to the native waypoint object (CarPlay requires them structurally), but they're **not shown by the waypoint item itself** — set `travelEstimates.visible: true` to additionally insert a sibling native [`CPTravelEstimates`](https://developer.apple.com/documentation/carplay/cptravelestimates) row right after it. This is a static snapshot, not live-updating — re-set `distance`/`duration` yourself (e.g. via `updateSections`/`updateOptionsPanel`) if it needs to track a changing location; there's no lighter-weight update path for just this value today.

**Everywhere else** (non-panel `ListTemplate`, Android, iOS < 27): falls back to a plain row, using `title` as the row title and `address` as the detail text — `travelEstimates.visible` has no effect here. Instead, reference `TextPlaceholders.Distance`/`TextPlaceholders.Duration` inside `title.text`/`address` yourself and this library fills them in automatically (the same substitution mechanism `AutoText.distance`/`.duration` already do everywhere):

```ts
{
  type: 'waypoint',
  title: { text: `Supercharger (${TextPlaceholders.Distance})` },
  address: `Main St 1 · ${TextPlaceholders.Duration} away`,
  travelEstimates: { distance: { unit: 'kilometers', value: 12 }, duration: { timezone: 'Europe/Vienna', seconds: 600 } },
  coordinate: { latitude: 48.2, longitude: 16.37 },
  onPress: () => {},
}
```

### Options Panel (`optionsPanel`, iOS 27+)

`MapTemplate`'s `optionsPanel` prop configures the panel CarPlay shows when the user taps the ellipsis button next to the travel estimates during active navigation. It's a no-op on Android and on iOS below 27.

```ts
mapTemplate.updateOptionsPanel({
  title: { text: 'Trip options' },
  sections: [
    {
      type: 'list',
      title: 'Route',
      items: [{ type: 'default', title: { text: 'Avoid tolls' }, onPress: () => {} }],
    },
    {
      type: 'charger',
      title: 'Charger',
      location: {
        name: 'Fast Network Inc.',
        address: 'Main St 1',
        coordinate: { latitude: 48.2, longitude: 16.37 },
        travelEstimates: {
          distance: { unit: 'kilometers', value: 12 },
          duration: { timezone: 'Europe/Vienna', seconds: 600 },
          visible: true,
        },
        onPress: () => {},
      },
      outlets: [{ connector: 'ccs2', voltage: 400, powerKw: 300, onPress: () => {} }],
    },
  ],
});
```

A section is one of:

| `type` | Renders as | Notes |
| --- | --- | --- |
| `'list'` | Rows (`default`/`toggle`/`radio`/`text`/`waypoint`) | Same row types and behavior as a regular `ListTemplate` section. |
| `'grid'` | A row of `GridButton`s | Same shape as `GridTemplate.buttons`. |
| `'charger'` | One `CPChargingStationConnection` item per outlet | `outlets[].connector` is one of `ccs1`/`ccs2`/`j1772`/`chaDeMo`/`mennekes`/`gbtDC`/`gbtAC`/`nacsDC`/`nacsAC`; `powerKw` above 1000 is shown in MW natively. `location` is optional and behaves exactly like a `waypoint` row's panel behavior above (own `CPMapTemplateWaypoint` item, `travelEstimates.visible` for the sibling estimate row) — except it uses `location.name` instead of a `title`, since the section's own `title` is already shown as the header (repeating it on the item would look redundant). |

**Known iOS 27 beta issues affecting waypoint/options-panel content** (not fixable in this library — re-test against newer betas; each was confirmed by direct testing, several already have Apple Feedback reports filed):

-   **Custom (non-system) images are unreliable across several of these newer panel APIs.** A `waypoint` row's/`ChargerLocation`'s glyph `image` overflows at `CPNavigationAlert.maximumAvatarImageSize` on iOS 27 — worked around by dividing the requested size by `traitCollection.displayScale`, which fixes the overflow but introduces some blur (a real tradeoff, not a full fix). Non-glyph custom images have no known-good size at all — everything from explicit point sizes to real custom `UIImage.isSymbolImage` assets was tried without a reliable, correctly-sized result; only genuine **system** symbols (`UIImage(systemName:)`) size correctly there. Expect `image` on a waypoint/charger row to render, but not necessarily at a sensible or crisp size.
-   **`CPListItem.accessoryImage` (used for `toggle` rows) renders at some fixed, undersized footprint on iOS 27, regardless of the image's content, size, scale, or whether it's a real symbol image** — confirmed via extensive testing (content proportions, render scale, post-hoc scale metadata, genuine `UIImage.isSymbolImage` assets from both the app's own bundle and a library-owned resource bundle). Reproduces on a plain (non-panel) `ListTemplate` too, so it isn't specific to panels or to this library's usage of the API. No workaround found; filed as Apple Feedback.

### Voice Input

The library provides a cross-platform in-app voice recording API built on top of the car microphone (when connected) or the device microphone (when no car is connected). The voice API lives in `HybridVoice`.

#### Permission

```ts
import { HybridVoice } from '@iternio/react-native-auto-play';

// Check whether permission is already granted (synchronous)
const granted = HybridVoice.hasVoiceInputPermission();

// Request permission if not yet granted
const granted = await HybridVoice.requestVoiceInputPermission();
```

On **iOS**: checks/requests both microphone and speech recognition authorization.
On **Android**: checks/requests `RECORD_AUDIO` via the car context when connected, otherwise via the RN application context.

#### Recording

```ts
import { HybridVoice, ErrorUtil } from '@iternio/react-native-auto-play';

try {
  const result = await HybridVoice.startVoiceInput({
    silenceThresholdMs: 1500,      // ms of silence before auto-stop (default 1500)
    maxDurationMs: 10_000,         // hard cap on recording duration (default 10 000)
    listeningText: 'Listening…',   // iOS CarPlay: text shown on CPVoiceControlTemplate
    preferSpeechToText: false,     // true → STT transcription; false → raw PCM (default)
    startSound: require('./beep_start.mp3'), // played just before recording starts
    endSound: require('./beep_end.mp3'),     // played just after recording stops
    onChunk: (chunk) => {
      // chunk.audio — raw PCM ArrayBuffer chunk (PCM mode)
      // chunk.partial — partial transcription string (STT mode)
    },
  });

  if (result.transcription) {
    console.log('Transcription:', result.transcription);
  } else if (result.audio) {
    console.log(`PCM audio: ${result.audio.byteLength} bytes`);
  }
} catch (e) {
  if (ErrorUtil.isVoiceInputCanceledError(e)) {
    // User pressed the cancel button on the car screen
    console.log('Voice input cancelled');
  } else {
    console.error(e);
  }
}

// Stop recording early — resolves startVoiceInput with audio captured so far
HybridVoice.stopVoiceInput();
```

| Option | Type | Default | Description |
|---|---|---|---|
| `silenceThresholdMs` | `number` | `1500` | Auto-stop after this many ms of silence |
| `maxDurationMs` | `number` | `10000` | Hard recording time limit |
| `listeningText` | `string` | — | iOS only — text shown on `CPVoiceControlTemplate` |
| `listeningImage` | `VoiceInputImage` | — | iOS only — animated image in the CarPlay overlay |
| `preferSpeechToText` | `boolean` | `false` | `true` → resolve with `{ transcription }`; `false` → resolve with `{ audio }` |
| `startSound` | `number` | — | Metro asset (`require('./beep.mp3')`) played before recording. Takes audio focus so other apps pause. |
| `endSound` | `number` | — | Metro asset played after recording stops |
| `onChunk` | `(chunk) => void` | — | Streaming callback: `chunk.audio` (PCM) or `chunk.partial` (STT) |
| `language` | `string` | system | BCP-47 language tag for the STT recognizer |

**PCM result** (`preferSpeechToText: false`, default): resolves with `{ audio: ArrayBuffer }` — raw 16 kHz, 16-bit, mono PCM.

**STT result** (`preferSpeechToText: true`): resolves with `{ transcription: string }` on success, or falls back to `{ audio }` if recognition is unavailable.

On **Android**: uses `CarAudioRecord` when Android Auto is connected, otherwise falls back to standard `AudioRecord`. STT uses `SpeechRecognizer`.

On **iOS**: presents `CPVoiceControlTemplate` on the car screen when CarPlay is connected, and captures audio via `AVAudioEngine`. STT uses `SFSpeechRecognizer`.

#### Cancel detection

When the user presses the cancel button on the car screen, `startVoiceInput` rejects with a `voiceInputCancelled` error on both platforms. Use `ErrorUtil.isVoiceInputCanceledError` to distinguish it from other errors:

```ts
import { ErrorUtil } from '@iternio/react-native-auto-play';

HybridVoice.startVoiceInput().catch((e) => {
  if (ErrorUtil.isVoiceInputCanceledError(e)) {
    // user dismissed — no action needed
  } else {
    throw e;
  }
});
```

#### OS-triggered voice input (Android only)

`addListenerVoiceInput` fires when the OS itself initiates a voice action (e.g. "Hey Google, navigate to…"). It is a no-op on iOS — use `startVoiceInput` for in-app recording on both platforms.

```ts
const cleanup = HybridAutoPlay.addListenerVoiceInput((location, query) => {
  console.log('Voice query:', query, 'near', location);
});
```

#### useVoiceInput hook (Android only)

A convenience hook that wires up `addListenerVoiceInput` and exposes the latest `location` and `query` values reactively.

```tsx
import { useVoiceInput } from '@iternio/react-native-auto-play';

const MyScreen = () => {
  const { location, query } = useVoiceInput();
  return <Text>{query ?? 'Say something…'}</Text>;
};
```

---

### Hooks

-   `useMapTemplate()`: Get a reference to the parent `MapTemplate` instance.
-   `useVoiceInput()`: Reactively exposes the latest OS-triggered voice input (`location`, `query`). Android only — for in-app recording use `startVoiceInput` / `stopVoiceInput` directly.
-   `useSafeAreaInsets()`: Get safe area insets for any root component.
-   `useFocusedEffect()`: A useEffect alternative that executes when the specified component is visible to the user - use any of the `AutoPlayModules` enum or a cluster uuid to sepcify the component the effect should listen for.
-   `useAndroidAutoTelemetry()`: Access to car telemetry data on Android Auto and Android Automotive.
    ```tsx
    import {
      useAndroidAutoTelemetry,
      AndroidAutoTelemetryPermissions,
      AndroidAutomotiveTelemetryPermissions,
    } from '@iternio/react-native-auto-play';
    import Config from 'react-native-config';

    const MyComponent = () => {
      const { telemetry, permissionsGranted, error } = useAndroidAutoTelemetry({
        requiredPermissions:
          Config.isAutomotiveApp === 'true'
            ? [
                AndroidAutomotiveTelemetryPermissions.Info,
                AndroidAutomotiveTelemetryPermissions.Speed,
                AndroidAutomotiveTelemetryPermissions.Energy,
                AndroidAutomotiveTelemetryPermissions.ExteriorEnvironment,
                AndroidAutomotiveTelemetryPermissions.EnergyPorts,
              ]
            : [
                AndroidAutoTelemetryPermissions.Speed,
                AndroidAutoTelemetryPermissions.Energy,
                AndroidAutoTelemetryPermissions.Odometer,
              ],
        automotivePermissionRequest:
          Config.isAutomotiveApp === 'true'
            ? {
                cancelButtonText: 'Cancel',
                grantButtonText: 'Grant',
                message: 'Grant permission for vehicle telemetry access.',
              }
            : undefined,
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
          <Text>Selected Gear: {telemetry?.selectedGear?.value}</Text>
          <Text>Outside Temperature: {telemetry?.envOutsideTemperature?.value}°C</Text>
          <Text>EV Charge Port Connected: {String(telemetry?.evChargePortConnected?.value)}</Text>
          <Text>EV Battery Charge Rate: {telemetry?.evBatteryInstantaneousChargeRate?.value} kW</Text>
          <Text>Parking Brake On: {String(telemetry?.parkingBrakeOn?.value)}</Text>
          <Text>Vehicle Name: {telemetry?.vehicle?.name?.value}</Text>
          <Text>Vehicle Manufacturer: {telemetry?.vehicle?.manufacturer?.value}</Text>
          <Text>Vehicle Year: {telemetry?.vehicle?.year?.value}</Text>
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
    - `selectedGear`: The currently selected gear, one of the `VehicleGear` enum:
       - Neutral = 1
       - Reverse = 2
       - Park = 4
       - Drive = 8
    - `envOutsideTemperature`: The outside temperature in °C.
    - `evChargePortConnected`: Whether the EV charge port is connected.
    - `evBatteryInstantaneousChargeRate`: The instantaneous charge rate of the EV battery in kW.
    - `parkingBrakeOn`: Whether the parking brake is on.


### Scenes

-   `CarPlayDashboard`: A component to render content on the CarPlay dashboard (CarPlay only).
-   `AutoPlayCluster`: A component to render content on the instrument cluster (CarPlay & Android Auto).

**Scene APIs (overview):**

**CarPlayDashboard (iOS)**
- `setComponent(component)` — register the React component (call once).
- `setButtons(buttons)` — **required** to make the dashboard visible.
- `addListener(event, cb)` — `didConnect` / `didDisconnect`.
- `addListenerRenderState(cb)` — scene visibility callbacks.
- `addListenerColorScheme(cb)` — light/dark changes.

```ts
CarPlayDashboard.setButtons([
  {
    titleVariants: ['Open App'],
    subtitleVariants: ['Dashboard shortcut'],
    image: { name: 'directions_car', type: 'glyph' },
    onPress: () => console.log('open app'),
  },
]);
```

**AutoPlayCluster**
- `setComponent(component)` — register the cluster component.
- `setAttributedInactiveDescriptionVariants(variants)` — iOS only inactive text.
- `addListenerColorScheme(cb)` / `addListenerZoom(cb)` / `addListenerCompass(cb)` / `addListenerSpeedLimit(cb)`.

## Known Issues

### iOS

-   **Broken exceptions with `react-native-skia`**: When using `react-native-skia` exceptions on iOS are not reported correctly. This is fixed since version `2.4.19` of `react-native-skia`. For more details, see this [pull request](https://github.com/Shopify/react-native-skia/pull/3595) and [issue](https://github.com/Shopify/react-native-skia/issues/3635).
-   **AppState on iOS**: The `AppState` module from React Native does not work correctly on iOS because this library uses scenes, which are not supported by the stock `AppState` module. This library provides a custom state listener that works for both Android and iOS. Use `HybridAutoPlay.addListenerRenderState` instead of `AppState`.
-   **Timers stop on screen lock**: iOS stops all timers when the device main screen is turned off. To ensure timers continue to run (which is often necessary for background tasks related to autoplay), a patch for `react-native` is required. A patch is included in the root `patches/` directory and can be applied using `patch-package`.
In case you are using Expo SDK >= 56 make sure to set `buildReactNativeFromSource` to `true` in your app config for [expo-build-properties](https://docs.expo.dev/versions/latest/sdk/build-properties/#sharedbuildconfigfields), otherwise the patch can't be applied.
-   **expo-splash-screen stuck on iOS**: The `expo-splash-screen` module is broken on iOS because it does not support scenes, which are used by this library. This can cause the splash screen to be stuck on either the mobile device or on CarPlay. To fix this, a patch for `expo-splash-screen` is included in the root `patches/` directory and can be applied using `patch-package`. After applying the patch, you can hide the splash screen for a specific scene by passing the module name to the `hide` or `hideAsync` function. The module name can be one of the values from the `AutoPlayModules` enum or the UUID of a cluster screen.
    ```tsx
    import { hideAsync } from 'expo-splash-screen';
    import { AutoPlayModules } from '@iternio/react-native-auto-play';

    // Hide the splash screen for the main app
    hideAsync(AutoPlayModules.App);

    // Hide the splash screen for the CarPlay screen
    hideAsync(AutoPlayModules.AutoPlayRoot);
    ```
-   **CarPlay map panels (iOS 27 beta)**: a panel's optional icon-only `symbolButton` does not respond to taps. See **Map + Content** above for details. This is a beta platform limitation, not a bug in this library — re-test against newer iOS 27 betas.
-   **Waypoint/options-panel images and toggle-row sizing (iOS 27 beta)**: custom images on a `waypoint` row/`ChargerLocation` have no reliable size, and `CPListItem.accessoryImage` (`toggle` rows) renders at an undersized fixed footprint regardless of the image supplied. See **Waypoint Rows** above for details. Beta platform limitations, not bugs in this library — an Apple Feedback report has been filed for the `accessoryImage` issue.
### Android
-   **Broken exceptions with `react-native`** up to version 0.79
When using react-native before 0.80.0 exceptions are broken and are reported as `Unknown runtime_error` or similar.
See [this issue](https://github.com/mrousavy/nitro/issues/382) for details.
- **@rnmapbox/maps** The map view/camera might take the primary screens scale factor into account when interacting with the map.
This might lead to broken gestures, in case you face this issue try to apply either the `Dimensions.get('window').scale` or `RootComponentInitialProps.window.scale` to your coordinates.

## Contributing

Contributions are welcome! Feel free to open up a [discussion](https://github.com/Iternio-Planning-AB/react-native-auto-play/discussions) or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE.md) file for details.
