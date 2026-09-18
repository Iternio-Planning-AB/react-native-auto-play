---
name: nitro-native-modules
description: Adding or changing native code in this library — a native module, method, spec, Swift or Kotlin implementation, or anything under nitrogen/. Use before writing any native code, and whenever you are tempted to create a TurboModule, a TurboReactPackage, a ReactContextBaseJavaModule, an RCT_EXPORT_MODULE, or a NativeModules lookup. This repo uses NitroModules exclusively — none of those will work here.
---

# Native modules (NitroModules)

The full reference lives in
**[`docs/agents/nitro-native-modules.md`](../../docs/agents/nitro-native-modules.md)**.

**Read that file now, in full, before writing any native code.** It is the single source of
truth; this skill deliberately does not restate it, so acting on the summary below alone
will get the details wrong.

The non-negotiables it covers, so you know what you're looking for:

1. **Never** add a TurboModule, a `TurboReactPackage`, a `ReactContextBaseJavaModule`, an
   ObjC `RCT_EXPORT_MODULE` module, or a `NativeModules.Foo` lookup. Every native call in
   this library goes through NitroModules, with no exceptions — the legacy paths are not
   wired up and will not link.
2. Native surface is added by editing a `src/specs/*.nitro.ts` spec (and `nitro.json` for a
   new module), then running `yarn specs`, then implementing the generated protocol in
   **both** Swift and Kotlin.
3. `nitrogen/generated/` is committed and must never be hand-edited. Commit the regenerated
   output in the same commit — the publish workflow fails on a dirty tree, and stale
   nitrogen output makes `pod install` fail obscurely.
4. Some things that look like dead code are codegen workarounds — `TravelEstimates._doNotUse`
   most of all. Don't delete them.
5. Never hand-edit the package version; the publish workflow derives it from the release tag.

Then follow the file, not this summary.
