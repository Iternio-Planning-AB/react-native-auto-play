# Native modules (NitroModules)

**This library does not use TurboModules, the legacy bridge, or `NativeModules`.** Every
native call goes through [react-native-nitro-modules](https://nitro.margelo.com). There is
no exception anywhere in the codebase, and a PR that adds a `TurboReactPackage`, a
`ReactContextBaseJavaModule`, an ObjC `RCT_EXPORT_MODULE` module, or a
`NativeModules.Foo` lookup will be rejected outright — it will not even link, because the
library's `ReactNativeAutoPlayPackage` is not wired to export legacy modules.

## The layout

| Path | What it is |
| --- | --- |
| `src/specs/*.nitro.ts` | TypeScript interface specs — the **input** to codegen |
| `nitro.json` | Autolinking config: cxx namespace `swe::iternio::reactnativeautoplay`, iOS module `ReactNativeAutoPlay`. Every native module must be listed here |
| `nitrogen/generated/` | **Generated** Swift/Kotlin/C++. Never hand-edit. Committed (~500 files) |
| `ios/hybrid/`, `ios/templates/`, `ios/utils/` | Swift implementations |
| `android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/` | Kotlin implementations |
| `src/hybrid/*.ts` | Ergonomic TS wrappers over the raw hybrid objects |

Autolinked modules: `AutoPlay`, `Voice`, `Cluster`, `CarPlayDashboard` (iOS),
`AndroidWindowInformation`, `AndroidAutoTelemetry`, `AndroidAutomotive`, `SignInTemplate`
(Android), plus the `List` / `Grid` / `Map` / `Message` / `Search` / `Information`
templates.

## Adding or changing a native method

1. Edit (or add) the `.nitro.ts` spec in `src/specs/`. If it's a new module, add it to
   `nitro.json` too.
2. Run `yarn specs` in `packages/react-native-autoplay/` to regenerate `nitrogen/`.
3. Implement the generated protocol in Swift (`ios/hybrid/`) **and** Kotlin
   (`android/.../reactnativeautoplay/`). Both, even if one platform is a no-op — see the
   "null on the wrong platform" pattern below.
4. Wrap it for consumers in `src/hybrid/` if the raw signature is awkward, and export from
   `src/index.ts`.
5. **Commit the regenerated `nitrogen/generated/` output in the same commit.** The publish
   workflow fails if `yarn install` leaves the tree dirty, and stale or missing nitrogen
   output makes `pod install` fail in a way that gives no useful error.

There are **two** patterns for platform-exclusive modules; pick the one the neighbours use.

- **`null` hybrid object.** `HybridSignInTemplate`, `HybridAndroidAutomotive` and
  `HybridCarPlayDashboard` are `null` off-platform, and every call site uses `?.`, so they
  silently no-op. Follow that rather than throwing.
- **Platform-split file with a no-op fallback.** `src/hybrid/HybridAndroidAutoTelemetry.ts`
  and `HybridAndroidWindowInformation.ts` each have a `.android.ts` variant holding the
  real implementation, while the **plain `.ts` file is the fallback** and exports
  `null` typed as the spec interface. Metro picks the `.android.ts` on Android and the
  plain file everywhere else. This is the pattern to copy for the next Android-only module.

Flag platform-exclusive APIs with a `@namespace iOS` / `@namespace Android` JSDoc tag
(casing is inconsistent in places; match the neighbours).

## Codegen workarounds you must not "clean up"

- `TravelEstimates._doNotUse` (`src/types/Trip.ts`) is a deliberate nitrogen/C++ codegen
  workaround. It looks like dead code. It is not — deleting it breaks the build.
- `React.createElement` with a `children` prop plus a `biome-ignore noChildrenProp`
  comment is intentional in `.ts` (non-`.tsx`) files.

## Release process

- **Never hand-edit the package version.** `.github/workflows/npm-publish.yml` derives it
  from the GitHub release tag, commits the bump as
  `chore(react-native-autoplay): bump version to X [skip ci]`, and publishes prereleases
  under the `alpha` dist-tag.
- `ai-review/` is a self-hosted AI PR reviewer run by `.github/workflows/ai-review.yml`.
  It is not part of the library and is not published.
