# Patches (`patches/`) — load-bearing

These are not cosmetic. Understand what each one does before regenerating, upgrading the
patched package, or "cleaning up" the directory.

Patch filenames carry the patched package's version, so they change on every upgrade —
`ls patches/` for the current set, and the dependency versions themselves live in the
relevant `package.json`, never in this doc.

- **There is no `react-native` patch anymore.** An earlier one rewrote `RCTTiming` to keep
  JS timers running while the phone screen is locked, but it turned out to be a no-op once
  RN started linking a prebuilt `React-Core` XCFramework by default (the patched file was
  never compiled). It's replaced by `installAutoPlayTimers()` — a Nitro module
  (`HybridAutoPlayTiming`, iOS + Android) that overrides `setTimeout`/`setInterval`/
  `requestAnimationFrame` from the JS side instead of patching native RN at all. See
  `docs/host-app-integration.md` → *Both platforms*.
- **`patches/expo-splash-screen+<version>.patch`** (several version variants) add a `moduleName` parameter and
  key the splash overlay by root-view module name instead of a single global root view. This
  library renders several root views at once (phone window, head unit, dashboard, clusters),
  so unpatched the splash only ever hides on one surface and the others stay covered
  forever. Bumping expo-splash-screen usually needs a **new** variant, not a renamed file.
- `scripts/conditional-patch.js` (run from the root `postinstall`) temporarily renames
  patches for packages that aren't installed, so non-Expo consumers can `yarn install`
  cleanly. Adding a patch for an optional peer means adding it to that script's awareness.
