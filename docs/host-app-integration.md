# Host-app integration

**The setup instructions themselves live in the package README** —
[`packages/react-native-autoplay/README.md`](../packages/react-native-autoplay/README.md),
sections *Installation*, *Platform Setup*, *Android Auto Customization* and
*Android Automotive*. It has the actual `Info.plist`, `Entitlements.plist`, `AppDelegate`
and Gradle snippets, and it is what consumers read. Do not copy them here, and when you
change host-app setup, **update the README** — this file only records what the README
cannot usefully say.

What follows is that delta: the mechanics behind the setup and the failure modes that
produce no error message at all.

## Both platforms

- **`installAutoPlayTimers()` (README → *Register the AutoPlay Components*) must be called
  as the consuming app's very first import**, before RN's own `Timers.js`/`TimerManager`
  polyfill setup gets a chance to be captured by reference elsewhere. If it's skipped or
  called late, `setTimeout`/`setInterval`/`requestAnimationFrame` silently keep RN's default
  behaviour — they throttle or pause while the phone is backgrounded/locked, even though
  CarPlay/Android Auto keeps the process itself alive. No error, no warning; ETA updates and
  telemetry just quietly stop. `src/utils/AutoPlayTimers.ts` and `src/hybrid/HybridAutoPlayTiming.ts`
  are the JS side; `HybridAutoPlayTiming` (Swift/Kotlin) is the native scheduler backing it —
  a plain always-running timer on both platforms, deliberately not `CADisplayLink`
  (iOS)/`Choreographer` (Android), since those are exactly what RN's own `RCTTiming`/
  `JavaTimerManager` use and both pause under the same conditions this exists to avoid.
  On Android this replaced a permanently-running headless JS task
  (`AndroidAutoHeadlessJsTask`) that existed purely to satisfy `JavaTimerManager`'s
  `isRunningTasks` escape hatch — process survival itself is unrelated and still comes from
  `AndroidAutoService`'s own `startForeground()` call.

## iOS

- **`getRootViewForAutoplay(moduleName:initialProperties:)` on the host `AppDelegate`**
  (README → *MapTemplate*) is looked up by Objective-C runtime reflection
  (`ios/utils/ViewUtils.swift`), deliberately not via a protocol, to avoid importing
  `React_AppDelegate` (glog/C++ ABI conflicts). That is why a missing or misnamed method
  gives **no compile error** — CarPlay just fails to init the root view at connect time.
  Keep the reflection call and the README snippet in sync; renaming one silently breaks
  every consumer. Reference implementation: `apps/example/ios/example/AppDelegate.swift`.
- The four scene delegates ship with the library but are referenced by **string class
  name** in the consumer's `Info.plist` (README → *Scene delegates*). Nothing links the two,
  so a typo breaks exactly one surface while the others keep working — a very quiet partial
  failure. Renaming a delegate class is therefore a breaking change that must be reflected
  in the README's `UISceneConfigurations` block.
- Native template/window mutation is main-thread-only, enforced via `@MainActor`
  annotations rather than manual dispatch. Keep new Swift code annotated the same way.
- **Two threads reach the Swift side: the main thread (UIKit/CarPlay delegate callbacks)
  and the JS/Nitro thread.** Hybrid spec methods that are plain `throws` — no
  `Promise.async`, no `MainActor.run` — run *on the JS thread*, and `createXTemplate` and
  every `addListener*` are in that group. Any shared mutable state they touch must be
  synchronised: Swift `Dictionary`/`Array` are not thread-safe, and a concurrent access
  crashes with `KERN_INVALID_ADDRESS` inside `Dictionary.subscript` or silently loses
  writes (read-filter-reassign, as in `TemplateStore.purge()`). The convention is an
  `NSLock` plus a private `withLock` / `withListenersLock` helper — see `HybridAutoPlay`,
  `HybridCluster`, `HybridCarPlayDashboard`, `SceneStore`, `TemplateStore`, `SymbolFont`,
  and `VoiceInputManager.ResultBox` for the original.
- **Always snapshot listeners under the lock and invoke the callbacks outside it.**
  Callbacks run JS and can re-enter: `TemplateStore.removeTemplate` → `onPopped` →
  `VoiceInputTemplate.onDidDisappear` → `removeTemplate`.
- Both `NSLocking.withLock { }` and explicit `lock()` / `defer { unlock() }` are fine and
  both appear in the codebase (`VoiceInputManager` uses the former, the newer locks the
  latter). `withLock` *looks* like it needs iOS 16, but Foundation declares it
  `@available(iOS 8.0, *)` with `@_alwaysEmitIntoClient`, so it is inlined into the client
  and back-deploys below the pod's deployment floor. This has been flagged as an
  availability problem in review before, wrongly. **Don't rewrite one form into the other.**
