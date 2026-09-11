# AGENT.md — ResQ

Persistent working memory for this project. Read this fully before starting
any work. `PROGRESS.md` is the detailed session-by-session history (§1 is
its own "status at a glance" table); this file is the compressed, current-
state summary — read `PROGRESS.md` only when this file points you to it for
more detail on something specific.

---

## Project Overview

**ResQ** — a disaster-preparedness / community-safety mobile app: on-device
SOS alert, live local updates, incident reporting with AI-assisted guidance,
a family safety circle, nearby safe places, and a conversational safety
assistant.

- **Stack:** Expo (React Native) + expo-router (file-based routing),
  TypeScript throughout, SDK 57, React 19.2.3 / React Native 0.86.3.
- **Goal (clarified 2026-09-10, current — trust this over any older-sounding
  language elsewhere):** a **portfolio/resume-quality build**, not an actual
  app-store submission. Every phase is still built to a genuinely working,
  non-placeholder standard — this only narrows which *business/legal* steps
  (counsel review, public hosting of legal docs, real signing credentials)
  are in scope, not the engineering bar.
- **Launch market assumption:** India first — emergency number `112`,
  DPDP Act 2023, and localization choices are built around this.
- **No backend exists.** This mobile repo is the entire project today. Every
  domain runs on local mock data by design (see Architecture) and works
  fully offline, with zero setup, out of the box.
- **`node_modules/` is not included in this archive** — run `npm install`
  before anything else in a new session.

---

Repository Root
├── app/                              # Expo Router routes (file-based navigation)
│   ├── _layout.tsx                   # Root stack: providers + Stack.Protected auth routing
│   ├── index.tsx                     # Splash / startup router
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   ├── privacy-policy.tsx             # Outside Stack.Protected groups
│   ├── terms.tsx                      # Outside Stack.Protected groups
│   │
│   ├── onboarding/                   # 5-step first-run flow
│   │   ├── _layout.tsx
│   │   ├── personal.tsx
│   │   ├── medical.tsx
│   │   ├── location.tsx
│   │   ├── family.tsx
│   │   └── emergency.tsx
│   │
│   ├── (tabs)/                       # Primary tab navigator
│   │   ├── _layout.tsx
│   │   ├── index.tsx                 # Home
│   │   ├── updates.tsx
│   │   ├── report.tsx
│   │   ├── family.tsx
│   │   └── safe.tsx
│   │
│   ├── profile.tsx                   # Full-screen, tab bar hidden
│   ├── chat.tsx                      # Full-screen, tab bar hidden
│   ├── sos.tsx                       # Emergency SOS
│   ├── sos-history.tsx               # Local SOS activation history
│   ├── readiness.tsx
│   ├── guidance-result.tsx
│   ├── notifications.tsx
│   ├── alert-preferences.tsx
│   ├── privacy-security.tsx
│   ├── family-member.tsx
│   ├── place-detail.tsx
│   └── update-detail.tsx
│
├── src/
│   ├── components/                   # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── MiniMap.tsx
│   │   ├── TabBarButtons.tsx
│   │   ├── LegalDocument.tsx
│   │   ├── icons.ts
│   │   └── ...
│   │
│   ├── theme/                        # App-wide theme system
│   │   ├── colors.ts                 # Light/dark design tokens
│   │   └── ThemeContext.tsx
│   │
│   ├── context/                      # Global React contexts
│   │   ├── AuthContext.tsx
│   │   └── NavVisibilityContext.tsx
│   │
│   ├── types/
│   │   └── index.ts                  # Shared domain types + RAG-shaped types
│   │
│   ├── data/                         # Mock data, one file per domain
│   │   ├── mock<Domain>.ts
│   │   └── ...
│   │
│   ├── services/                     # Data-fetching / backend integration layer
│   │   ├── ...
│   │   └──             # Mock ↔ real implementation switch lives here
│   │
│   ├── hooks/                        # Screen-facing hooks
│   │   ├── use<Domain>.ts
│   │   └── ...                       # Thin useAsync() wrappers
│   │
│   └── utils/                        # Shared utility functions
│       ├── age.ts                     # DOB / 18+ validation
│       ├── format.ts
│       └── location.ts
│
├── docs/
│   └── data-safety.md                # Play Store Data Safety mapping
│
├── __tests__/
│   ├── smoke.test.tsx                # Render/mount every screen
│   ├── age.test.ts
│   └── secureStorage.test.ts
│
├── .github/
│   └── workflows/
│       ├── build-release.yml         # Working unsigned build
│       └── build-release-signed.yml  # Inert signing scaffold
│
├── AGENTS.md                         # Concise project instructions for AI + developers
├── README.md                         # Developer documentation
├── package.json
├── package-lock.json
├── tsconfig.json
├── app.json / app.config.*           # Expo configuration
└── ...

