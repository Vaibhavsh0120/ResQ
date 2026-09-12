# AGENT.md — ResQ

Concise AI/human working memory for this repo. For full historical detail
and design rationale, see `PROGRESS.md` (this project's own long-form
session log, ~2000 lines, maintained since before this file existed —
don't duplicate it here, link into it by §).

## Project Overview

**ResQ** — a personal-safety Expo/React Native app (SOS, medical profile,
family circle, safe-places finder, disaster guidance). Portfolio/resume-
quality build, not heading to a real store submission (see PROGRESS.md's
"Working assumptions"). India-first (emergency number 112, DPDP Act 2023).
Runs entirely on local mock data — **no backend exists yet**; Phase 3
(build one from scratch) is the next real unblocked decision.

## Repository Structure

```
app/                  expo-router screens (file-based routing)
  (tabs)/             Home, Updates, Report, Family, Safe places
  onboarding/          multi-step signup flow
src/
  components/         shared UI (Header, MiniMap, icons.ts, ...)
  services/            mock data services (one per domain; swap point for a real API)
  hooks/               data-fetching hooks (useAsync-based)
  context/             React context providers
  theme/               colors.ts (all tokens), ThemeContext.tsx (light/dark)
  data/                mock*.ts fixtures
  types/               shared TS types
  utils/
__tests__/             jest-expo smoke tests + a couple of unit suites
docs/data-safety.md    Play Store Data Safety mapping doc
```

## Architecture

- **Expo SDK ~57, expo-router, React 19, RN 0.86.** `react-native-web`
  for web builds (`expo export --platform web` does real static
  rendering per-route).
- **No hardcoded colors** — everything through `src/theme/colors.ts`
  tokens (`colors.brand`, `colors.onDanger`, etc.). See README's
  "Theming" section.
- **Mock-data services** in `src/services/*Service.ts` are the seam for
  a future real backend — each returns the same shape a real API would.
- **At-rest encryption**: `src/services/secureStorage.ts` — AES-256-GCM,
  key in `expo-secure-store`, used for profile/medical/family data.
- **Platform-specific files**: this project uses RN's standard
  `.web.tsx` extension resolution (Metro/Expo Router pick the right file
  per platform automatically) rather than runtime `Platform.OS` branches,
  where a whole implementation differs by platform — see `MiniMap.tsx`
  vs `MiniMap.web.tsx` as the reference pattern.

## Development Commands

```
npm install                        # postinstall syncs maplibre-gl's worker
                                    # build into public/vendor/ automatically
                                    # (see scripts/sync-maplibre-worker.js) —
                                    # expo install fails in network-restricted
                                    # sandboxes (hits expo.dev's version-check
                                    # API), use plain npm install instead
npx tsc --noEmit                    # typecheck
npx jest --config jest.config.js    # smoke + unit tests (53 tests)
npx expo export --platform web      # verifies the web build actually bundles
npx expo start --web                # dev server (needs a real browser to view)
npx expo run:ios|android            # native — needs a dev-client build for MapLibre
npm audit                           # 0 vulnerabilities as of 2026-09-11
```

## TODO

No open task. Both plans below (2026-09-11 session 2, and the earlier
2026-09-11 nav/UX pass) are complete — see Completed Work for what
shipped and Known Gaps for what's still unverified beyond static/syntax
checks. If a new task starts, write its plan here before implementing,
per the standard workflow.

## Completed Work

- **Voice conversation page + SOS layout fix (2026-09-11 session 2).**
  - **SOS UI bug, fixed at the root cause**: `Screen.tsx`'s
    `scroll={false}` branch was missing `flex: 1` on its wrapper `View`,
    so `sos.tsx`'s `triggerWrap` (which needs `flex: 1` to center within
    full available height) collapsed to near-zero space — exactly the
    reported screenshot (button pinned near the top, title/subtitle/hint
    invisible, huge dead zone below). Confirmed `sos.tsx` was the only
    caller of `scroll={false}` before fixing it at the component level.
  - **`app/voice.tsx`** — a full-screen "talk to ResQ" page: tap an
    animated orb to speak, get a real spoken reply back (`expo-speech`,
    added to `package.json` at `~57.0.3`), with the orb pulsing while
    listening and while ResQ talks. Reached from a new mic button next to
    Home's "Ask ResQ" composer row; registered in `_layout.tsx` and the
    smoke test's `staticScreens`.
  - **Speech-to-text is real on web, honestly unavailable on native.**
    `src/services/voiceService.ts` (native) / `.web.ts` (web) — the same
    platform-file pattern as `MiniMap.tsx`/`MiniMap.web.tsx`.
    `voiceService.web.ts` wires the browser's actual `SpeechRecognition`/
    `webkitSpeechRecognition` API (zero install, genuinely works in
    Chrome/Edge/Safari today). `voiceService.ts` (native) reports
    `available: false` with a clear reason and never fabricates a
    transcript — real on-device STT needs `expo-speech-recognition`
    (community package, config plugin + dev-client rebuild), which can't
    be installed/linked/verified in this sandbox (no network access, see
    Verified Findings). `voice.tsx` falls back to a typed-input composer
    on native; the reply still comes back with full text-to-speech.
  - **`src/services/ttsService.ts`** wraps `expo-speech` with a
    safety-net timeout (word-count-based estimate) so a misfire of
    `onDone`/`onStopped`/`onError` — a real, tracked issue on some web
    browsers — can never leave `useVoiceAssistant`'s phase stuck on
    `'speaking'` forever.
  - **`src/hooks/useVoiceAssistant.ts`** orchestrates
    listen → `streamChatReply` (same pipeline `useChat`/`chat.tsx` already
    use, so voice and text share one brain and one mock/real seam) →
    speak. Phase state machine (`idle | listening | thinking | speaking |
    error`) plus an `amplitude` value driving the orb: real mic-level
    input where the platform provides it, a word-boundary pulse while
    ResQ speaks, and a gentle synthetic pulse fallback in between so the
    orb is never visibly dead when no real signal is available.
  - **Verification**: no `node_modules` in this sandbox (standing
    constraint, see Verified Findings), so no `tsc --noEmit`/jest/`expo
    export` run was possible this session. Every new/edited file was
    instead syntax-checked via TypeScript's `transpileModule` (a real
    JSX/TS parse, independent of module resolution) — all clean, zero
    errors. This confirms syntactic correctness only, not a real
    build/typecheck/runtime pass — see Known Gaps.

