# Templates and car-surface rendering

Templates are the core abstraction. The car platform dictates which templates are allowed;
this library provides typed TS wrappers over the native CarPlay / Android Auto templates.

| Template class | Use case |
| --- | --- |
| `MapTemplate` | Navigation map with maneuvers, trip data |
| `ListTemplate` | Sectioned list/menu |
| `GridTemplate` | Button grid |
| `SearchTemplate` | Search input with results |
| `InformationTemplate` | Read-only information display |
| `MessageTemplate` | Alert/modal messages |
| `SignInTemplate` | Android-only authentication (QR/PIN/input) |

All except `MessageTemplate` extend `Template<TemplateConfigType, ActionsType>`
(`src/templates/Template.ts`), which provides an `id`, lifecycle callbacks via
`TemplateConfig` (`onWillAppear`, `onDidAppear`, `onWillDisappear`, `onDidDisappear`,
`onPopped`, plus `autoDismissMs`), the navigation stack (`setRootTemplate()`, `push()`,
`popTo()`), and `setHeaderActions()`.

Stack operations not tied to a single template live on `HybridAutoPlay`: `popTemplate()`,
`popToRootTemplate()`, `popToTemplate()`.

## The gotchas

- **Native template objects are module-level singletons, not per instance.** Each
  `src/templates/*.ts` creates one `NitroModules.createHybridObject('ListTemplate')` at
  import time; a JS `Template` instance is a thin proxy holding an `id`, and every call is
  `HybridXTemplate.method(this.id, ...)`. The id is the only correlation key, so it must be
  unique and stable for the template's lifetime. There is no dispose API.
- **Calling a method on a popped template rejects with a `templateNotFound` error.** Detect
  it with `ErrorUtil.isTemplateNotFoundError(e)` — errors are plain `Error`s matched by
  `message.startsWith(...)`; there are no typed error classes. Same for
  `isVoiceInputCanceledError` / `voiceInputCancelled`.
- **`MapTemplate` is effectively a singleton with a hard-coded `id = 'AutoPlayRoot'`.** The
  class field overwrites whatever the base constructor derived, so a user-supplied `id` is
  silently discarded, and constructing a second `MapTemplate` re-registers the same
  `AppRegistry` component name. Don't create two.
- **`MessageTemplate` does not extend `Template`** — standalone, only `push()`. It always
  sits on top of the stack, and pushing a second one pops the first.
- **`SignInTemplate` silently no-ops on iOS** (`HybridSignInTemplate` is `null` there).
- **`HeaderActions<T>` / action configs pick exactly one platform branch at runtime.**
  `NitroActionUtil.convert` reads only `actions.android` or `actions.ios` based on
  `Platform.OS` — filling in one platform silently yields no buttons on the other, with no
  warning. Always fill both.
- **`setComponent()` on `AutoPlayCluster` and `CarPlayDashboard` can only be called once** —
  a second call throws.

## MapTemplate specifics

- `updateManeuvers` requires `startNavigation()` first, and differs per platform: Android
  replaces all supplied maneuvers, iOS only updates travel estimates when maneuver ids match.
- `updateTravelEstimates(steps)` must receive only *future* steps — no origin, no passed steps.
- `showTripSelector` validates synchronously and **throws** (empty trips, empty
  `routeChoices`, routes with `< 2` steps). In `__DEV__` on Android it also warns about
  non-unique destination names, because the last step's `name` becomes the Android Auto title.
- `setManeuverState` is a no-op on Android (no equivalent API). Updating an existing alert is
  broken on Android Automotive — each `updateAlert` shows a new alert.
- **CarPlay does not repaint maneuver colors in place.** To react to a dark/light switch you
  must resend the maneuver with a *new* id. Listen to `onAppearanceDidChange` and prefer
  `ThemedColor` over static colors.

## React components on car surfaces

Templates accept a React component (`component` prop) rendered on the car's surface. It
receives `RootComponentInitialProps` (`id`, `rootTag`, `colorScheme`, `window`); cluster
components receive `AutoPlayClusterInitialProps` (adds iOS `compass`, `speedLimit`).

Providers are wired automatically and cannot be opted out of:
`MapTemplateProvider` (`useMapTemplate()`), `SafeAreaInsetsProvider` (`useSafeAreaInsets()`;
`SafeAreaView` applies them), and `WindowInformationWrapper` (keeps `window` current —
a passthrough on iOS, since CarPlay windows never resize).

Only three places render arbitrary React: a `MapTemplate`'s `component`, a cluster, and the
dashboard. `useMapTemplate()` / `useSafeAreaInsets()` / `useFocusedEffect()` work nowhere else.

## Scenes (non-template surfaces)

- `CarPlayDashboard` — iOS only, rendered alongside the main app.
- `AutoPlayCluster` — both platforms. Cluster ids are generated natively and arrive via
  `RootComponentInitialProps.id`.

## Hooks

| Hook | Platform | Purpose |
| --- | --- | --- |
| `useMapTemplate()` | both | Current `MapTemplate` instance |
| `useVoiceInput()` | Android | Latest OS-triggered voice input plus `resetVoiceInputResult()` |
| `useSafeAreaInsets()` | both | Screen-safe padding |
| `useFocusedEffect()` | both | `useEffect` tied to template visibility |
| `useAndroidAutoTelemetry()` | Android | Vehicle telemetry |

- `useFocusedEffect` treats **only** `didAppear` as focused; every other render state
  (including `willAppear`) counts as unfocused. The effect is held in a ref, so changing the
  callback does not re-run it — only `isFocused` and `deps` do.
- `useAndroidAutoTelemetry` starts only when connected **and** permissions granted. An empty
  `requiredPermissions` array trivially counts as granted. With `isAndroidAutomotive: true`,
  connection events are ignored entirely and `isConnected` comes from the initial prop.
  Telemetry payloads may be **partial** (gear changes are emitted immediately, outside the
  timed update) — consumers must merge, not replace.
- `useVoiceInput` resets itself to `undefined` when native emits an event with neither
  coordinates nor query.

## Initialization flow

1. Importing the library auto-registers the Android headless task
   `AndroidAutoHeadlessJsTask` (`src/AutoPlayHeadlessJsTask.ts`) — alive until
   `didDisconnect`. No manual registration needed.
2. On car connection native invokes the headless JS task (Android) / the scene delegate (iOS).
3. The app creates templates and calls `template.setRootTemplate()`.
4. Connection events: `HybridAutoPlay.addListener('didConnect' | 'didDisconnect', cb)`.
   Query with `isConnected()` and `isCarServiceRunning()` — the latter distinguishes a
   car-triggered headless run from e.g. a notification-triggered one.
5. Per-surface visibility: `addListenerRenderState(moduleName, cb)`; safe area:
   `addSafeAreaInsetsListener(moduleName, cb)`.
