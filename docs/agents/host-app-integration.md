# Host-app integration

**The setup instructions themselves live in the package README** —
[`packages/react-native-autoplay/README.md`](../../packages/react-native-autoplay/README.md),
sections *Installation*, *Platform Setup*, *Android Auto Customization* and
*Android Automotive*. It has the actual `Info.plist`, `Entitlements.plist`, `AppDelegate`
and Gradle snippets, and it is what consumers read. Do not copy them here, and when you
change host-app setup, **update the README** — this file only records what the README
cannot usefully say.

What follows is that delta: the mechanics behind the setup and the failure modes that
produce no error message at all.

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
- Cluster support requires iOS 15.4+. The `com.apple.developer.carplay-maps` entitlement is
  Apple-approval-gated (the Simulator works without it).
- Dashboard "open head unit" buttons open a generated `<bundleId>://<uuid>` URL, which is
  why `CFBundleURLSchemes` must contain the bundle identifier (README → *Dashboard buttons*).

## Android

- **No manifest setup is required in the host app.** The `CarAppService`,
  `HeadlessTaskService`, permissions, `automotive_app_desc.xml` and `minCarApiLevel` all
  live in the library's own `AndroidManifest.xml` and are merged in.
  `apps/example/android/app/src/main/AndroidManifest.xml` is nearly empty for that reason.
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
- `HeadlessTaskService` is a **bound** service (not started) so Android won't kill it while
  Android Auto is active; the JS task starts on `onBind`, forced onto the UI thread. Car
  reconnects rebind, so **the task must be idempotent.**
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