- **Navigation/UX fix pass (2026-09-11), user-reported.**
  1. **Systemic nav fix.** Every "back" action that used
     `router.replace('/(tabs)/...')` (readiness, chat/Ask ResQ,
     family-member, place-detail incl. its "Back to safe places" button,
     update-detail incl. its "Back to updates" button, sos.tsx's close
     actions) now uses `router.canGoBack() ? router.back() :
     router.replace(fallback)` — the idiom already established by
     `alert-preferences.tsx`/`notifications.tsx`. Every *forward*
     navigation from Home/tab screens to a leaf/detail route that used
     `replace` (Home's SOS/readiness/chat/quick-actions/tab-shortcut
     buttons; `updates.tsx` → update-detail/readiness/alert-preferences;
     `family.tsx` → family-member; `report.tsx` → guidance-result;
     `safe.tsx` → place-detail) now uses `push`, so a real stack entry
     exists to go back to. `sos.tsx` is now reached via `push` from Home
     (its `finalizeAndClose`/close-button comments updated accordingly;
     `_layout.tsx` keeps `gestureEnabled: false` on it — deliberate
     screen, no accidental swipe-dismiss). Left untouched, correctly: the
     three places that push `/(tabs)` *itself* as a destination
     (`guidance-result.tsx`'s and `report.tsx`'s "Back to home" buttons,
     `profile.tsx`'s family-tab link) — already documented as a different
     case, verified via `getNavigationAction.js`/`stateUtils.js`
     (`findDivergentState`): tab-to-tab navigation within the same
     `(tabs)` group Home lives in resolves to a same-instance tab switch
     regardless of push/replace, since the divergent navigator there is
     the tabs navigator, not the root stack — so Home's own tab-shortcut
     buttons (`/(tabs)/updates`, `/report`, `/safe`, `/family`) were
     safely switched to `push` too, not just leaf/detail routes.
  2. **Chat drawer swipe-to-close.** `chat.tsx`'s previous-chats drawer
     (`Modal` + two nested `Pressable`s) now uses
     `Gesture.Pan()`/`GestureDetector` (`react-native-gesture-handler`,
     already a dependency) driving a `useSharedValue`
     (`react-native-reanimated`, `4.5.1` — already a dependency with its
     babel worklets plugin already wired in `babel.config.js`, just never
     previously exercised in app code) for a right-to-left swipe-to-close,
     on top of the existing tap-outside-to-close. `Modal`'s own
     `animationType` set to `"none"` since the drawer now animates itself
     (avoids double-animating). The drawer is left-anchored, so the
     shared value's convention is `0` (open) → `-drawerWidth` (closed,
     off-screen left); the backdrop's opacity is derived from the same
     value so it fades in lockstep with the slide.
  3. **Family tab.** The check-in card moved from the bottom of the
     screen to directly after the summary row (before the person
     list/add-form) — it's time-sensitive and was easy to miss below the
     fold. The "Add someone to your circle" inline form now has a Cancel
     button (outline variant, alongside "Send invite") that closes the
     form and clears its fields, matching what a successful send already
     did.
  4. **Updates tab.** Removed the header's refresh icon button; added
     pull-to-refresh instead. `Screen.tsx` gained optional
     `onRefresh`/`refreshing` props (native `RefreshControl` on its
     `ScrollView`) — a reusable addition any other screen using `Screen`
     can opt into later, not a one-off. `updates.tsx` distinguishes
     first-load (`loading && !updates`, shows the full-screen
     `LoadingState`) from a refresh-of-already-loaded-data
     (`loading && !!updates`, keeps the list mounted and shows only the
     native pull spinner) — using `loading` directly for both would have
     flashed the list away on every pull-to-refresh.
  5. **Report tab.** The previously-decorative "Get immediate safety
     guidance" card in the pre-report (hazard-selection) step is now a
     real shortcut: tapping it pushes `/guidance-result` with whatever
     hazard types are currently selected (or none — `guidance-result.tsx`
     already falls back to general guidance when `types` is empty, so
     this works before picking anything above too).
  - **Verification**: same syntax-check method as the voice-page work
    above (TypeScript `transpileModule` on every touched file) — all
    clean. No `tsc --noEmit`/jest/`expo export` run this session (see
    Known Gaps).

