# AGENTS.md

Guidance for AI coding agents (Claude Code, Cursor, Devin, Copilot, …) working in this repo.
This is the single source of truth — `CLAUDE.md` is a symlink to this file.

## Agent etiquette

Deliberately the first section: tools inject this file into every agent's context and
truncate it — the Devin CLI at 16 KB, which this file must stay under. The rules that must
never be missed live here, where nothing can cut them off. Check with `wc -c AGENTS.md`
before adding to it.

- **This library uses [NitroModules](https://nitro.margelo.com) for every native call.
  Never add a TurboModule, a `TurboReactPackage`, a `ReactContextBaseJavaModule`, an ObjC
  `RCT_EXPORT_MODULE` module, or a `NativeModules.Foo` lookup.** Adding native surface means
  editing a `src/specs/*.nitro.ts` spec, running `yarn specs`, and committing the
  regenerated `nitrogen/generated/` output — read
  [`docs/native-modules.md`](docs/native-modules.md) in full
  before you write any native code.
- **`nitrogen/generated/` is committed (~500 files) and must never be hand-edited.** After
  `yarn specs` / `yarn prepare`, commit the regenerated output in the same commit. The
  publish workflow fails if `yarn install` leaves the tree dirty, and stale nitrogen output
  makes `pod install` fail with no useful error.
- **Do not hand-edit the package version.** `.github/workflows/npm-publish.yml` derives it
  from the GitHub release tag.
- **Always use braces for `if` statements** — no single-line braceless ifs, in any language.
- **Use `import type` for type-only imports** (`verbatimModuleSyntax` is on).
- **Fill in both platform branches of any `HeaderActions` / action config.** They pick
  exactly one branch at runtime based on `Platform.OS`, so a half-filled config silently
  renders no buttons on the other platform, with no warning.
- **Do not add code comments that just restate the code.** Comments here earn their place by
  documenting non-obvious intent, a workaround, or an invariant.
- **Do not remove existing comments** unless the code they describe is also removed. Several
  odd-looking constructs here are deliberate codegen workarounds — notably
  `TravelEstimates._doNotUse` and the `biome-ignore noChildrenProp` comments — and are
  documented as such in the on-demand docs below. Check before deleting anything that looks
  like dead code.
- Don't commit, push, or open PRs unless explicitly asked. The default branch is `master`.
- **Keep PR descriptions short and high level.** Default to a few bullets covering what
  changed and why — not prose, not a walkthrough of the diff, not a per-file account. When
  a PR carries several features or fixes, list them as **one bullet each** rather than
  describing them in paragraphs. Detail belongs in the code and the commit message; the
  description is for a reviewer deciding what to look at. Write more only if the person
  opening the PR explicitly asks for it.
  When you do open one, fill in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)
  honestly — delete rows that don't apply rather than ticking them, and never tick a
  "tested on a head unit" box you did not do. Anything visible on a car surface needs a
  screenshot or recording; bug fixes name the hardware and OS they reproduce on.
- **If you are a tool opening the PR, sign off with the tool *and the model* you are
  running as** — on its own line at the bottom, e.g.
  `🤖 Generated with [Claude Code](https://claude.com/claude-code) (Claude Opus 5)` or
  `🤖 Generated with Cursor (GPT-5)`. Naming only the tool tells a reviewer less than it
  looks: the repo has no other way to know which model wrote the diff.
- **Don't create summary or report markdown files unless asked.** Put the summary in your
  reply, not in a new file at the repo root.
- Before committing or opening a PR, run `yarn lint:auto-play` and `yarn typecheck:auto-play`
  (plus the `:example` equivalents if you touched the example app) and fix everything.
- Keep changes minimal and consistent with the surrounding file's style.
- **Adding to this file? It holds only what must be in context *all the time*.** Because
  tools truncate it, appended text silently pushes existing rules out of context rather than
  just making the file longer. Anything task-specific — a procedure for one subsystem,
  reference tables, anything phrased "if you're doing X…" — goes in its own
  `docs/<topic>.md` with a trigger-phrased pointer in the table below. Hard
  prohibitions stay inline; only the explanation moves.
