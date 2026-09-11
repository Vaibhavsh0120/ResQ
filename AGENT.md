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

Nothing in-flight. Next real unblocked decision is Phase 3 (backend
stack) — see PROGRESS.md §4's "not yet made" list. The web-map marker fix
below is verified at the build level only (see Known Gaps) — a real
browser check is the one thing worth doing before calling the v6 web map
migration fully done.

## Completed Work

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
  (2026-09-11).** User-reported: map tiles rendered on web but no markers
  appeared. Root cause: `maplibre-gl`'s `Marker` class only ever writes
  `element.style.transform = 'translate(...)'` on its wrapper element
  (confirmed directly in `node_modules/maplibre-gl/dist/maplibre-gl.mjs`)
  — it relies entirely on `maplibre-gl.css`'s `.maplibregl-marker{
  position:absolute; top:0; left:0; }` rule to give that transform an
  absolute-positioning base. `MiniMap.web.tsx` deliberately never imports
  that stylesheet (see "Important Decisions" below for why) and had only
  ported the canvas cursor rules into its own injected `<style>` tag, not
  this one — so every marker existed in the DOM with a correct transform
  but rendered in normal document flow instead of at its intended pixel
  position. Two other hypotheses were checked and ruled out first: a v6
  API change to `isStyleLoaded()`/the `'load'` event (checked against the
  installed v6.9.0 source directly — semantics unchanged from v5, not the
  cause), and the "office"/"gate" `setMissingStyleImageResolver()`
  console warnings the user saw (confirmed as unrelated: OpenFreeMap's
  own vector style failing to resolve two unused POI sprite icons, no
  connection to `Marker` instances, which are separate DOM elements, not
  style-driven symbols). Fix: added the one load-bearing
  `.maplibregl-marker` rule to `ensureCanvasStyle()`'s existing injected
  `<style>` tag (not a full `maplibre-gl.css` import — see that function's
  comment for why just this rule). Verified at the build level (see Known
  Gaps for what that does and doesn't confirm): `tsc --noEmit` clean, all
  53 jest tests pass, `expo export --platform web` bundles all 34 routes,
  and the exported bundle was grepped to confirm
  `.maplibregl-marker{position:absolute` is present in the output JS.
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

No open task, but the web map (v6 migration + the 2026-09-11 marker-CSS
fix) is the one thing in this repo that's only been verified at the build
level, never in a real browser — if picking this up next, `npx expo start
--web` and actually open `/safe` (or any MiniMap screen) first, and
confirm markers are now visible, before touching anything else. Otherwise:
read PROGRESS.md §1 (status table) for the phase overview, then whichever
§3.x section matches what you're about to touch.

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
  (2026-09-11).** `npm audit fix --force` on this project suggests
  downgrading `expo` from `~57.0.21` to `46.0.21` and `expo-router` to
  `5.1.11` — npm's resolver matching against stale advisory version
  ranges, not a real fix; taking it would have been actively worse than
  doing nothing. What was actually done instead:
  - `maplibre-gl` critical CVE: see above (real fix, needed the v6 jump).
  - `decode-uri-component` DoS (GHSA-vcc3-ghjq-m6fr, moderate) — reachable
    through `expo-router@57.0.20`'s own URL-path parsing (a crafted deep
    link could freeze the client JS thread; no data exposure). expo-router
    57.0.20 is already the newest 57.x release and itself pins
    `query-string: ^7.1.3` (which pins the vulnerable
    `decode-uri-component`), so there's no non-breaking upgrade path
    through expo-router directly. Fixed via a `package.json` `overrides`
    entry forcing `decode-uri-component@^0.5.0` — safe because only
    `decodeUriComponent()`'s basic decode/error-handling behavior is used
    anywhere in this dependency chain, unchanged across that version gap.
  - `uuid` bounds-check bug (GHSA-w5hq-g745-h8pq, moderate) — only
    reachable through `xcode` (used by `@expo/config-plugins` to generate
    the native iOS project during `expo prebuild`/`expo run:ios` — build
    tooling that runs on a developer machine, never shipped in the app
    itself). `xcode`'s only use of the package is `uuid.v4()`
    (`node_modules/xcode/lib/pbxProject.js`), an API stable across every
    `uuid` major version. Fixed via `overrides: { "uuid": "^11.1.1" }`.
  - Verified via a genuine `npm ci` from a clean `node_modules/` (matching
    what a real clone would do): `npm audit` → 0 vulnerabilities, `tsc
    --noEmit` clean, all 53 jest tests pass, `expo export --platform web`
    bundles all 34 routes.
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
