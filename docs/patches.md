# Patches (`patches/`) — load-bearing

These are not cosmetic. Understand what each one does before regenerating, upgrading the
patched package, or "cleaning up" the directory.

Patch filenames carry the patched package's version, so they change on every upgrade —
`ls patches/` for the current set, and the dependency versions themselves live in the
relevant `package.json`, never in this doc.

- **`patches/react-native+<version>.patch`** rewrites `RCTTiming` to never pause the JS timer loop,
  replacing the `CADisplayLink` pause/resume machinery with an always-running `NSTimer`.
  RN normally stops `setTimeout` / `setInterval` when the phone's own scene backgrounds —
  which would kill ETA updates and telemetry polling while CarPlay is actively in use with
  the phone screen off. **After an RN upgrade this must be re-derived, not blindly rebased.**
- **`patches/expo-splash-screen+<version>.patch`** (several version variants) add a `moduleName` parameter and
  key the splash overlay by root-view module name instead of a single global root view. This
  library renders several root views at once (phone window, head unit, dashboard, clusters),
  so unpatched the splash only ever hides on one surface and the others stay covered
  forever. Bumping expo-splash-screen usually needs a **new** variant, not a renamed file.
- `scripts/conditional-patch.js` (run from the root `postinstall`) temporarily renames
  patches for packages that aren't installed, so non-Expo consumers can `yarn install`
  cleanly. Adding a patch for an optional peer means adding it to that script's awareness.