- **A change to the public API, installation steps or host-app setup must update
  [`packages/react-native-autoplay/README.md`](packages/react-native-autoplay/README.md) in
  the same PR.** It is the only documentation consumers get — there is no docs site — and
  it already covers entitlements, scene delegates, the `AppDelegate` hook, the
  `ReactNativeAutoPlay_*` Gradle properties, icon fonts and the API reference. Renaming a
  scene delegate, a Gradle property or the `AppDelegate` method silently breaks every
  consumer whose setup still follows the old README.
- **Changing a rule means changing it everywhere, in the same PR.**
  `.github/copilot-instructions.md` and `.cursor/rules/project.mdc` carry a deliberate
  **subset** of the rules above — the ones that apply while editing code or opening a PR —
  because neither tool reads `AGENTS.md` and neither supports an include. Session etiquette
  (don't commit unless asked, don't write summary files, this rule) stays here only.
  Likewise each `docs/<topic>.md` is summarised, not reproduced, by its
  `.skills/<name>/SKILL.md`. So a rule being absent from a mirror is fine; a rule that
  **contradicts** its mirror is not. If you change a rule that a mirror does carry, change
  it there too.

## On-demand docs

`docs/` holds the contributor documentation for this repo — the non-obvious behaviour,
silent failure modes and workarounds that the source does not make apparent. It is written
for humans and agents alike; read the relevant one **before** starting that kind of work.
Three of them are also skills (`.skills/<name>/`, symlinked into `.claude/skills/`,
`.agents/skills/` and `.cursor/skills/`), so any agent that supports skills can invoke them
by name.

| Read before… | File |
| --- | --- |
| Adding or changing any native module, spec or generated code | [`docs/native-modules.md`](docs/native-modules.md) |
| Working with templates, scenes, hooks or car-surface React | [`docs/templates.md`](docs/templates.md) |
| Touching `src/types/`, `src/utils/Nitro*`, glyphs or voice options | [`docs/types-and-conversions.md`](docs/types-and-conversions.md) |
| Changing anything a consuming app has to wire up (iOS/Android) | [`docs/host-app-integration.md`](docs/host-app-integration.md) |
| Touching `patches/` or upgrading RN / expo-splash-screen | [`docs/patches.md`](docs/patches.md) |
| Running or changing the example app | [`docs/example-app.md`](docs/example-app.md) |
| Changing installation, setup or the public API (update it!) | [`packages/react-native-autoplay/README.md`](packages/react-native-autoplay/README.md) |
| Running the example app on a head unit or simulator | [`apps/example/README.md`](apps/example/README.md) |

## Common tasks

Step lists, not prose. Follow them in order; skipping a step usually fails silently rather
than at build time.

### Adding or changing a native method