- Cluster support requires iOS 15.4+. The `com.apple.developer.carplay-maps` entitlement is
  Apple-approval-gated (the Simulator works without it).
- Dashboard "open head unit" buttons open a generated `<bundleId>://<uuid>` URL, which is
  why `CFBundleURLSchemes` must contain the bundle identifier (README → *Dashboard buttons*).

## Android

- **No manifest setup is required in the host app.** The `CarAppService`, permissions,
  `automotive_app_desc.xml` and `minCarApiLevel` all live in the library's own
  `AndroidManifest.xml` and are merged in.
  `apps/example/android/app/src/main/AndroidManifest.xml` is nearly empty for that reason.
- **`AndroidAutoService.onCreate()` calls `(application as? ReactApplication)?.reactHost?.start()`
  — do not remove it.** Android Auto can start this service directly (a car icon press) with
  `MainActivity` never having launched, and `reactHost` is a `by lazy` property nothing else
  touches in that path. Without this call the service and session come up fine but the JS
  instance never boots, so the car screen is stuck on the placeholder `AppIcon` message
  forever with no error. `start()` is documented as safe to call even when the instance is
  already running (e.g. the phone app was opened first) — it no-ops in that case. This used
  to happen as a side effect of binding to the now-removed `HeadlessTaskService`; removing
  that for the `installAutoPlayTimers()` rework (*Both platforms*, above) silently broke
  cold starts from Android Auto until this call was added back explicitly.
- **Behaviour is controlled by Gradle properties, not code.** The defaults live in
  `packages/react-native-autoplay/android/gradle.properties`; the consumer-facing ones are
  documented in the README (*Android Auto Customization* and *Android Automotive*). Don't
  re-list them here — read the file for the current set, and add new ones to the README.
- **The property resolution order is the footgun.** `getExtOrDefault(name)` reads
  `rootProject.ext.<name>` first, then falls back to
  `project.properties["ReactNativeAutoPlay_" + name]`. So an unprefixed property in
  `gradle.properties` is **silently ignored**, and an existing `rootProject.ext` value
  (the React Native template defines `ext.minSdkVersion`) **wins over** the prefixed
  property. Any new property must be documented with the prefix.
  - A non-`navigation` category swaps in the lean `AndroidManifest-nonnav.xml` (drops
    navigation/map/surface permissions, cluster category, geo intent filter). An invalid
    category fails the build with a `GradleException`.
  - `isAutomotiveApp=true` swaps the Kotlin sourceSet (`src/automotive/java` instead of
    `src/auto/java`), the manifest (`src/automotive/` instead of `src/main/`), and the
    `androidx.car.app` artifact (`app-automotive` instead of `app-projected`). It also adds
    `useLibrary 'android.car'`, which requires API 29 — the build does **not** enforce that,
    so the host app must raise `ReactNativeAutoPlay_minSdkVersion` itself (the library's
    default in `android/gradle.properties` is lower). The host app must also remove its
    launcher activity in that variant, or the Automotive launcher shows two icons.
- **Stack operations** (`setRootTemplate`, `pushTemplate`, `popTemplate`,
  `popToRootTemplate`, `popToTemplate` on `HybridAutoPlay`) go through
  `ThreadUtil.postOnUiAndAwait`, because `androidx.car.app` is main-thread-only; failures
  come back as rejected promises by design. Per-template mutations are different — the
  `Hybrid*Template` classes use `Promise.async { … }` against the `AndroidAutoTemplate`
  registry instead. Match whichever pattern the neighbouring method uses rather than
  assuming one applies everywhere.
- OS-triggered voice navigation arrives as a hand-parsed `geo:` intent in
  `AndroidAutoSession.onNewIntent`; coordinates `0,0` are a sentinel meaning "no
  coordinates, geocode the query".
- Clusters are given a placeholder `APPICON` action because `androidx.car.app` crashes
  without one, even though clusters can't display actions.
- Release builds need `-keep class com.margelo.nitro.swe.iternio.reactnativeautoplay.** { *; }`
  in ProGuard rules.
- `fix-prefab.gradle` works around an AGP/Prefab ordering bug where the prefab publication is
  configured before the `.so` is built, producing header-only output and undefined-symbol
  link errors downstream. **Don't remove it.** `CMakeLists.txt` requires C++20.
