# Example app and manual testing

`apps/example/` is the `example` workspace and exercises every feature.

- **`index.js` and `index_with_headless.js` are alternate entry points** — only one is wired
  at a time. `index_with_headless.js` documents the pattern of gating heavy imports (Redux
  store etc.) behind `HybridAutoPlay.isCarServiceRunning()`, because the headless process
  also starts for things like push notifications; unconditional top-level imports keep it
  alive and drain battery.
- `apps/example/autoplay-glyphs.d.ts` is the reference for the `AutoPlayGlyphMap`
  declaration-merging pattern that gives typed glyph names.

## Running it

- **Android** needs the Desktop Head Unit plus `yarn android:adb` (`adb_port_setup.sh`)
  **before** `yarn android`.
- **iOS** uses the Xcode "CarPlay Simulator" additional tool, downloaded separately from
  Xcode itself.

## Known stale

- The `android:autodrive` script in `apps/example/package.json` points at
  `...iternio.autoplay.AndroidAutoService`, but the real package is
  `...iternio.reactnativeautoplay.AndroidAutoService`. Fix the path before relying on it.
