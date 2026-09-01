# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.
`CLAUDE.md` is a symlink to this file.

## Repository Structure

This is a Yarn workspaces monorepo containing:
- `packages/react-native-autoplay/` — the core library, published as `@iternio/react-native-auto-play`
- `apps/example/` — example app (`example` workspace) demonstrating all features
- `patches/` — patch-package patches, applied via the root `postinstall` (`scripts/conditional-patch.js`, which skips patches for packages that aren't installed)

## Commands

### Root (monorepo)
```bash
yarn lint:auto-play        # Lint the core library
yarn typecheck:auto-play   # Type-check the library
yarn build:auto-play       # Full library build (workspace `prepare`)
yarn lint:example          # Lint example app
yarn typecheck:example     # Type-check example app
yarn start                 # Metro for the example app
yarn ios                   # Run example app on iOS
yarn android               # Run example app on Android
yarn android:adb           # adb reverse port setup (./adb_port_setup.sh)
```

### Library (`packages/react-native-autoplay/`)
```bash
yarn prepare        # Full build: yarn circular && tsc && nitrogen
yarn lint           # Biome check on src/
yarn lint-ci        # Biome check with CI reporter
yarn typecheck      # tsc --noEmit
yarn circular       # Detect circular dependencies (dpdm)
yarn specs          # Re-generate Nitrogen specs
yarn clean          # Remove build artifacts
yarn swift:format   # Format Swift source files (swift-format)
```

The CI pipeline (`.github/workflows/code-quality-checks.yml`) runs lint + typecheck + build for the library and lint + typecheck for the example app on PRs. `.github/workflows/npm-publish.yml` publishes the package.

## Architecture

### What This Library Does

`@iternio/react-native-auto-play` provides Apple CarPlay and Android Auto/Automotive integration for React Native apps. It exposes a **template-based UI system** — the car platform dictates which templates are allowed, and this library provides typed TypeScript wrappers that bridge to the native implementations via NitroModules.

### Native Bridge: NitroModules

The library uses [react-native-nitro-modules](https://nitro.margelo.com) for the native bridge instead of the standard React Native bridge. Key files:

- `src/specs/*.nitro.ts` — TypeScript interface specs that nitrogen code-generates from
- `nitro.json` — Nitro autolinking config (cxx namespace `swe::iternio::reactnativeautoplay`, iOS module `ReactNativeAutoPlay`) listing every native module
- `nitrogen/` — **Generated** Swift/Kotlin/C++ code (do not edit manually)
- `ios/` — Swift implementations (`ios/hybrid/`, `ios/templates/`, `ios/utils/`)
- `android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/` — Kotlin implementations
- `src/hybrid/HybridAutoPlay.ts` — Main wrapper for the native `AutoPlay` module
- `src/hybrid/HybridVoice.ts` — Ergonomic wrapper around the native `Voice` module
- `src/hybrid/HybridAndroidAutoTelemetry.ts` / `HybridAndroidWindowInformation.ts` — Android modules (with `.android.ts` variants; the plain files are no-op fallbacks)

Autolinked modules: `AutoPlay`, `Voice`, `Cluster`, `CarPlayDashboard` (iOS), `AndroidWindowInformation`, `AndroidAutoTelemetry`, `AndroidAutomotive`, `SignInTemplate` (Android), plus `List`/`Grid`/`Map`/`Message`/`Search`/`Information` templates.

After editing any `.nitro.ts` spec, run `yarn specs` to regenerate the nitrogen output.

### Public API surface

`src/index.ts` is the single entry point (`src/index.web.ts` is the web stub). It exports the hybrid objects (`HybridAutoPlay`, `HybridVoice`, `HybridAndroidAutoTelemetry`, `HybridAndroidWindowInformation`, `HybridAndroidAutomotive`), the `AutoPlayModules` enum (`main`, `AutoPlayRoot`, `CarPlayDashboard`), all templates, hooks, scenes, types, and `setIconFont`.

### Template System

Templates are the core abstraction. Each template maps to a native CarPlay/Android Auto template:

| Template class | Use case |
|---|---|
| `MapTemplate` | Navigation map with maneuvers, trip data |
| `ListTemplate` | Sectioned list/menu |
| `GridTemplate` | Button grid |
| `SearchTemplate` | Search input with results |
| `InformationTemplate` | Read-only information display |
| `MessageTemplate` | Alert/modal messages |
| `SignInTemplate` | Android-only authentication (QR/PIN/input) |

All templates extend `Template<TemplateConfigType, ActionsType>` (`src/templates/Template.ts`), which provides:
- An `id` (surface-rendering templates supply their own, others get a generated uuid)
- Lifecycle callbacks via `TemplateConfig`: `onWillAppear`, `onDidAppear`, `onWillDisappear`, `onDidDisappear`, `onPopped`, plus `autoDismissMs`
- Navigation stack: `setRootTemplate()`, `push()`, `popTo()`
- `setHeaderActions()` — platform-split header buttons (`HeaderActions<T>` with `android` / `ios` keys)

Stack operations not tied to a single template live on `HybridAutoPlay`: `popTemplate()`, `popToRootTemplate()`, `popToTemplate()`.

### React Component Rendering on Car Screens

Templates accept a React component (`component` prop) that renders on the car's surface. These components receive `RootComponentInitialProps` (`id`, `rootTag`, `colorScheme`, `window`); cluster components receive `AutoPlayClusterInitialProps` (adds iOS `compass`, `speedLimit`). Context providers:
- `MapTemplateProvider` (`src/components/MapTemplateContext.tsx`) — exposes current `MapTemplate` via `useMapTemplate()`
- `SafeAreaInsetsProvider` (`src/components/SafeAreaInsetsContext.tsx`) — exposes insets via `useSafeAreaInsets()`; `SafeAreaView` applies them
- `WindowInformationWrapper` — keeps `window` up to date when the host resizes the surface

### Initialization Flow

1. Importing the library auto-registers the Android headless task `AndroidAutoHeadlessJsTask` (`src/AutoPlayHeadlessJsTask.ts`) — it stays alive until `didDisconnect`. No manual registration needed.
2. On car connection, native invokes the headless JavaScript task (Android) / the scene delegate (iOS)
3. App creates template instances and calls `template.setRootTemplate()` to display
4. Listen to connection events: `HybridAutoPlay.addListener('didConnect' | 'didDisconnect', cb)`; query state with `isConnected()` and `isCarServiceRunning()` (distinguishes a car-triggered headless run from e.g. a notification-triggered one)
5. Per-surface visibility: `addListenerRenderState(moduleName, cb)`; safe area: `addSafeAreaInsetsListener(moduleName, cb)`

### Scenes (Non-Template Surfaces)

- `CarPlayDashboard` (iOS only) — Dashboard widget rendered alongside the main app
- `AutoPlayCluster` (both platforms) — Instrument cluster display; cluster ids are generated natively and passed through `RootComponentInitialProps.id`

### Voice Input

Voice lives in its own native module, wrapped by `HybridVoice` (`src/hybrid/HybridVoice.ts`, spec `src/specs/Voice.nitro.ts`). The wrapper takes a single `VoiceInputOptions` object (`src/types/Voice.ts`) and resolves Metro sound assets before calling native.

- `HybridVoice.hasVoiceInputPermission()` — synchronous. iOS: microphone + speech recognition authorization; Android: `RECORD_AUDIO`.
- `HybridVoice.requestVoiceInputPermission()` — requests all required permissions, resolves true only if all granted. Android uses the car context when connected, otherwise the RN application context (`PermissionAwareActivity`).
- `HybridVoice.startVoiceInput(options?)` — starts a session. Options: `silenceThresholdMs` (default 1500), `maxDurationMs` (default 10000), `listeningText` / `listeningImage` (iOS `CPVoiceControlTemplate`), `preferSpeechToText`, `onChunk`, `language`, `encoding` (`LINEAR16` default, `MULAW`, `ALAW`), `startSound` / `endSound` (`require()`d assets).
  - `preferSpeechToText: false` (default) — raw PCM on both platforms (16 kHz, 16-bit, mono); resolves `{ audio }`, `onChunk` streams audio chunks.
  - `preferSpeechToText: true` — iOS streams into `SFSpeechRecognizer`, Android uses `SpeechRecognizer` when available; `onChunk` yields `partial` transcriptions, resolves `{ transcription }`, falls back to PCM if unavailable.
  - Android uses `CarAudioRecord` when connected, otherwise `AudioRecord`; iOS uses `AVAudioEngine`.
- `HybridVoice.stopVoiceInput()` — stops early; PCM mode resolves with audio so far, STT mode finalises recognition. No-op if idle.
- `HybridAutoPlay.addListenerVoiceInput(cb)` — Android-only; fires when the OS triggers a voice action (e.g. "Hey Google, navigate to…") with `(coordinates, query)`. No-op on iOS.

Native implementations:
- iOS: `ios/utils/VoiceInputManager.swift`, `ios/templates/VoiceInputTemplate.swift`, `ios/hybrid/HybridVoice.swift`
- Android: `android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/VoiceInputManager.kt`, `HybridVoice.kt`

### Hooks

| Hook | Platform | Purpose |
|---|---|---|
| `useMapTemplate()` | both | Access current `MapTemplate` instance |
| `useVoiceInput()` | Android | Reactively exposes latest OS-triggered voice input (`{ coordinates, query }`) plus `resetVoiceInputResult()`. For in-app recording use `HybridVoice.startVoiceInput`/`stopVoiceInput`. |
| `useSafeAreaInsets()` | both | Screen-safe padding values |
| `useFocusedEffect()` | both | Like `useEffect` but tied to template visibility |
| `useAndroidAutoTelemetry()` | Android | Vehicle telemetry (speed, fuel, battery, etc.) |

### Type System

Core shared types live in `src/types/`:
- `AutoText` — text with variants and placeholders (`TextPlaceholders`, `Distance`, `DistanceUnits`)
- `AutoImage` — glyph images (`AutoGlyphByName` / `AutoGlyphByCodepoint`) or RN `ImageSourcePropType` assets, with themed `color` / `backgroundColor`
- `Maneuver` — discriminated union of navigation maneuvers (`TurnManeuver`, `RoundaboutManeuver`, …) plus `ManeuverType` / `TurnType` / `ManeuverState` enums and lane info
- `Trip`, `TripPoint`, `TripConfig`, `TripsConfig`, `TravelEstimates` — navigation trip structures
- `Telemetry` — Android vehicle data plus telemetry permission enums
- `Voice` — voice input options/results
- `RootComponent` — surface props (`RootComponentInitialProps`, `AutoPlayClusterInitialProps`, `WindowInformation`, `ColorScheme`)

Conversion utilities in `src/utils/` (`NitroImage`, `NitroAction`, `NitroSection`, `NitroManeuver`, `NitroColor`, …) translate these TypeScript types to the NitroModules-compatible formats passed to native.

### Icon fonts / glyphs

No icon font is bundled with the library. The app registers its own font via `setIconFont(name, glyphMap?)` (`src/utils/NitroImage.ts`) before using `{ type: 'glyph' }` images. Glyphs resolve by `name` (looked up in the map) or by raw `codepoint`. Apps get name autocompletion by augmenting the `AutoPlayGlyphMap` interface via declaration merging — see `apps/example/autoplay-glyphs.d.ts`.

### Platform Differences

- **iOS-only:** `CarPlayDashboard`, scene delegate setup, CarPlay entitlements, `listeningText`/`listeningImage`
- **Android-only:** `SignInTemplate`, `useVoiceInput` (OS-triggered), `useAndroidAutoTelemetry`, `HybridAndroidAutomotive`, `HybridAndroidWindowInformation`, Android Automotive support
- Platform-split files use `.android.ts` / `.ios.ts` suffixes; `index.web.ts` is a web stub

## Non-obvious things / gotchas

Things that are easy to get wrong and are not apparent from the file layout or public API names.

### Templates

- **Native template objects are module-level singletons, not per instance.** Each `src/templates/*.ts` creates one `NitroModules.createHybridObject('ListTemplate')` etc. at import time; a JS `Template` instance is just a thin proxy holding an `id`, and every call is `HybridXTemplate.method(this.id, ...)`. The id is the only correlation key, so it must be unique and stable for the template's lifetime. There is no dispose API.
- **Calling a method on a template that has been popped rejects with a `templateNotFound` error.** Detect it with `ErrorUtil.isTemplateNotFoundError(e)` — errors are plain `Error`s matched by `message.startsWith(...)`, there are no typed error classes (same for `isVoiceInputCanceledError` / `voiceInputCancelled`).
- **`MapTemplate` is effectively a singleton with a hard-coded `id = 'AutoPlayRoot'`** (`src/templates/MapTemplate.ts`). The class field overwrites whatever the base constructor derived, so any user-supplied `id` is silently discarded, and constructing a second `MapTemplate` re-registers the same `AppRegistry` component name. Don't create two.
- **`MessageTemplate` does not extend `Template`** — it's standalone with only `push()` (no `setRootTemplate`/`popTo`/`setHeaderActions`). It always sits on top of the stack, and pushing a second one pops the first.
- **`SignInTemplate` silently no-ops on iOS** — `HybridSignInTemplate` is `null` there and every call uses `?.`. Same "null on the wrong platform" pattern applies to `HybridAndroidAutomotive` and `HybridCarPlayDashboard`.
- **`HeaderActions<T>` / action configs pick exactly one platform branch at runtime.** `NitroActionUtil.convert` reads only `actions.android` or `actions.ios` based on `Platform.OS` — filling in only one platform silently yields no buttons on the other, with no warning.
- **`setComponent()` on `AutoPlayCluster` and `CarPlayDashboard` can only be called once** — a second call throws.
- `useMapTemplate()` / `useSafeAreaInsets()` / `useFocusedEffect()` only work inside a component rendered on a car surface (a `MapTemplate`'s `component`, a cluster, or the dashboard). Providers are wired automatically in those three places and cannot be opted out of; no other template renders arbitrary React.
- `WindowInformationWrapper` is a passthrough on iOS — CarPlay windows never resize, so `window` only updates live on Android.

### MapTemplate specifics

- `updateManeuvers` requires `startNavigation()` first, and behaves differently per platform: Android replaces all supplied maneuvers, iOS only updates travel estimates when maneuver ids match.
- `updateTravelEstimates(steps)` must receive only *future* steps — no origin, no passed steps.
- `showTripSelector` validates synchronously and throws (empty trips, empty `routeChoices`, routes with `< 2` steps). In `__DEV__` on Android it also warns about non-unique destination names, because the last step's `name` is used as the Android Auto title.
- `setManeuverState` is a no-op on Android (no equivalent API). Updating an existing alert is broken on Android Automotive (each `updateAlert` shows a new alert).
- **CarPlay does not repaint maneuver colors in place** — to react to a dark/light switch you must resend the maneuver with a *new* id. Listen to `onAppearanceDidChange` and prefer `ThemedColor` over static colors.

### Conversion / type footguns

- **`setIconFont` is call-once and silently ignores repeat calls.** It must run before any template is created. Glyph name lookups throw lazily at *conversion* time (when a template/button is built), not when the image object is created. If both `name` and `codepoint` are set, `codepoint` wins.
- **There is no single default glyph `fontScale`** — header/action buttons default to Android `1.0` / iOS `0.8`, map buttons to Android `1.0` / iOS `0.65`, and grid/list/information rows apply no default at all.
- Map button `backgroundColor` is forced to `transparent` on Android regardless of what you pass.
- `NitroColorUtil` uses RN `processColor`, so colors must be valid RN color strings; a single string is applied to both light and dark, with no derivation.
- Radio-list section validation (exactly one `selected` item) only runs in `__DEV__` and **throws**, which contradicts the JSDoc promising a fallback. Production has no JS-side validation.
- `NitroManeuver` silently drops fields that don't match the `maneuverType` (`turnType` only for `Turn`, `exitNumber` only for `Roundabout`, etc.) instead of erroring.
- Remote images must be HTTPS (iOS ATS); the fetch timeout default is 500ms.
- `TravelEstimates._doNotUse` (`src/types/Trip.ts`) is a deliberate nitrogen/C++ codegen workaround — **do not delete it** as dead code.
- `React.createElement` with a `children` prop plus a `biome-ignore noChildrenProp` comment is intentional in `.ts` (non-`.tsx`) files — don't "fix" these.
- `@namespace iOS` / `@namespace Android` JSDoc tags are the convention for flagging platform-exclusive APIs (casing is inconsistent in places).

### Hooks

- `useFocusedEffect` only treats `didAppear` as focused; every other render state (including `willAppear`) counts as unfocused. The effect is held in a ref, so changing the callback does not re-run it — only `isFocused` and `deps` do.
- `useAndroidAutoTelemetry` starts only when connected **and** permissions granted. An empty `requiredPermissions` array trivially counts as granted. With `isAndroidAutomotive: true`, connection events are ignored entirely and `isConnected` comes from the initial prop. Telemetry payloads may be **partial** (e.g. gear changes are emitted immediately, outside the timed update) — consumers must merge, not replace.
- `useVoiceInput` resets itself to `undefined` when native emits an event with neither coordinates nor query.

### Host-app integration (iOS)

- **The host app must implement `@objc func getRootViewForAutoplay(moduleName:initialProperties:) -> UIView?` on its `AppDelegate`.** It is looked up by Objective-C runtime reflection (`ios/utils/ViewUtils.swift`), deliberately not via a protocol, to avoid importing `React_AppDelegate` (glog/C++ ABI conflicts). If it's missing or misnamed there is **no compile error** — CarPlay just fails to init the root view at connect time. Reference implementation: `apps/example/ios/example/AppDelegate.swift`.
- Scene delegates (`WindowApplicationSceneDelegate`, `HeadUnitSceneDelegate`, `DashboardSceneDelegate`, `ClusterSceneDelegate`) ship with the library; the app only references them by **string class name** in `Info.plist` `UISceneConfigurations`. A typo breaks exactly one surface while the others keep working — a very quiet partial failure. The example wires four configurations.
- Native template/window mutation is main-thread-only, enforced via `@MainActor` annotations rather than manual dispatch.
- **Two threads reach the Swift side: the main thread (UIKit/CarPlay delegate callbacks) and the JS/Nitro thread.** Hybrid spec methods that are plain `throws` (no `Promise.async`/`MainActor.run`) run *on the JS thread* — `createXTemplate` and every `addListener*` do. Any shared mutable state they touch must therefore be synchronised: Swift `Dictionary`/`Array` are not thread-safe and a concurrent access crashes with `KERN_INVALID_ADDRESS` inside `Dictionary.subscript`, or silently loses writes (read-filter-reassign like `TemplateStore.purge()`). The convention is an `NSLock` + a private `withLock`/`withListenersLock` helper (`HybridAutoPlay`, `HybridCluster`, `HybridCarPlayDashboard`, `SceneStore`, `TemplateStore`, `SymbolFont`; `VoiceInputManager.ResultBox` is the original example). **Always snapshot listeners under the lock and invoke callbacks outside it** — callbacks run JS and can re-enter (e.g. `TemplateStore.removeTemplate` → `onPopped` → `VoiceInputTemplate.onDidDisappear` → `removeTemplate`).
- `NSLocking.withLock` is iOS 16+, but the pod's minimum is `min_ios_version_supported` (15.1) — prefer explicit `lock()` / `defer { unlock() }` in new code.
- Cluster support requires iOS 15.4+. The `com.apple.developer.carplay-maps` entitlement is Apple-approval-gated (Simulator works without it).
- Dashboard "open head unit" buttons open a generated `<bundleId>://<uuid>` URL, so `CFBundleURLSchemes` must contain the bundle identifier.

### Host-app integration (Android)

- **No manifest setup is required in the host app.** The `CarAppService`, `HeadlessTaskService`, permissions, `automotive_app_desc.xml` and `minCarApiLevel` all live in the library's own `AndroidManifest.xml` and are merged in. `apps/example/android/app/src/main/AndroidManifest.xml` is nearly empty for that reason.
- **Behaviour is controlled by Gradle properties, not code.** `packages/react-native-autoplay/android/gradle.properties` holds the defaults (`ReactNativeAutoPlay_*`): `androidAutoAppCategory` (default `navigation`), `isAutomotiveApp`, `androidAutoScaleFactor`, `androidTelemetryUpdateInterval`, `clusterSplashDelayMs/DurationMs`, SDK/NDK versions. `getExtOrDefault` checks `rootProject.ext` first, then the prefixed project property — setting them anywhere else silently does nothing.
  - A non-`navigation` category swaps in the lean `AndroidManifest-nonnav.xml` (drops navigation/map/surface permissions, cluster category, geo intent filter); an invalid category fails the build with a `GradleException`.
  - `isAutomotiveApp=true` swaps both the manifest and the Kotlin sourceSet (`src/automotive` vs `src/main` + `src/auto/java`), needs `minSdk >= 29`, and the host app must remove its launcher activity in that variant or the Automotive launcher shows two icons.
- `HeadlessTaskService` is a **bound** service (not started) so Android won't kill it while Android Auto is active; the JS task is started on `onBind` forced onto the UI thread. Car reconnects rebind, so the task must be idempotent.
- All screen-stack mutations go through `ThreadUtil.postOnUiAndAwait` — `androidx.car.app` is main-thread-only and failures come back as rejected promises by design.
- OS-triggered voice navigation arrives as a hand-parsed `geo:` intent in `AndroidAutoSession.onNewIntent`; coordinates `0,0` are a sentinel meaning "no coordinates, geocode the query".
- Clusters are given a placeholder `APPICON` action because `androidx.car.app` crashes without one even though clusters can't display actions.
- Release builds need `-keep class com.margelo.nitro.swe.iternio.reactnativeautoplay.** { *; }` in ProGuard rules.
- `fix-prefab.gradle` works around an AGP/Prefab ordering bug where the prefab publication is configured before the `.so` is built, producing header-only output and undefined-symbol link errors downstream. Don't remove it. `CMakeLists.txt` requires C++20.

### Generated code & release process

- **`nitrogen/generated/` is committed** (~500 files). After `yarn specs` / `yarn prepare` you must commit the regenerated output; the publish workflow fails if `yarn install` leaves the tree dirty. Stale/missing nitrogen output also makes `pod install` fail obscurely.
- **Do not hand-edit the package version.** `.github/workflows/npm-publish.yml` derives it from the GitHub release tag, commits the bump as `chore(react-native-autoplay): bump version to X [skip ci]`, and publishes with the `alpha` tag for prereleases.
- `ai-review/` is a self-hosted AI PR reviewer run by `.github/workflows/ai-review.yml`, not part of the library.

### Patches (`patches/`) — load-bearing, understand before regenerating

- **`react-native+0.83.5.patch`** rewrites `RCTTiming` to never pause the JS timer loop (replaces the `CADisplayLink` pause/resume machinery with an always-running `NSTimer`). RN normally stops `setTimeout`/`setInterval` when the phone's own scene backgrounds — which would kill ETA updates and telemetry polling while CarPlay is actively in use with the phone screen off. After an RN upgrade this must be re-derived, not blindly rebased.
- **`expo-splash-screen+*.patch`** (three version variants) add a `moduleName` parameter and key the splash overlay by root-view module name instead of a single global root view. This library renders several root views at once (phone window, head unit, dashboard, clusters), so unpatched the splash only ever hides on one surface and the others stay covered forever. Bumping expo-splash-screen usually needs a *new* variant, not a renamed file.
- `scripts/conditional-patch.js` temporarily renames patches for packages that aren't installed, so non-Expo consumers can `yarn install` cleanly.

### Example app

- `index.js` and `index_with_headless.js` are **alternate** entry points; only one is wired at a time. `index_with_headless.js` documents the pattern of gating heavy imports (Redux store etc.) behind `HybridAutoPlay.isCarServiceRunning()`, because the headless process also starts for things like push notifications and unconditional top-level imports keep it alive and drain battery.
- `apps/example/autoplay-glyphs.d.ts` is the reference for the `AutoPlayGlyphMap` declaration-merging pattern that gives typed glyph names.
- Android testing needs the Desktop Head Unit plus `yarn android:adb` (`adb_port_setup.sh`) **before** `yarn android`. iOS uses the separately-downloaded Xcode "CarPlay Simulator" additional tool.
- The `android:autodrive` script in `apps/example/package.json` is stale: it points at `...iternio.autoplay.AndroidAutoService`, but the real package is `...iternio.reactnativeautoplay.AndroidAutoService`. Fix the path before relying on it.

## Code Style

- **Linter/formatter:** Biome — single config at the repo root (`biome.json`), single quotes, 100-char line width, ES5 trailing commas, organize-imports assist on
- **TypeScript:** `strict` with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `verbatimModuleSyntax` (so use `import type` for types)
- Named imports enforced; `noShadow` and `noFloatingPromises` enabled; optional chaining preferred (`useOptionalChain`)
- `packages/react-native-autoplay/src/types/Glyphmap.ts` is excluded from linting (generated per-app glyph map; not checked in)
- **Any language:** Always use braces for `if` statements — no single-line braceless ifs
