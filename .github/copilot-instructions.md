# Copilot instructions

Full guidance is in [`AGENTS.md`](../AGENTS.md) at the repo root, with the contributor
documentation under [`docs/`](../docs/). Read `AGENTS.md` before making changes.

The rules that most often get broken:

- **This library uses [NitroModules](https://nitro.margelo.com) for every native call.**
  Never add a TurboModule, a `TurboReactPackage`, a `ReactContextBaseJavaModule`, an ObjC
  `RCT_EXPORT_MODULE` module, or a `NativeModules.Foo` lookup — none of them are wired up
  here. Native surface means a `src/specs/*.nitro.ts` spec + `yarn specs` + Swift **and**
  Kotlin implementations. See [`docs/native-modules.md`](../docs/native-modules.md).
- **`nitrogen/generated/` is committed and must never be hand-edited.** Commit regenerated
  output in the same commit as the spec change.
- **Never hand-edit the package version** — the publish workflow derives it from the release tag.
- **Always use braces for `if` statements**, in any language.
- **Use `import type` for type-only imports** (`verbatimModuleSyntax` is on).
- **Fill both platform branches of any action / `HeaderActions` config** — they pick one
  branch at runtime, so a half-filled config silently renders nothing on the other platform.
- **Don't delete odd-looking code before checking `docs/`.** `TravelEstimates._doNotUse`,
  the `biome-ignore noChildrenProp` comments, `fix-prefab.gradle` and everything in
  `patches/` are deliberate workarounds.
- **A change to the public API, installation steps or host-app setup must update
  `packages/react-native-autoplay/README.md` in the same PR.** It is the only documentation
  consumers get; renaming a scene delegate, a Gradle property or the `AppDelegate` hook
  silently breaks every app still following the old README.
- **Run `yarn lint:auto-play` and `yarn typecheck:auto-play` before opening a PR** (plus the
  `:example` equivalents if the example app changed) and fix everything.
- **PR descriptions stay short and high level** — a few bullets on what changed and why,
  one bullet per feature or fix, never prose or a walkthrough of the diff. Write more only
  if the person opening the PR explicitly asks.
- **If you are a tool opening the PR, sign off with the tool and the model** you are
  running as, on its own line at the bottom — e.g.
  `🤖 Generated with [Claude Code](https://claude.com/claude-code) (Claude Opus 5)`.
- Formatting is Biome (`biome.json` at the root): single quotes, 100-char lines, ES5 trailing
  commas.
