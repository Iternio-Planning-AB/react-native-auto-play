# Types, conversions and icon fonts

Core shared types live in `src/types/`:

- `AutoText` — text with variants and placeholders (`TextPlaceholders`, `Distance`, `DistanceUnits`)
- `AutoImage` — glyph images (`AutoGlyphByName` / `AutoGlyphByCodepoint`) or RN
  `ImageSourcePropType` assets, with themed `color` / `backgroundColor`
- `Maneuver` — discriminated union (`TurnManeuver`, `RoundaboutManeuver`, …) plus
  `ManeuverType` / `TurnType` / `ManeuverState` enums and lane info
- `Trip`, `TripPoint`, `TripConfig`, `TripsConfig`, `TravelEstimates`
- `Telemetry` — Android vehicle data plus telemetry permission enums
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
- Remote images must be HTTPS (iOS ATS). The fetch timeout defaults to 500 ms.

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
- `HybridAutoPlay.addListenerVoiceInput(cb)` — Android-only; fires when the OS triggers a
  voice action ("Hey Google, navigate to…") with `(coordinates, query)`. No-op on iOS.

Native: `ios/utils/VoiceInputManager.swift`, `ios/templates/VoiceInputTemplate.swift`,
`ios/hybrid/HybridVoice.swift`; `android/.../VoiceInputManager.kt`, `HybridVoice.kt`.
