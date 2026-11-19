# Types, conversions and icon fonts

Core shared types live in `src/types/`:

- `AutoText` — text with variants and placeholders (`TextPlaceholders`, `Distance`, `DistanceUnits`)
- `AutoImage` — glyph images (`AutoGlyphByName` / `AutoGlyphByCodepoint`) or RN
  `ImageSourcePropType` assets, with themed `color` / `backgroundColor`. A glyph's
  `backgroundShape` defaults to a circle on iOS and an 8px (not dp) rounded rect on Android when
  unset, so existing glyphs keep their look. Native only receives `backgroundCornerRadius`
  (`'circle'` is sent as an infinite radius, capped at half the size): a separate shape enum in
  `GlyphImage` pushed nitrogen over its call stack limit for `MapTemplate`. Android's
  `GlyphImage.cacheKey` includes the radius
- `Maneuver` — discriminated union (`TurnManeuver`, `RoundaboutManeuver`, …) plus
  `ManeuverType` / `TurnType` / `ManeuverState` enums and lane info
- `Trip`, `TripPoint`, `TripConfig`, `TripsConfig`, `TravelEstimates`
- `Telemetry` — Android vehicle data plus telemetry permission enums
- `CarLocation` — the Android Auto head unit's GPS fix from `HybridAutoPlay.addListenerCarLocation`
- `Voice` — voice input options/results
- `RootComponent` — surface props (`RootComponentInitialProps`,
  `AutoPlayClusterInitialProps`, `WindowInformation`, `ColorScheme`)

Conversion utilities in `src/utils/` (`NitroImage`, `NitroAction`, `NitroSection`,
`NitroManeuver`, `NitroColor`, …) translate these into the NitroModules-compatible shapes
passed to native. That conversion layer is where most surprises live.

## Conversion footguns

- **`setIconFont` is call-once and silently ignores repeat calls.** It must run before any
  template is created. Glyph name lookups throw lazily at *conversion* time (when a template
  or button is built), not when the image object is created. If both `name` and `codepoint`
  are set, `codepoint` wins.
- **There is no single default glyph `fontScale`.** Header/action buttons default to Android
  `1.0` / iOS `0.8`; map buttons to Android `1.0` / iOS `0.65`; grid/list/information rows
  apply no default at all.
- Map button `backgroundColor` is forced to `transparent` on Android regardless of what you pass.
- `NitroColorUtil` uses RN `processColor`, so colors must be valid RN color strings. A single
  string is applied to both light and dark, with no derivation.
- **The string `'default'` is special-cased in `NitroColorUtil`.** It bypasses `processColor`
  and maps to `lightColor` black / `darkColor` white with `isDefault: true`. Android turns
  `isDefault` into a `CarColor.DEFAULT` tint (the host picks the color for its day/night
  mode); iOS ignores the flag and resolves the light/dark pair per appearance. Glyph images
  fall back to `'default'` when `color` is unset (`NitroImage.ts`).
- **Radio-list section validation** (exactly one `selected` item) only runs in `__DEV__` and
  **throws**, contradicting the JSDoc that promises a fallback. Production has no JS-side
  validation at all.
- `NitroManeuver` **silently drops** fields that don't match the `maneuverType` (`turnType`
  only for `Turn`, `exitNumber` only for `Roundabout`, …) instead of erroring.
