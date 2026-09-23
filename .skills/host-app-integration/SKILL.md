---
name: host-app-integration
description: Changing what a consuming app must wire up to use this library — the iOS AppDelegate hook, Info.plist scene delegates, CarPlay entitlements, URL schemes, or on Android the merged AndroidManifest, the ReactNativeAutoPlay_* Gradle properties, the headless CarAppService, ProGuard rules or the prefab workaround. Use when a change affects host-app setup, or when CarPlay/Android Auto fails to start with no error.
---

# Host-app integration

The full reference lives in
**[`docs/host-app-integration.md`](../../docs/host-app-integration.md)**.

**Read that file now, in full.** Almost every failure mode in it is silent — no compile
error, no runtime exception, just a surface that never appears — so guessing from the
symptom does not work.

The highlights, so you know what you're looking for:

1. **Both platforms:** `installAutoPlayTimers()` must be the app's very first import, or
   `setTimeout`/`setInterval`/`requestAnimationFrame` silently keep RN's default
   throttle-while-backgrounded behaviour — no error, ETA updates and telemetry just quietly
   stop while the car surface is active and the phone is locked. This replaced a permanent
   headless JS task on Android that existed only to keep `JavaTimerManager` unpaused.
2. **iOS:** the host app must implement
   `@objc func getRootViewForAutoplay(moduleName:initialProperties:) -> UIView?` on its
   `AppDelegate`. It is found by ObjC runtime reflection, not a protocol, so a missing or
   misnamed method produces **no compile error** — CarPlay just fails to init at connect
   time. Scene delegates are referenced by string class name in `Info.plist`, so a typo
   breaks exactly one surface while the others keep working.
3. **Android:** no manifest setup is required in the host app — everything is merged in from
   the library. Behaviour is controlled by `ReactNativeAutoPlay_*` **Gradle properties**, not
   code, and `getExtOrDefault` only reads `rootProject.ext` or the prefixed project property,
   so setting them anywhere else silently does nothing.
4. **iOS Swift state is reached from two threads** — the main thread and the JS/Nitro
   thread. Plain `throws` hybrid methods (`createXTemplate`, every `addListener*`) run on
   the JS thread, so shared mutable state needs the `NSLock` + `withLock` convention, and
   listener callbacks must be invoked outside the lock because they can re-enter.
5. `fix-prefab.gradle` and the ProGuard `-keep` rule for the nitro package are both
   load-bearing. Don't remove either.

Then follow the file, not this summary.
