




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

#### ProGuard
In case you have ProGuard enabled (`def enableProguardInReleaseBuilds = true` in `android/app/build.gradle`), add the following rule to `android/app/proguard-rules.pro`:

```
-keep class com.margelo.nitro.swe.iternio.reactnativeautoplay.** { *; }
```

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

### Android Automotive

This library also supports Android Automotive. To enable Android Automotive support, you need to configure a few properties in your Android project.

-   **`minSdkVersion`**: The minimum API level for Android Automotive is 29. You must set `minSdkVersion` to at least `29`. For Android Auto, the minimum is `24`.

-   **`isAutomotiveApp` flag**: You need to inform the library if this is an Automotive app by setting the `isAutomotiveApp` property to `true`. For Android Auto, it should be `false`.

You can set these properties directly in your `android/gradle.properties` file:
```properties
# For Android Automotive
minSdkVersion=29
isAutomotiveApp=true
```

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
-   `colorScheme`: `'light' | 'dark'` initial color scheme (listen to `onAppearanceDidChange` on `MapTemplate` for updates).
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
| `onDidPan` / `onDidUpdateZoomGestureWithCenter` | callbacks | ❌ | Map gesture events. |
| `onAppearanceDidChange` | `(colorScheme) => void` | ❌ | Listen for light/dark mode changes. |
| `onAutoDriveEnabled` | `(template) => void` | ⚠️ | Android-only auto drive callback. Make sure to take action when receiving this and simulate a drive to the set destination. [Check Android docs for details](https://developer.android.com/reference/androidx/car/app/navigation/NavigationManagerCallback#onAutoDriveEnabled()) |

#### ListTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `AutoText` | ✅ | Header title. |
| `sections` | `Section<ListTemplate>` | ❌ | List sections/rows. Not providing anything here will result in a loading indicator on Android and an empty list on iOS. |
| `headerActions` | `HeaderActions<ListTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `mapConfig` | `BaseMapTemplateConfig<ListTemplate>` | ❌ | Android map-with-content layout. |

#### GridTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | `AutoText` | ✅ | Header title. |
| `buttons` | `GridButton<GridTemplate>[]` | ✅ | Grid items. Providing an empty array will result in a loading indicator on Android and an empty template on iOS. |
| `headerActions` | `HeaderActions<GridTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `mapConfig` | `BaseMapTemplateConfig<GridTemplate>` | ❌ | Android map-with-content layout. |

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
| `actions` | platform-specific | ❌ | Up to 2 buttons on Android, up to 3 on iOS. |
| `headerActions` | `HeaderActions<InformationTemplate>` | ❌ | Header actions. See **Header Actions** below. |
| `mapConfig` | `BaseMapTemplateConfig<InformationTemplate>` | ❌ | Android map-with-content layout. |

#### MessageTemplateConfig

| Prop | Type | Required | Notes |
| --- | --- | --- | --- |
| `message` | `AutoText` | ✅ | Main message text. |
| `title` | `AutoText` | ❌ | Android header title. |
| `image` | `AutoImage` | ❌ | Android-only image above the message. |
| `actions` | platform-specific | ❌ | Up to 2 buttons on Android, up to 3 on iOS. |
| `headerActions` | `HeaderActionsAndroid<MessageTemplate>` | ❌ | Android-only header actions. |
| `mapConfig` | `BaseMapTemplateConfig<MessageTemplate>` | ❌ | Android map-with-content layout. |

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
| `ListTemplate` | Lists/menus | Supports sections, radio/toggle rows. |
| `GridTemplate` | Action grid | Use `GridButton` items. |
| `SearchTemplate` | Search UI | Android-only search bar callbacks. |
| `InformationTemplate` | Info panels | Android uses PaneTemplate; iOS uses InformationTemplate. |
| `MessageTemplate` | Modal messages | Always shown on top until popped. |

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
