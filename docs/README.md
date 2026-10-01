# Contributor documentation

Documentation for working **on** this library. If you are using it in an app, you want the
[package README](../packages/react-native-autoplay/README.md) instead — installation,
platform setup and the full API reference live there.

These files cover the things the source does not make apparent: behaviour that differs per
platform, workarounds that look like dead code, and failure modes that produce no error at
all. [`AGENTS.md`](../AGENTS.md) at the repo root is the short version — the rules and the
common task recipes — and points here for the detail.

| File | Covers |
| --- | --- |
| [native-modules.md](native-modules.md) | NitroModules, specs and codegen; adding a native method; the committed `nitrogen/generated/` output; the release flow |
| [templates.md](templates.md) | The template system, scenes, hooks, car-surface React, and the traps in each |
| [types-and-conversions.md](types-and-conversions.md) | `src/types/`, the `Nitro*` conversion utilities, icon fonts and glyphs, voice input options |
| [host-app-integration.md](host-app-integration.md) | What a consuming app wires up, iOS threading rules, and the Android Gradle properties — the mechanics behind the README's setup steps |
| [patches.md](patches.md) | Why each patch in `patches/` exists and what breaks without it |
| [example-app.md](example-app.md) | Running and changing the example app |

Three of these are also agent skills under [`.skills/`](../.skills), symlinked into
`.claude/skills/`, `.agents/skills/` and `.cursor/skills/`.
