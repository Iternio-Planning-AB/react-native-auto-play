---
name: autoplay-templates
description: Working with CarPlay / Android Auto templates in this library — MapTemplate, ListTemplate, GridTemplate, SearchTemplate, InformationTemplate, MessageTemplate, SignInTemplate, clusters, the dashboard, the template navigation stack, maneuvers, trips, or the hooks that only work on a car surface (useMapTemplate, useFocusedEffect, useSafeAreaInsets, useAndroidAutoTelemetry).
---

# Templates and car surfaces

The full reference lives in **[`docs/templates.md`](../../docs/templates.md)**.

**Read that file now, in full, before adding or changing a template.** This skill
deliberately does not restate it.

The traps it covers, so you know what you're looking for:

1. **Native template objects are module-level singletons, not per instance.** A JS
   `Template` is a thin proxy holding an `id`; every call is
   `HybridXTemplate.method(this.id, …)`. The id is the only correlation key. There is no
   dispose API, and calling into a popped template rejects with `templateNotFound`.
2. **`MapTemplate` has a hard-coded `id = 'AutoPlayRoot'`** and is effectively a singleton —
   any id you pass is silently discarded. Don't construct two.
3. **`MessageTemplate` does not extend `Template`** and has only `push()`.
4. **Action and `HeaderActions` configs pick exactly one platform branch at runtime.**
   Filling only `ios` or only `android` yields no buttons on the other platform, silently.
5. Several methods no-op or behave differently per platform (`setManeuverState`,
   `updateManeuvers`, `SignInTemplate` on iOS), and CarPlay will not repaint maneuver colors
   in place — a theme switch needs a resend with a **new** id.
6. `useMapTemplate()` / `useSafeAreaInsets()` / `useFocusedEffect()` only work inside a
   component rendered on a car surface: a `MapTemplate`'s `component`, a cluster, or the
   dashboard. Nowhere else.

Then follow the file, not this summary.