1. Edit the `src/specs/*.nitro.ts` spec (add the module to `nitro.json` if it's new).
2. `yarn specs` in `packages/react-native-autoplay/`.
3. Implement the generated protocol in **both** `ios/hybrid/` (Swift) and
   `android/.../reactnativeautoplay/` (Kotlin), even if one platform is a no-op.
4. Wrap it in `src/hybrid/` if the raw signature is awkward; export from `src/index.ts`.
5. Commit the regenerated `nitrogen/generated/` output **in the same commit**.

Full detail and the reasoning: [`docs/native-modules.md`](docs/native-modules.md).

### Adding a new template

A template is not one file — it is eight, and the two Kotlin dispatch sites are the ones
that get missed. Using `InformationTemplate` as the worked example:

1. `src/specs/InformationTemplate.nitro.ts` — the spec.
2. `nitro.json` — add an `autolinking` entry naming `HybridInformationTemplate` for both
   platforms (or one, for a platform-exclusive template).
3. `yarn specs`.
4. `src/templates/InformationTemplate.ts` — the public class. Extend
   `Template<ConfigType, HeaderActions<T>>`, convert the config with the `Nitro*Util`
   helpers, and call the hybrid object's `create…` method from the constructor.
5. `ios/hybrid/HybridInformationTemplate.swift` + `ios/templates/InformationTemplate.swift`.
6. `android/.../HybridInformationTemplate.kt` +
   `android/.../template/InformationTemplate.kt`.
7. **`android/.../AndroidAutoScreen.kt` — two separate `when` branches**: the back-action
   lookup and the template construction. Updating only one compiles fine and misbehaves at
   runtime.
8. `ios/extensions/CarPlayTemplateExtensions.swift` — the `CP*Template` convenience init,
   if the CarPlay type needs one.
9. `src/index.ts` — `export * from './templates/<Name>'`.

Template semantics and the traps in step 4: [`docs/templates.md`](docs/templates.md).

## Repository structure

Yarn workspaces monorepo:

- `packages/react-native-autoplay/` — the core library, published as `@iternio/react-native-auto-play`
- `apps/example/` — example app (`example` workspace) demonstrating all features
- `patches/` — patch-package patches, applied via the root `postinstall`
  (`scripts/conditional-patch.js`, which skips patches for packages that aren't installed)

## Commands

Root (monorepo):

```bash
yarn lint:auto-play        # Lint the core library
yarn typecheck:auto-play   # Type-check the library
yarn build:auto-play       # Full library build (workspace `prepare`)
yarn lint:example          # Lint example app
yarn typecheck:example     # Type-check example app
yarn start                 # Metro for the example app
yarn ios                   # Run example app on iOS
yarn android               # Run example app on Android
yarn android:adb           # adb reverse port setup (./adb_port_setup.sh)
```

Library (`packages/react-native-autoplay/`):

```bash
yarn prepare        # Full build: yarn circular && tsc && nitrogen
yarn lint           # Biome check on src/
yarn lint-ci        # Biome check with CI reporter
yarn typecheck      # tsc --noEmit
yarn circular       # Detect circular dependencies (dpdm)
yarn specs          # Re-generate Nitrogen specs
yarn clean          # Remove build artifacts
yarn swift:format   # Format Swift source files (swift-format)
```

`.github/workflows/code-quality-checks.yml` runs lint + typecheck + build for the library and
lint + typecheck for the example app on PRs. `.github/workflows/npm-publish.yml` publishes.

## What this library does

`@iternio/react-native-auto-play` provides Apple CarPlay and Android Auto/Automotive
integration for React Native apps, as a **template-based UI system** bridged to native via
NitroModules.

**The public API, installation and host-app setup are documented in
[`packages/react-native-autoplay/README.md`](packages/react-native-autoplay/README.md)** —
features, entitlements, `Info.plist`, `AppDelegate`, Gradle properties, icon fonts and the
full API reference. That is the consumer-facing source of truth; it is not duplicated here,
and a change to any of it belongs in the README. What follows is only the repo-internal
layout an agent needs to navigate the source.

The three layers, roughly:

1. `src/specs/*.nitro.ts` — codegen input; `nitrogen/generated/` — codegen output.
2. `ios/` (Swift) and `android/src/main/java/com/margelo/nitro/swe/iternio/reactnativeautoplay/`
   (Kotlin) — the native implementations of those specs.
3. `src/templates/`, `src/hybrid/`, `src/hooks/`, `src/types/`, `src/utils/` — the public
   TypeScript API, exported from `src/index.ts` (`src/index.web.ts` is the web stub).

Templates: `MapTemplate`, `ListTemplate`, `GridTemplate`, `SearchTemplate`,
`InformationTemplate`, `MessageTemplate`, `SignInTemplate` (Android-only). Non-template
surfaces: `CarPlayDashboard` (iOS) and `AutoPlayCluster` (both).

## Platform differences

- **iOS-only:** `CarPlayDashboard`, scene delegate setup, CarPlay entitlements,
  `listeningText` / `listeningImage`
- **Android-only:** `SignInTemplate`, `useVoiceInput` (OS-triggered),
  `useAndroidAutoTelemetry`, `HybridAndroidAutomotive`, `HybridAndroidWindowInformation`,
  Android Automotive support
- Platform-split files use `.android.ts` / `.ios.ts` suffixes; `index.web.ts` is a web stub
- Platform-exclusive native modules are `null` on the other platform and every call site uses
  `?.`, so they silently no-op rather than throwing. Follow that pattern.
- Flag platform-exclusive APIs with a `@namespace iOS` / `@namespace Android` JSDoc tag.

## Code style

- **Linter/formatter:** Biome — single config at the repo root (`biome.json`), single quotes,
  100-char line width, ES5 trailing commas, organize-imports assist on
- **TypeScript:** `strict` with `noUnusedLocals`, `noUnusedParameters`,
  `noUncheckedIndexedAccess`, `noImplicitReturns`, `verbatimModuleSyntax`
- Named imports enforced; `noShadow` and `noFloatingPromises` enabled; optional chaining
  preferred (`useOptionalChain`)
- `packages/react-native-autoplay/src/types/Glyphmap.ts` is excluded from linting (generated
  per-app glyph map; not checked in)