## Architecture

**Core data-flow pattern — every domain follows this, no exceptions:**
```
Screen → hook (src/hooks/) → service (src/services/) → mock data | real API
```
- Screens **never** import a service or mock data directly.
- Every service checks `config.useMockData` (`src/config/env.ts`) and either
  returns local mock data or calls `apiRequest()` (`src/services/apiClient.ts`,
  a thin `fetch` wrapper: base URL injection, JSON encode/decode, timeout,
  `ApiError`).
- `config.useMockData` is **one global flag**, not per-domain (flagged as a
  Phase 4 item, not urgent).
- Switching a domain to a real backend = editing only that one service file.
  Adding a new feature = add a type → mock data → service → hook → screen
  (full recipe in `PROGRESS.md` §5 / README "Adding a new backend-connected
  feature").
- No `@tanstack/react-query` — a hand-rolled `useAsync` hook
  (`src/hooks/useAsync.ts`) every domain hook wraps. `{ data, loading, error,
  refresh }` shape maps cleanly onto `useQuery` if ever swapped in later.

**Auth & routing** (`app/_layout.tsx`, `src/context/AuthContext.tsx`):
- Auth is a **stub** — `login()`/`register()` accept any input and always
  succeed. Real screens correctly read the signed-in `user` object; nothing
  populates it from a real backend yet (Phase 3).
- Three navigation states via `Stack.Protected` (SDK 53+): logged-out →
  login/register/forgot-password; logged-in-not-onboarded → onboarding;
  logged-in-onboarded → the main app. Guard flips clear navigation history
  correctly (confirmed against expo-router's own source + official docs) —
  e.g. sign-out can't be swiped back into.
- `privacy-policy` / `terms` live **outside every `Stack.Protected` group**
  (same tier as `index`) — deliberate: expo-router won't register the same
  screen name twice, and both need to be reachable pre-login and post-login.
- Guest mode ("Emergency App Access") skips onboarding entirely and gets
  full SOS access — same `Stack.Protected` group as a real logged-in user.

**Encryption at rest** (`src/services/secureStorage.ts`, added 2026-09-10):
- Drop-in `getItem`/`setItem` replacement for `AsyncStorage`. Envelope
  encryption: AES-256-GCM payload (`expo-crypto`), single random key held in
  `expo-secure-store` (iOS Keychain / Android Keystore) — key never touches
  AsyncStorage.
- Wired into the three genuinely sensitive domains only: `profileService.ts`,
  `medicalProfileService.ts`, `familyService.ts`. Other domains (SOS history,
  notifications, chat threads, onboarding drafts) stay on plain `AsyncStorage`
  — not an oversight, just not classified as sensitive enough to warrant it
  yet; revisit if that judgment call needs revisiting.
- **Web has no Keychain/Keystore equivalent** — this module honestly falls
  back to plain `AsyncStorage` on web (`isEncryptionActive()` reports this)
  rather than faking protection. Same fallback pattern as `MiniMap.tsx`.
- `migrateLegacyPlaintext()` transparently upgrades any pre-existing plaintext
  value on first read. `destroyEncryptionKey()` + `AsyncStorage.clear()`
  together give a real, complete "delete my account" (`localDataService.ts`).
- Doesn't need a dev-client build — `expo-crypto`/`expo-secure-store` are
  both in Expo Go already (unlike MapLibre, below).

**Maps** (`src/components/MiniMap.tsx`, one reusable component):
- **Native:** real MapLibre (`@maplibre/maplibre-react-native`) over
  OpenFreeMap vector tiles — no API key, no rate limits. Requires a
  dev-client rebuild; **does not work in plain Expo Go** (native module).
- **Web:** real map too — `maplibre-gl` + `react-map-gl/maplibre`
  (`@vis.gl/react-maplibre` under the hood) over the same OpenFreeMap style.
  Both native and web branches are pulled in via `Platform.OS`-guarded
  `require()` so neither leaks into the other platform's bundle.
- **Zero-marker fallback** on either platform: the original static-pin
  illustration card.
- Deliberately wired into exactly 3 screens (`safe.tsx`, `place-detail.tsx`,
  `family-member.tsx` when that person has coordinates on file) — not every
  screen with a coordinate. `sos.tsx`'s confirmed screen has no map (open
  stretch item, not required). Full per-screen rationale: `PROGRESS.md` §3.1.

**Theming** (`src/theme/colors.ts` + `ThemeContext.tsx`):
- Zero hardcoded hex/rgba values anywhere in the app — every color is a
  named token in `lightColors`/`darkColors`, including precomputed `on*`
  contrast-safe foreground tokens (`onBrand`, `onDanger`, etc.). New colors
  go in this file first, both palettes, before use anywhere.

**Types** (`src/types/index.ts`): shared between mock and real implementations.
`RagSource`, `DisasterGuidance`, `ChatStreamEvent` are RAG-shaped contracts a
real backend can be built against directly — three domains are explicitly
designed around retrieval-augmented generation: `guidanceService.ts`
(`fetchGuidance`), `chatService.ts` (`streamChatReply` — streaming from day
one, emits `token`/`sources`/`done`/`error` events, **assumes
newline-delimited JSON**, not SSE — adjust the reader in that file if the
real backend differs), and `updatesService.ts` (`UpdateAlert.source`).
`guidance-result.tsx`'s sources + confidence badge is the reference UI
pattern for citations, already copied into `chat.tsx`.

**No separate `EmergencyContact` type** — onboarding's family-circle and
emergency-contacts steps write into one shared, de-duplicated `FamilyMember[]`
list (flagged via `isPrimaryEmergencyContact`), not two overlapping lists.
SOS messages everyone with a phone number on file, not just flagged contacts.

**Tab bar** (`src/components/TabBarButtons.tsx`): if you touch this file,
know that a real, previously-shipped-twice bug lived in prop spread order —
`{...rest}` must come *before* the component's own `style` prop, not after,
or `TabTrigger`'s forwarded style silently wipes out the layout styles. Fixed
and verified against expo-router's own official `TabButton` reference impl.

---

## Development Commands

```bash
npm install                              # required first — node_modules not included
npx expo start                           # press i (iOS sim) / a (Android emu) / w (web)
npm run test:smoke                       # jest — render-mounts every screen + unit tests
npx tsc --noEmit                         # type check
npx expo-doctor                          # config/dependency health check
npx expo export --platform web           # verify the static web build succeeds
npx expo prebuild --platform android     # verify native config-plugins resolve

# Maps require a dev-client build (MapLibre is native, not in Expo Go):
npx expo run:android                     # local toolchain (Android Studio/SDK)
npx expo run:ios                         # local toolchain, Mac + Xcode only
npx eas-cli build --profile development --platform android   # cloud build, no local toolchain
```
Re-run `expo run:android`/`run:ios` (not just `expo start`) any time
`app.json`'s `plugins` array changes — a dev client's native binary doesn't
rebuild itself on JS reload.

---

## TODO

Nothing is actively in progress. The one open, unblocked next decision:

1. **Decide the Phase 3 backend stack.** No decision recorded anywhere
   (checked the full `PROGRESS.md` archive) — genuinely still open. Needed
   before any backend code can be written.
2. **Build the backend from scratch** (Phase 3) — this is a from-zero build,
   not an integration ticket; nothing backend-side exists yet.
3. **Phase 4 — cut over from mock to real data**, one domain at a time, via
   each service's existing `if (config.useMockData)` swap point. No
   screen/hook changes needed anywhere, by design.
4. Phase 5 (hardening for public release) and Phase 6 (post-launch/scale) —
   not started, not blocking v1, no detail decided yet.

Everything else (Phases 0–2) is complete — see Completed Work below.

---

## Completed Work

- **Phase 0 — Stop lying to the user (✅ 2026-09-09).** Every dead
  button/hardcoded value fixed: Header bell, place-detail Directions/Call,
  family-member Call/Message/Locate, Privacy & Security export/delete,
  Login "Forgot?", chat thread loading. Fake "Continue with Google" removed
  outright rather than faked.

- **Phase 1 — Build the actual safety product (✅ 2026-09-10).** All
  on-device, zero backend:
  - **SOS** (`app/sos.tsx`): 2.5s press-and-hold trigger → `tel:112` +
    per-contact SMS, logged locally, viewable at `/sos-history`. Real Maps
    link in SMS/log when GPS is available.
  - **Onboarding persistence**: every step now writes a real AsyncStorage
    draft; completion merges into real `profileService`/`familyService`
    stores. Surfaced and fixed two pre-existing bugs: `familyService.ts` and
    `profileService.ts` previously only held in-memory state (edits lost on
    restart) — both are now durably persisted.
  - **Real device location** (`useDeviceLocation.ts`, request-based, not a
    watcher) feeds `useCurrentArea()`, safe-places distance sort, report
    location seed, SOS Maps link.
  - **Chat sources parity**, **`FamilyMember.inviteStatus`**,
    **DOB/bloodType in Profile's edit form**, **Medical ID display card**
    (surfaced a real bug: `MedicalProfile` had no durable storage at all —
    fixed via new `medicalProfileService.ts`), **camera capture** for
    incident reports, **local check-in reminder notification** (real
    one-off 24h `expo-notifications` schedule, not a fake repeating alarm).
  - **Real maps**, native (MapLibre + OpenFreeMap) then web
    (`maplibre-gl` + `react-map-gl`) — see Architecture above.

- **Phase 2 — Legal, privacy & store-compliance baseline (✅ 2026-09-10,
  portfolio scope).** Everything codeable is done:
  - In-app **Privacy Policy / Terms** (`app/privacy-policy.tsx`,
    `terms.tsx`, via `LegalDocument.tsx`) — real, app-specific content,
    checked against actual AsyncStorage keys and `app.json` permissions,
    not boilerplate. Linked from login/register footers + Privacy & Security.
  - **18+ registration gate** (`src/utils/age.ts`, wired into
    `register.tsx`) — decided over a fake consent checkbox because DPDP Act
    2023 requires *verifiable* parental consent this app has no backend to
    verify against. 11 unit tests cover leap years, exact-boundary
    birthdays, malformed input.
  - **`docs/data-safety.md`** — Play Console Data Safety mapping, every row
    cites its actual source file/storage key.
  - **`.github/workflows/build-release-signed.yml`** — real signed-build
    scaffolding (Android AAB + iOS IPA), gated on GitHub secrets that don't
    exist yet; `check-secrets` job fails fast naming what's missing.
    Deliberately inert — see Known Gaps.
  - **Encryption at rest** — see Architecture's "Encryption at rest" above;
    closed the Data Safety doc's previously-flagged gap.

Full per-item detail and session dates for all of the above: `PROGRESS.md`
§3 (Phase detail). §8 (archive) is old, fully-superseded session logs —
skip it unless tracing the history of a specific old fix.

---

## Known Gaps

- **Auth is a stub.** Any credentials work. Real validation needs Phase 3.
- **No backend at all.** Every "real" behavior below is on-device only.
- **`FamilyMember.latitude`/`.longitude` are static snapshots**, not live
  tracking — no backend yet for a member's own device to report position.
- **SOS history, notifications, chat threads, onboarding drafts are not
  encrypted at rest** (plain AsyncStorage) — only profile/medical/family
  went through `secureStorage.ts`. Deliberate scope, not yet revisited.
- **Signed release workflow has no real credentials wired in** — Apple
  Developer Program / Play Console accounts don't exist for this project.
  Not a blocker under the portfolio-scope goal; see `.github/workflows/README.md`
  for exactly what a human would need to provide to activate it.
- **Legal docs (Privacy Policy/Terms) aren't hosted at a public URL and
  haven't had counsel review.** Same non-blocker status as above.
- **`sos.tsx`'s confirmed screen has no map** — open stretch item from the
  maps work, never required.
- **`report.tsx`'s location field is free text**, not structured — no map
  there by design (a map doesn't clarify an editable text field).
- **No unit tests for services/hooks in isolation** beyond `age.ts` and
  `secureStorage.ts` — the render-smoke suite mounts every screen and waits
  out its mock fetch, but doesn't unit-test the mock/real service switch
  directly. Good first target for new test coverage.
- **`readinessService.ts`'s score is a straight checklist-completion
  percentage** — an explicit placeholder; a real backend should factor in
  more than the checklist (profile completeness, check-in recency, etc.).

---

## Resume Here

**Next real task: decide the Phase 3 backend stack**, then start building it
from scratch. Nothing is blocking this except the decision itself — no
partial backend work exists to pick back up.

Before writing backend code:
1. `npm install` (no `node_modules/` shipped in this archive).
2. Skim `PROGRESS.md` §4 (Decisions log) and §5 (recipe for adding a
   backend-connected feature) — the service-layer contract every domain
   already expects is defined there and in `src/services/apiClient.ts` /
   `src/config/env.ts`.
3. Whatever stack is chosen, the frontend contract is already fixed:
   `src/types/index.ts` (especially the RAG-shaped types) and each
   service's real-branch stub (`apiRequest(config.endpoints.*)`) define
   the exact request/response shapes the backend needs to satisfy — no
   frontend changes should be needed for a correctly-shaped backend.
4. Chat's real branch assumes **newline-delimited JSON** streaming, not
   SSE — either build the backend to match, or update the reader in
   `chatService.ts` if SSE is preferred.

Once Phase 3 has a real backend for even one domain, Phase 4 cutover for
that domain is: flip `config.useMockData` logic (or just set
`EXPO_PUBLIC_API_BASE_URL`) and delete that domain's mock branch — no
screen or hook changes expected.

---

## Important Decisions

- **Portfolio-build scope (2026-09-10).** This project is not heading to a
  real store submission. Changes which business/legal steps are in scope
  (counsel review, public doc hosting, real signing creds — all deferred),
  not the engineering bar (still built to a genuinely working standard).
- **No separate `EmergencyContact` type** — merged into `FamilyMember` +
  `isPrimaryEmergencyContact` flag. Tradeoff: assumes every emergency
  contact is conceptually part of the family circle.
- **Map SDK: MapLibre + OpenFreeMap** (native), **maplibre-gl + react-map-gl**
  (web) — chosen over `react-native-maps` specifically to avoid needing a
  Google Maps API key on Android. Full rationale + live re-verification
  notes: `PROGRESS.md` §3.1.
- **Maps scoped to exactly 3 screens**, not "everywhere there's a
  coordinate" — a deliberate, user-requested scope limit.
- **Guest mode gets full SOS access**, same as a registered user — a
  side effect of guest sessions sharing the same `Stack.Protected` group as
  logged-in users, not a specifically-reasoned SOS choice. Worth revisiting
  if a future session wants to narrow guest capabilities.
- **Minimum age: 18, enforced client-side at registration.** DPDP Act 2023
  requires verifiable parental consent this app can't yet verify — treat
  this as "an honest, good-faith gate," not a compliance guarantee, until
  Phase 3 can support real identity/consent verification.
- **Legal screens live outside every `Stack.Protected` group** — not
  duplicated per-group (expo-router disallows duplicate screen names
  anyway; both screens genuinely need pre- and post-login reachability).
- **Signed release builds built as inert scaffolding, not skipped
  entirely** — real credentials are a human/paid decision, not something to
  fake or guess at.
- **Envelope encryption over a custom cipher** for at-rest protection — key
  in OS-native secure storage, ciphertext in AsyncStorage, honest plaintext
  fallback on web rather than fake protection there.

---

## Verified Findings

*(Confirmed in a working sandbox with real network/npm access on
2026-09-10 — re-verify if a long time has passed or the environment
differs.)*

- **51/51 tests passing** baseline: 28 render-smoke + 11 `age.ts` unit +
  12 `secureStorage.ts` unit tests.
- `npx tsc --noEmit` clean.
- `npx expo-doctor`: 19–20/21 in network-restricted sandboxes (the 1–2
  failures are Expo's own remote validation servers being blocked by
  sandbox network policy — not project bugs); expect 21/21 on a normal
  machine with full network access.
- `npx expo export --platform web` succeeds for real, produces a separate
  `maplibre-gl-*.css` (~83KB) and `maplibre-gl-*.js` (~1.1MB) chunk
  alongside the entry bundle, across all 34 static routes.
- `npx expo prebuild --platform android` succeeds with the MapLibre config
  plugin registered.
- Dependency versions in `package.json` are matched against
  `node_modules/expo/bundledNativeModules.json` (the manifest Expo itself
  ships) rather than guessed ranges.
- `Stack.Protected`'s guard-flip history-clearing behavior was confirmed by
  reading expo-router's actual source, not assumed — cross-checked against
  Expo's official docs (dated after this app's SDK 57 release).
- `maplibre-gl@^6.9.0` is ESM-only (`"type": "module"`, no CJS build) and
  resolves under Metro because `unstable_enablePackageExports: true` is the
  metro-config default at this project's installed version — no extra
  Metro config was needed for this.
- This project's installed `@expo/metro-config` (57.0.12) defaults
  `isCSSEnabled: true`, so `maplibre-gl`'s CSS import needs no loader config.
