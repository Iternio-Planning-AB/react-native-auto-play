 - [ ] # iOS Development Team Setup

This project uses a local `Development.xcconfig` file for code signing for the example app. This file **should not be committed** to Git.

## Steps
1. Create the file `apps/example/ios/Development.xcconfig`:

```xcconfig
CODE_SIGN_STYLE = Automatic
DEVELOPMENT_TEAM = <YOUR_TEAM_ID_HERE>
````
2. Replace <YOUR_TEAM_ID_HERE> with your actual DEVELOPMENT_TEAM identifier.

# CarPlay setup

## Bundle identifier
To get the CarPlay app showing up you need to set a proper Bundle Identifier:
-   Open   `example.xcodeproj` 
-   Select the example target, go to the  **Signing & Capabilities**  tab.
-   Under  **Signing > Bundle Identifier**, enter your unique bundle ID (e.g.,  `at.g4rb4g3.autoplay.example`).

## Entitlements
Create a `Entitlements.plist` file in your project, paste the content below and adjust the **com.apple.developer.carplay-maps** key to your needs. Check [Apple docs](https://developer.apple.com/documentation/carplay/requesting-carplay-entitlements) for details.

```<?xml version="1.0" encoding="UTF-8"?>
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

# Scene delegates setup
Depending on your needs you need to set up the scene delegates. The library brings following delegates:

- WindowApplicationSceneDelegate
The main scene visible on your mobile device
- HeadUnitSceneDelegate
The main scene on CarPlay device
- DashboardSceneDelegate
Scene visible on the CarPlay overview screen usualy with some other widgets like calendar, weather or music.
- ClusterSceneDelegate
Scene visible on a cars instrument cluster.

Paste this into your Info.plist and adjust it to your needs. Check [Apple docs](https://developer.apple.com/documentation/carplay/displaying-content-in-carplay) for details.
```
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
````

# MapTemplate setup
if you want to make use of the MapTemplate and render react components you need to add this to your AppDelegate.swift
This should cover old and new architecture, adjust to your needs!

````
@objc func getRootViewForAutoplay(
    moduleName: String,
    initialProperties: [String: Any]?
  ) -> UIView? {
    if RCTIsNewArchEnabled() {
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
````

# CarPlay MapTemplate maneuver dark & light mode
It is recommended to attach a listener to MapTemplate.onAppearanceDidChange and send maneuver updates based on this to make sure the colors are applied properly.
Reason for this is that CarPlay does not allow for color updates on maneuvers shown on the screen. You need to send maneuvers with a new id to get them updated properly on the screen.
The color properties do not need to handle the mode change, best practice is to use ThemedColor whenever possible and set appropriate light and dark mode colors.
This is mainly required on CarPlay for now since Android Auto lacks light mode.


# Localization
The library allows you to pass distances and durations and formats them according to the system defaults. Make sure to provide all supported app languages in Info.plist CFBundleLocalizations for this to work properly, missing languages will use CFBundleDevelopmentRegion as fallback which is en most of the time and mix it up with the region which might result in en_AT or similar.

# AppState
AppState provided by react-native is not working properly on iOS since it does only check for the application state and lacks support for UISceneDelegate. Therefore this library provides a custom state listener working for both Android and iOS.
Use `HybridAutoPlay.addListenerRenderState` and provide any of the `AutoPlayModules` enum modules names or one of the cluster uuids you received to monitor the scene/session/activity state.

# Dashboard buttons
In case you wanna open up your CarPlay app from one of the CarPlay dashboard buttons set `launchHeadUnitScene` on the button and add this to your Info.plist. Make sure to apply your "Bundle Identifier" instead of the example one.
```
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

