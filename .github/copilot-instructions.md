# Copilot instructions

Full guidance for AI coding agents is in [`AGENTS.md`](../AGENTS.md) at the repo root, with
task-specific references under [`docs/agents/`](../docs/agents/). Read `AGENTS.md` before
making changes.

The rules that most often get broken:

- **This library uses [NitroModules](https://nitro.margelo.com) for every native call.**
  Never add a TurboModule, a `TurboReactPackage`, a `ReactContextBaseJavaModule`, an ObjC
  `RCT_EXPORT_MODULE` module, or a `NativeModules.Foo` lookup — none of them are wired up
  here. Native surface means a `src/specs/*.nitro.ts` spec + `yarn specs` + Swift **and**
  Kotlin implementations. See [`docs/agents/nitro-native-modules.md`](../docs/agents/nitro-native-modules.md).
- **`nitrogen/generated/` is committed and must never be hand-edited.** Commit regenerated
  output in the same commit as the spec change.
- **Never hand-edit the package version** — the publish workflow derives it from the release tag.
- **Always use braces for `if` statements**, in any language.
- **Use `import type` for type-only imports** (`verbatimModuleSyntax` is on).
- **Fill both platform branches of any action / `HeaderActions` config** — they pick one
  branch at runtime, so a half-filled config silently renders nothing on the other platform.
- **Don't delete odd-looking code before checking `docs/agents/`.** `TravelEstimates._doNotUse`,
  the `biome-ignore noChildrenProp` comments, `fix-prefab.gradle` and everything in
  `patches/` are deliberate workarounds.
- **PR descriptions stay short and high level** — a few bullets on what changed and why,
  one bullet per feature or fix, never prose or a walkthrough of the diff. Write more only
  if the person opening the PR explicitly asks.
- Formatting is Biome (`biome.json` at the root): single quotes, 100-char lines, ES5 trailing
  commas.