- **Phases 0–2 complete** (stop-lying-to-the-user pass, full safety
  product, legal/privacy baseline) — see PROGRESS.md §1 for the table.
- **Real maps, both platforms.** `src/components/MiniMap.shared.tsx` +
  `MiniMap.tsx` (native, MapLibre RN + OpenFreeMap) +
  `MiniMap.web.tsx` (web, MapLibre GL JS v6 + the same OpenFreeMap
  tiles) — wired into `safe.tsx`, `place-detail.tsx`, `family-member.tsx`,
  and (2026-09-11) `sos.tsx`'s confirmed screen. See PROGRESS.md §3.1 for
  the original SDK-choice rationale and "Important Decisions" below for
  the 2026-09-11 v5→v6 security bump.
- **Web markers weren't rendering — missing `.maplibregl-marker` CSS
  (2026-09-11).** Root cause: `maplibre-gl`'s `Marker` only sets
  `transform` on its wrapper, relying on `maplibre-gl.css`'s
  `.maplibregl-marker{position:absolute}` for the positioning base —
  `MiniMap.web.tsx` deliberately skips importing that stylesheet (see
  Important Decisions) and hadn't carried this one rule over. Fixed by
  adding just that rule to the existing injected `<style>` tag. Two other
  hypotheses (a v6 `isStyleLoaded()` change; the
  `setMissingStyleImageResolver()` console warnings) were checked and
  ruled out first — see Verified Findings for the `Marker` mechanism, full
  narrative in PROGRESS.md. Verified at the build level only — `tsc
  --noEmit` clean, all 53 jest tests pass, `expo export --platform web`
  bundles all 34 routes, and the exported bundle greps confirm
  `.maplibregl-marker{position:absolute` is present in the output JS (see
  Known Gaps for what that does and doesn't prove).
- **`sos.tsx` confirmed screen now shows a MiniMap (2026-09-11)** of the
  user's live coordinates (`kind: 'danger'`), same component/pattern as
  every other call site; hidden entirely when no GPS fix is available.
  Closes the "no map on SOS confirmed screen" gap.
- **`useAsync.ts` stale-response race fixed (2026-09-11).** `refresh()`
  and the mount/deps-change effect now share one call-id guard instead of
  each having its own throwaway `cancelled` closure — previously, calling
  `refresh()` while an earlier call (mount, or a prior `refresh()`) was
  still in flight let the stale response resolve after the fresh one and
  silently overwrite newer data. Real, reachable path: `sos.tsx`'s
  `fire()` then `finalizeAndClose()` both call `useSosHistory().logEvent`
  → `refresh()` in quick succession. Regression test:
  `__tests__/useAsync.test.ts` (confirmed it fails against the pre-fix
  implementation, passes against the fix).
- **`npm audit`: 0 vulnerabilities (2026-09-11)**, down from 16 (15
  moderate + 1 critical). See "Important Decisions" below for what each
  fix actually was and why `--force` was deliberately not used.
- **At-rest encryption** for profile/medical/family data
  (`secureStorage.ts`).
- **Signed release build workflow** exists but has no real credentials
  wired in (portfolio-scope, not a blocker — see PROGRESS.md §3.2).

## Known Gaps

- **Voice page + nav/UX pass (2026-09-11 session 2) verified at the
  syntax level only — no `npm install` was possible this session** (no
  network access in this sandbox; standing constraint, see Verified
  Findings). Every touched file was parsed clean via TypeScript's
  `transpileModule`, which catches malformed JSX/TS but proves nothing
  about: whether `expo-speech@~57.0.3` actually resolves/installs
  cleanly against this project's exact dependency tree; whether the
  `Gesture.Pan()`/reanimated drawer in `chat.tsx` actually animates
  correctly on a real device/simulator (the sign convention, clamping,
  and velocity-based close threshold were reasoned through by hand, not
  run); whether `expo-speech`'s actual on-device behavior matches its
  documented API surface; or whether the browser `SpeechRecognition`
  path in `voiceService.web.ts` behaves as expected in a real browser.
  **Before trusting this work**: run `npm install`, then `npx tsc
  --noEmit`, `npx jest --config jest.config.js` (the new
  `jest.mock('expo-speech', ...)` in `smoke.test.tsx` needs real
  `expo-video`-style validation — confirm it doesn't mask an import
  error), and `npx expo start --web` to manually open `/voice` and
  `/chat`'s drawer and confirm both the orb animation and the swipe
  gesture behave as designed. Also worth a native run
  (`expo run:ios`/`android` via a dev-client build) to confirm
  `expo-speech`'s TTS actually speaks and `onBoundary`/`onDone` fire as
  expected there — this was reasoned from Expo's docs, not observed.
- **No backend.** Everything is mock data today.
- **Web map v6 migration + the marker-CSS fix above are both verified at
  the build/bundle level only** — `tsc`, the full jest suite, and a real
  `expo export --platform web` all pass; the exported `dist/` was grepped
  to confirm `setWorkerUrl()` is called, `/vendor/maplibre-gl-worker.mjs`
  is baked into the bundle, `dist/vendor/*.mjs` exist and are
  byte-identical (`md5sum`-verified) to `node_modules/maplibre-gl/dist/`,
  and (2026-09-11) that `.maplibregl-marker{position:absolute` is present
  in the exported JS — but actual pixel rendering (does the worker load
  and render tiles, and do markers actually appear at the right spot,
  when a real browser hits a running server?) still hasn't been visually
  confirmed (no browser in this sandbox). Jest can't cover this either —
  see the `jest-expo`/`Platform.OS` finding below, `MiniMap.web.tsx` is
  never exercised by the test suite at all. Check the browser console on
  `localhost:8081/safe` first: if tiles don't load, check the Network tab
  for a 404 on `/vendor/maplibre-gl-worker.mjs` (static file not served);
  if tiles load but markers still don't appear, open devtools and inspect
  whether a `.maplibregl-marker` element exists with a `transform` style
  but computed `position: static` (would mean the injected `<style>` tag
  isn't winning — check for a specificity/load-order conflict) rather than
  assuming the CSS fix itself was wrong.
- Signed-release workflow has no real credentials; legal docs aren't
  publicly hosted or counsel-reviewed — both fine under this project's
  portfolio scope, both real gaps if that scope ever changes (see
  PROGRESS.md §3.2).
- No eslint config exists in the repo (`npm run lint` / `expo lint` would
  prompt to create one interactively) — not treated as a gap under this
  project's portfolio scope, noting it here so it isn't mistaken for an
  oversight next time someone looks for a lint command.

## Resume Here

No open task. The most recent work (voice page + nav/UX pass, 2026-09-11
session 2) is the least-verified thing in this repo right now — if
picking this up next, start there: `npm install`, `npx tsc --noEmit`,
`npx jest`, then `npx expo start --web` and manually check `/voice` and
`/chat`'s drawer swipe (see Known Gaps above for exactly what to look
for). After that, the web map (v6 migration + the marker-CSS fix) is the
next thing that's only been verified at the build level, never in a real
browser — `npx expo start --web`, open `/safe` (or any MiniMap screen),
confirm markers are visible. Otherwise: read PROGRESS.md §1 (status
table) for the phase overview, then whichever §3.x section matches what
you're about to touch.

## Important Decisions

- **Map SDK: MapLibre + OpenFreeMap** (not `react-native-maps`, not
  Google/Apple Maps) — no API key needed on any platform. Native uses
  `@maplibre/maplibre-react-native@^11.3.10`.
- **Web map SDK: `maplibre-gl` v6 (bumped from v5 on 2026-09-11)** — v5
  was originally kept specifically to avoid v6's ESM-only Web Worker
  problem (see below), but v5 has no fix for CVE-2026-85061
  (GHSA-jrc7-96c5-q579, CVSS 10, XSS sanitizer bypass in the built-in
  attribution control's `innerHTML` path — fixed in 6.4.1+, no v5
  backport exists and none is planned). Since this app already runs with
  `attributionControl: false` on web (and `attribution={false}` on
  native), the actual exploit path was never reachable here — but "we
  think we're not exploitable" isn't the same as "patched," and staying
  on a version npm audit flags as critical isn't defensible just because
  of that. Pinned exact to `6.9.0` (`--save-exact`, no `^` — see below
  for why).
  - **The ESM/worker problem this used to avoid, and how it's actually
    solved now:** v6 ships ESM-only and needs `setWorkerUrl()` called
    before the first `new Map(...)`. The bundler-specific ways to get
    that URL (Vite's `?worker&url`, webpack/Rspack's `new URL(...,
    import.meta.url)`) have no Metro equivalent — that part of the old
    reasoning was correct and is still true. But MapLibre's own docs
    describe a third option for exactly this case: serve the worker file
    yourself and pass a plain string path. This app does that:
    `scripts/sync-maplibre-worker.js` copies
    `maplibre-gl-worker.mjs` + `maplibre-gl-shared.mjs` (the worker
    imports the shared chunk by relative path, so both must be
    co-located) from `node_modules/maplibre-gl/dist/` into
    `public/vendor/` — Expo Router's root `public/` directory is copied
    verbatim to `dist/` during `expo export --platform web` and served
    from the site root on both the dev server and a real deployment — and
    `MiniMap.web.tsx` calls `setWorkerUrl('/vendor/maplibre-gl-worker.mjs')`
    before constructing the map. `public/vendor/` is gitignored (fully
    reproducible from `node_modules`) and the sync script runs via
    `postinstall`, so it can't drift out of sync with whatever
    `maplibre-gl` version is actually installed — **which is also why
    the version is pinned exact rather than a caret range**: an
    unpinned bump could otherwise update the SDK in `node_modules` on
    some future `npm install` without anyone re-running the sync step in
    the same moment, and a worker-build/main-bundle version mismatch is
    exactly the kind of thing that fails silently.
  - **v6's other breaking changes, and what each one means here:**
    WebGL1 support is dropped (WebGL2-only) — `MiniMap.web.tsx` now
    catches the `Map` constructor throwing and falls back to the
    existing static-pin illustration instead of crashing. Named imports
    (`import { Map, Marker, LngLatBounds } from 'maplibre-gl'`, already
    what this file used) are unaffected. The two other API changes v6
    made (`styleimagemissing` → `setMissingStyleImageResolver`,
    `map.transform` removed) aren't used anywhere in this codebase.
  - Full migration detail and comments live directly in
    `src/components/MiniMap.web.tsx` — read that file's top-of-file
    comment before touching it again, it's more complete than this
    summary.
- **`npm audit` fixes taken individually, not via `--force`
  (2026-09-11).** `--force` suggests downgrading `expo` to `46.0.21`/
  `expo-router` to `5.1.11` — stale advisory-range matching, not a real
  fix. Done instead: `maplibre-gl` critical CVE via the v6 jump (above).
  `decode-uri-component` DoS (GHSA-vcc3-ghjq-m6fr, moderate, reachable via
  `expo-router@57.0.20`'s `query-string` pin) fixed via a `package.json`
  `overrides` entry forcing `decode-uri-component@^0.5.0` — safe since
  only basic decode/error-handling is used anywhere in this chain. `uuid`
  bounds-check bug (GHSA-w5hq-g745-h8pq, moderate, reachable only via
  `xcode`'s `uuid.v4()` in dev-machine build tooling, never shipped)
  fixed via `overrides: { "uuid": "^11.1.1" }`. Verified via a clean
  `npm ci`: `npm audit` → 0 vulnerabilities, `tsc --noEmit` clean, all 53
  jest tests pass, `expo export --platform web` bundles all 34 routes.
- **`maplibre-gl.css` is never imported** on web — only styles chrome
  this app doesn't use (default markers, nav/popup controls); the two
  rules that matter (cursor, touch-action) are injected as a 2-line
  `<style>` tag instead, sidestepping an unverified node_modules
  CSS-import path through Metro. (Also now doubles as one more reason
  this app was never on the exploitable path for CVE-2026-85061 above —
  the vulnerable code was inside the attribution control, which this app
  disables outright on both platforms.)
- **Platform-specific files over runtime branches** for anything where
  native and web genuinely need different implementations (not just
  different styling) — see `MiniMap.tsx`/`MiniMap.web.tsx`. Prefer this
  pattern over a `Platform.OS` conditional `require()` when the two
  paths are substantial, since Metro excludes the other platform's file
  from the bundle entirely rather than just skipping it at runtime.
- **Project goal clarified as portfolio-quality, not a real store
  launch** — changes which Phase 2/5 items are real blockers vs. already
  "complete enough." See PROGRESS.md's "Working assumptions."
- Full list of smaller decisions (encryption scheme, theming convention,
  data-safety mapping, etc.) — see PROGRESS.md §1 and the relevant §3.x.

## Verified Findings

- `expo install` fails in network-restricted sandboxes (hits expo.dev's
  version-compatibility API, not npm) — use plain `npm install
  <pkg>@<version>` instead; confirm the version is real first with
  `npm view <pkg> versions`.
- `jest-expo`'s default test platform reports `Platform.OS === 'ios'`,
  not `'web'` — a `.web.tsx` platform-file sibling is never picked up by
  the existing Jest config; native `.tsx` files are what smoke tests
  actually exercise. (This also means Jest never exercises
  `MiniMap.web.tsx`/the v6 worker wiring — that whole file's correctness
  rests on the `expo export` bundle checks above, not on test coverage.)
- `maplibre-gl` v6 is pure ESM (`package.json` has no `main`/CJS entry,
  only `"type": "module"` + `exports["."].import`) and exports
  `Map`/`Marker`/`LngLatBounds`/`setWorkerUrl` etc. as named exports —
  the same `import { Map, Marker, LngLatBounds } from 'maplibre-gl'` style
  already used here works unchanged from v5. (v5 was CJS/UMD with the
  same named-export shape; only the module system underneath changed.)
- `maplibre-gl`'s npm package ships `dist/maplibre-gl-worker.mjs` and
  `dist/maplibre-gl-shared.mjs` (the worker imports the shared chunk by
  relative path — both files must be copied together, copying just the
  worker breaks it) — confirmed by installing v6.9.0 into a scratch
  directory and inspecting `dist/`.
- Expo's base tsconfig (`expo/tsconfig.base.json`) already includes
  `"lib": ["DOM", "ESNext"]`, so plain DOM JSX intrinsics (`<div>`,
  `<style>`) and DOM types type-check fine in `.web.tsx` files with no
  extra tsconfig changes.
- `npx expo export --platform web` renders each route through a
  Suspense boundary that resolves to an empty shell in the static HTML
  (real content only appears after client hydration) — true across
  every route (checked `login.html` too, not just map screens), so an
  "empty" static HTML body is expected here, not a bug.
- Expo Router's root `public/` directory is copied verbatim into `dist/`
  during `expo export --platform web` (confirmed: `public/vendor/*.mjs`
  → `dist/vendor/*.mjs`, byte-identical via `md5sum`) and is also served
  from the site root by `expo start --web`'s dev server — this is what
  makes the `setWorkerUrl('/vendor/...')` static-file approach above
  work in both dev and the exported build without any bundler-specific
  wiring.
- `npm audit fix --force` is not reliable on this project as of
  2026-09-11 — it matches against advisory version ranges that don't
  correspond to any real available fix for the installed Expo SDK 57
  line, and following it would downgrade `expo`/`expo-router` by
  10+ majors. Check what it actually proposes (`--dry-run`) before ever
  running it for real here; prefer targeted `overrides` entries once
  you've confirmed the fixed version is API-compatible with how the
  vulnerable transitive dependency is actually used.
- `@testing-library/react-native@14.0.1`'s `renderHook`/`act` (imported
  from the package root) work fine under this project's `jest-expo`
  preset for testing plain hooks (no component needed) — both are
  async (`await renderHook(...)`, `await act(async () => {...})`); see
  `__tests__/useAsync.test.ts` for the pattern (controlling promise
  resolution order to test race conditions).
- `@maplibre/maplibre-react-native`'s `MLRNCameraModule` crash in Expo Go
  (documented, expected — see README's "Running with maps (dev-client
  build)") has a cascading symptom worth recognizing: when
  `require('@maplibre/maplibre-react-native')` throws at the top of
  `MiniMap.tsx`, every route file that imports `MiniMap` (`family-
  member.tsx`, `place-detail.tsx`, `sos.tsx`, `(tabs)/safe.tsx`) never
  finishes evaluating either, so expo-router logs a separate `Route "..."
  is missing the required default export` warning for each one — even
  though all four genuinely have a normal `export default function ...`.
  This is downstream noise from the same root cause, not a real routing
  regression; don't go looking for a missing export in those files if you
  see this warning; look for the `MLRNCameraModule` error above it in the
  log instead.
- `maplibre-gl` v6.9.0's `Marker` class positions its wrapper element
  purely via `element.style.transform = 'translate(...)'` — confirmed
  directly in `node_modules/maplibre-gl/dist/maplibre-gl.mjs`'s marker
  update path. It never sets `position` inline; that's the job of
  `maplibre-gl.css`'s `.maplibregl-marker{position:absolute;top:0;left:0;}`
  rule. An app that skips importing that stylesheet (as this one does,
  deliberately — see "Important Decisions") must still carry that one
  rule itself, or markers exist in the DOM with a correct transform but
  render in normal document flow instead of at the intended position.
  `Map.isStyleLoaded()`/the `'load'` event kept the same semantics from
  v5 to v6 (also confirmed directly against the installed dist) — not
  related to this bug, checked and ruled out first.
- **`react-native-gesture-handler@2.32`'s modern gesture API is
  `Gesture.Pan()` + `<GestureDetector>`** (not the legacy
  `<PanGestureHandler>` component) paired with `reanimated`'s
  `useSharedValue`/`useAnimatedStyle`/`runOnJS`. The gesture's `onChange`
  callback exposes `changeX`/`changeY` (per-frame delta, not cumulative)
  and `onEnd` exposes `velocityX`/`velocityY` — both confirmed via
  RNGH's own docs/source, used in `chat.tsx`'s drawer. `runOnJS(...)` is
  required to call a JS-thread function (e.g. a `useState` setter) from
  inside a gesture callback, since those run as UI-thread worklets by
  default. This project's `babel.config.js` already had
  `react-native-worklets/plugin` configured (SDK 57+'s split-out
  replacement for the old `react-native-reanimated/plugin`) even though
  no app code had used reanimated before this session — the wiring was
  already correct, just unexercised.
- `RefreshControl` needs a real component to keep mounted during a
  refresh, not a full-screen loading state swapped in for it — reusing
  `useAsync`'s existing `loading` flag for pull-to-refresh only works
  correctly if the screen distinguishes "first load, no data yet" from
  "loading again, but I already have data to keep showing" (see
  `updates.tsx`'s `isInitialLoad`/`isRefreshing` split); using `loading`
  directly for both flashes the whole list away on every pull.