- Remote images must be HTTPS (iOS ATS). **Without a `placeholder`** an uncached image blocks
  the template build for up to `timeoutMs` (default 500 ms). **With a `placeholder`** (glyph or
  asset, passed to native as flat `placeholder*` fields on `RemoteImage` because a nested struct
  overflows nitrogen's stack) the template builds immediately with the placeholder, the image downloads in the background
  (`timeoutMs` then limits that download, default 10 s), and the template that requested it is
  redrawn once it arrives, if still on screen. A failed download is not retried for 30 s. The
  machinery is `RemoteImageLoader` on both platforms; the template id comes from a thread-local
  set while a template is built (`AutoPlayTemplate.invalidate` / `AndroidAutoTemplate.render`),
  so a placeholder image parsed outside a build (CarPlay map panel header actions and map
  buttons) is loaded blocking for 500 ms, ignoring `timeoutMs`.
- **Fields drawn outside a template build can't take remote images**, since nothing would redraw
  them once downloaded. `src/types/Image.ts` has `LocalAutoImage` (`AutoImage` minus remote) for
  single fields (navigation alerts, CarPlay dashboard buttons, attributed strings) and
  `WithoutRemoteImages<T>` to strip remote images from a whole config (the trip selector's map
  buttons, the CarPlay options panel). Use them for any new field of that kind.

## Icon fonts / glyphs

No icon font is bundled. The host app registers its own via `setIconFont(name, glyphMap?)`
(`src/utils/NitroImage.ts`) before using `{ type: 'glyph' }` images. Glyphs resolve by `name`
(looked up in the map) or by raw `codepoint`.

Apps get name autocompletion by augmenting the `AutoPlayGlyphMap` interface via declaration
merging — `apps/example/autoplay-glyphs.d.ts` is the reference implementation.

`packages/react-native-autoplay/src/types/Glyphmap.ts` is the generated per-app glyph map. It
is excluded from linting and is not checked in.

## Voice input

Voice lives in its own native module, wrapped by `HybridVoice` (`src/hybrid/HybridVoice.ts`,
spec `src/specs/Voice.nitro.ts`). The wrapper takes a single `VoiceInputOptions`
(`src/types/Voice.ts`) and resolves Metro sound assets before calling native.

- `hasVoiceInputPermission()` — synchronous. iOS: microphone + speech recognition
  authorization; Android: `RECORD_AUDIO`.
- `requestVoiceInputPermission()` — resolves true only if *all* required permissions are
  granted. Android uses the car context when connected, otherwise the RN application context
  (`PermissionAwareActivity`).
- `startVoiceInput(options?)` — options: `silenceThresholdMs` (default 1500), `maxDurationMs`
  (default 10000), `listeningText` / `listeningImage` (iOS `CPVoiceControlTemplate`),
  `preferSpeechToText`, `onChunk`, `language`, `encoding` (`LINEAR16` default, `MULAW`,
  `ALAW`), `startSound` / `endSound` (`require()`d assets).
  - `preferSpeechToText: false` (default) — raw PCM both platforms (16 kHz, 16-bit, mono);
    resolves `{ audio }`, `onChunk` streams audio chunks.
  - `preferSpeechToText: true` — iOS streams into `SFSpeechRecognizer`, Android uses
    `SpeechRecognizer` when available; `onChunk` yields `partial` transcriptions, resolves
    `{ transcription }`, **falls back to PCM if unavailable**.
  - Android uses `CarAudioRecord` when connected, otherwise `AudioRecord`; iOS uses
    `AVAudioEngine`.
- `stopVoiceInput()` — stops early; PCM mode resolves with audio so far, STT mode finalises
  recognition. No-op if idle.
- `HybridAutoPlay.addListenerNavigationIntent(cb)` — Android-only; fires with a
  `NavigationIntent` when the OS sends `androidx.car.app.action.NAVIGATE` ("Hey Google,
  navigate to…"). Parsed by `utils/NavigationIntentParser.kt` from the *encoded* scheme
  specific part — the decoded one turns `%26` in `q` into a parameter separator. Unit tests
  in `android/src/test/`. No-op on iOS. A `VIEW geo:` intent is a search and is reported as
  `intent: 'search'`; the car Assistant reports a navigation app as able to search only if it has
  an activity for that filter (`CarAppActivity`, Automotive only, untested).
- `HybridAutoPlay.addListenerNavigationAction(cb)` — Android-only; NAVIGATE intents with
  an `act` parameter ("mute navigation", "avoid tolls") under any scheme. The act number
  table in `NavigationIntentParser.actionCodes` is decompiled from the Android Auto host
  app (Google does not document it). Numbers are mapped to the documented `geo.action` names
  natively, so a numeric and a named (`geo.action:?act=mute`) act look the same to JS;
  unknown values pass through unchanged. On Android Automotive the car Assistant sends the
  named form as `VIEW geo.action:` to the navigation app picked in its settings, but first checks
  `queryIntentActivities` for that filter and otherwise answers "not supported by your current
  navigation app". So the `VIEW geo.action` filter on `CarAppActivity` in
  `src/automotive/AndroidManifest.xml` must stay, and on the activity: the check only looks at
  activities (verified on the AAOS emulator, Assistant 13.1.618). A non-`geo:` NAVIGATE
  without `act` is dropped with a warning.
- `HybridAutoPlay.addListenerVoiceInput(cb)` — deprecated; the same intents as
  `(coordinates, query)`.

Native: `ios/utils/VoiceInputManager.swift`, `ios/templates/VoiceInputTemplate.swift`,
`ios/hybrid/HybridVoice.swift`; `android/.../VoiceInputManager.kt`, `HybridVoice.kt`.
