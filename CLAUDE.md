# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a monorepo containing:
- `packages/react-native-autoplay/` — the core library
- `apps/example/` — example app demonstrating all features

## Commands

### Root (monorepo)
```bash
yarn lint:auto-play        # Lint the core library
yarn typecheck:auto-play   # Type-check the library
yarn build:auto-play       # Full library build
yarn lint:example          # Lint example app
yarn typecheck:example     # Type-check example app
yarn ios                   # Run example app on iOS
yarn android               # Run example app on Android
```

### Library (`packages/react-native-autoplay/`)
```bash
yarn prepare        # Full build: circular check → tsc → nitrogen → font bundling
yarn lint           # Biome check on src/
yarn lint-ci        # Biome check with CI reporter
yarn typecheck      # tsc --noEmit
yarn circular       # Detect circular dependencies (dpdm)
yarn specs          # Re-generate Nitrogen specs
yarn clean          # Remove build artifacts
yarn swift:format   # Format Swift source files
```

The CI pipeline (`.github/workflows/code-quality-checks.yml`) runs lint, typecheck, and build on PRs.

## Architecture

### What This Library Does

`react-native-autoplay` provides Apple CarPlay and Android Auto/Automotive integration for React Native apps. It exposes a **template-based UI system** — the car platform dictates which templates are allowed, and this library provides typed TypeScript wrappers that bridge to the native implementations via NitroModules.

### Native Bridge: NitroModules

The library uses [react-native-nitro-modules](https://nitro.margelo.com) for the native bridge instead of the standard React Native bridge. Key files:

- `src/specs/*.nitro.ts` — TypeScript interface specs that nitrogen code-generates from
- `nitro.json` — Nitro autolinking config listing 12 native modules
- `nitrogen/` — **Generated** Swift/Kotlin code (do not edit manually)
- `src/hybrid/HybridAutoPlay.ts` — Main wrapper for the native `AutoPlay` module
- `src/hybrid/HybridAndroidAutoTelemetry.ts` — Wrapper for Android telemetry module

After editing any `.nitro.ts` spec, run `yarn specs` to regenerate the nitrogen output.

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

All templates extend `Template<ConfigType, ActionsType>` (`src/templates/Template.ts`), which handles:
- Lifecycle callbacks: `onWillAppear`, `onDidAppear`, `onWillDisappear`, `onDidDisappear`, `onPopped`
- Navigation stack: `setRootTemplate()`, `push()`, `popTo()`, `popToRootTemplate()`
- Header actions (buttons in the template header)

### React Component Rendering on Car Screens

Templates accept a React component (`component` prop) that renders on the car's surface. These components receive `RootComponentInitialProps` (`id`, `rootTag`, `colorScheme`, `window`). Context providers:
- `MapTemplateProvider` — exposes current `MapTemplate` via `useMapTemplate()`
- `SafeAreaInsetsProvider` — exposes insets via `useSafeAreaInsets()`

### Initialization Flow

1. App registers a headless task: `HybridAutoPlay.registerHeadlessTask(taskName, component)`
2. On car connection, native invokes the headless JavaScript task
3. App creates template instances and calls `template.setRootTemplate()` to display
4. Listen to connection events: `HybridAutoPlay.addListener('didConnect' | 'didDisconnect', cb)`

### Scenes (Non-Template Surfaces)

- `CarPlayDashboard` (iOS only) — Dashboard widget rendered alongside the main app
- `AutoPlayCluster` (both platforms) — Instrument cluster display

### Voice Input

The library exposes a cross-platform in-app voice recording API:

- `HybridAutoPlay.hasVoiceInputPermission()` — synchronously checks microphone permission
- `HybridAutoPlay.requestVoiceInputPermission()` — requests microphone permission. On Android uses the car context when Android Auto is connected, otherwise falls back to the React Native application context (`PermissionAwareActivity`). On iOS uses `AVAudioApplication` (iOS 17+) or `AVAudioSession` (iOS 15–16).
- `HybridAutoPlay.startVoiceInput(silenceThresholdMs?, maxDurationMs?, listeningText?)` — starts recording. On Android uses `CarAudioRecord` when connected, otherwise standard `AudioRecord`. On iOS uses `AVAudioEngine`; presents `CPVoiceControlTemplate` when CarPlay is connected. Resolves with a raw PCM `ArrayBuffer` (16 kHz, 16-bit, mono).
- `HybridAutoPlay.stopVoiceInput()` — stops recording early, resolving the `startVoiceInput` promise with audio captured so far.
- `HybridAutoPlay.addListenerVoiceInput(cb)` — Android-only; fires when the OS triggers a voice action (e.g. "Hey Google, navigate to…"). No-op on iOS.

Native implementations:
- iOS: `packages/react-native-autoplay/ios/utils/VoiceInputManager.swift`
- Android: `packages/react-native-autoplay/android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/VoiceInputManager.kt`

### Hooks

| Hook | Platform | Purpose |
|---|---|---|
| `useMapTemplate()` | both | Access current `MapTemplate` instance |
| `useVoiceInput()` | Android | Reactively exposes latest OS-triggered voice input (`location`, `query`). For in-app recording use `startVoiceInput`/`stopVoiceInput` directly. |
| `useSafeAreaInsets()` | both | Screen-safe padding values |
| `useFocusedEffect()` | both | Like `useEffect` but tied to template visibility |
| `useAndroidAutoTelemetry()` | Android | Vehicle telemetry (speed, fuel, battery, etc.) |

### Type System

Core shared types live in `src/types/`:
- `AutoText` — localized text with variants
- `AutoImage` — image objects (Material Symbols icon names or asset URIs)
- `AutoManeuver` — navigation maneuver (instruction, turn type, distance)
- `Trip`, `TripPoint`, `TripConfig` — navigation trip structures
- `Telemetry` — Android vehicle data

Conversion utilities in `src/utils/` translate TypeScript types to the NitroModules-compatible formats passed to native.

### Platform Differences

- **iOS-only:** `CarPlayDashboard`, scene delegate setup, CarPlay entitlements
- **Android-only:** `SignInTemplate`, `useVoiceInput` (OS-triggered), `useAndroidAutoTelemetry`, Android Automotive support
- Platform-split files use `.android.ts` / `.ios.ts` suffixes

## Code Style

- **Linter/formatter:** Biome (`biome.json`) — single quotes, 100-char line width
- **TypeScript:** Strict mode with `noUnusedLocals`, `noUnusedParameters`
- Named imports enforced; no floating promises; optional chaining preferred
- `src/types/Glyphmap.ts` is excluded from linting (generated file)
- **Any language:** Always use braces for `if` statements — no single-line braceless ifs
