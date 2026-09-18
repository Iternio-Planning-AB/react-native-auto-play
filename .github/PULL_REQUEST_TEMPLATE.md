<!--
Keep the sections that fit and delete the rest — a one-line PR does not need all of them.
Titles follow `fix:` / `feat:` / `chore:` / `docs:` with an optional scope.
-->

## Summary

<!-- High-level bullets: what changed and why. Not a walkthrough of the diff. -->

## Problem

<!--
For bug fixes: the symptom, then the root cause. Name the hardware, OS and tool versions
you reproduced on — "Galaxy S25 / Android 16", "Xcode 26.4", "iOS 27" — since most bugs
here are host-specific. Delete this section for straightforward features.
-->

## Motivation

<!--
For new API: why it's needed and what was impossible before. Link the Apple / Google
documentation for the platform feature being wrapped. Delete for bug fixes.
-->

## Usage

<!-- New or changed public API: a short snippet showing the call. Delete if none. -->

## Screenshots / recordings

<!--
Required for anything visible on a car surface. One per template or surface, captioned
with what it shows and on which platform. Head-unit screenshots or a screen recording
from the Desktop Head Unit / CarPlay Simulator are the norm here.
-->

## Test plan

<!-- Checkboxes. Say which platform and which head unit or simulator. -->

- [ ] Tested on Android Auto (Desktop Head Unit / real head unit — say which)
- [ ] Tested on CarPlay (Xcode CarPlay Simulator / real head unit — say which)

## Checklist

<!-- Delete rows that don't apply. -->

- [ ] `yarn lint:auto-play` and `yarn typecheck:auto-play` pass (plus `:example` if the
      example app changed)
- [ ] **Native code goes through NitroModules** — no TurboModule, `TurboReactPackage`,
      `ReactContextBaseJavaModule`, `RCT_EXPORT_MODULE` or `NativeModules` lookup
- [ ] Any `src/specs/*.nitro.ts` change was followed by `yarn specs`, and the regenerated
      `nitrogen/generated/` output is **committed in this PR**
- [ ] New or changed native methods are implemented on **both** iOS (Swift) and Android
      (Kotlin), or deliberately no-op on one via the `?.` pattern
- [ ] A new template updates **both** `when` branches in `AndroidAutoScreen.kt` (back-action
      lookup and construction) and is exported from `src/index.ts`
- [ ] Action / `HeaderActions` configs fill in **both** the `ios` and `android` branches
- [ ] `package.json` version is **not** hand-edited (the release workflow sets it from the tag)
- [ ] Agent-facing docs updated if behaviour changed: `AGENTS.md`, `docs/agents/*`,
      `.skills/*`, `.cursor/rules/*`, `.github/copilot-instructions.md`

<!--
If an AI agent wrote this PR, keep its attribution footer (e.g.
"🤖 Generated with [Claude Code](https://claude.com/claude-code)") so reviewers can see it
at a glance — that is already the convention in this repo.
-->
