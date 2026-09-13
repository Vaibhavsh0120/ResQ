# AGENT.md — ResQ

Concise AI/human working memory for this repo. This is the sole source
of project history and rationale — there is no separate long-form log
file, so anything worth remembering belongs here.

## Project Overview

**ResQ** — a personal-safety Expo/React Native app (SOS, medical profile,
family circle, safe-places finder, disaster guidance). Portfolio/resume-
quality build, not heading to a real store submission — see "Project
goal clarified as portfolio-quality" under Important Decisions for what
that does and doesn't mean for outstanding gaps. India-first (emergency
number 112, DPDP Act 2023).
Runs entirely on local mock data — **no backend exists yet**; Phase 3
(build one from scratch) is the next real unblocked decision.

**Standing direction (set 2026-09-12, governs all frontend work until
told otherwise):** push as much real functionality into the frontend as
honestly possible — real local persistence (secureStorage/AsyncStorage,
matching the existing `familyService.ts`/`profileService.ts` pattern),
real client-side logic, real UX — so that when Phase 3's backend arrives,
it only has to take over the things that genuinely require a server:
cross-device sync, real auth (password verification, sessions, token
refresh), a real AI backend, anything needing a shared source of truth
across users/devices. The test for any given feature: "can this be fully
real on-device today, with data that persists across app restarts, even
though it doesn't sync anywhere yet?" If yes, build it for real now —
don't defer it to the backend plan just because a backend will
eventually also touch it. If no (it fundamentally needs a server to be
real, not just to sync), implement the best honest frontend
approximation, say so plainly, and add it to this file's TODO/Known Gaps
as backend-dependent work — never silently skip it or silently fake it
as if it were fully real. This is why, for example, chat/voice
conversation history moved from "planned backend work" to "build it for
real now" — nothing about persisting a conversation locally needs a
server; only cross-device sync of that history does, and that's the
part staying on the backend TODO.

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
- **Layering: `screen → hook → service → (mock | real)`.** Every
  feature follows this — screens never import a service or mock data
  directly. To add a new backend-connected feature: (1) add/extend a
  type in `src/types/index.ts`; (2) add mock data in
  `src/data/mock<Domain>.ts` matching that type exactly; (3) add a
  service in `src/services/<domain>Service.ts` with the
  `if (config.useMockData) { ... } return apiRequest(...)` pattern —
  copy any existing service as a template; (4) add a hook in
  `src/hooks/use<Domain>.ts`, usually a thin `useAsync(fetchThing, [])`
  wrapper; (5) call the hook from the screen.
- **Mock-data services** in `src/services/*Service.ts` are the seam for
  a future real backend — each returns the same shape a real API would.
  `config.useMockData` is one global flag for every domain, not
  per-domain — fine for now, a real Phase 4 cutover item.
- **At-rest encryption**: `src/services/secureStorage.ts` — AES-256-GCM,
  key in `expo-secure-store`, used for profile/medical/family data.
- **Platform-specific files**: this project uses RN's standard
  `.web.tsx` extension resolution (Metro/Expo Router pick the right file
  per platform automatically) rather than runtime `Platform.OS` branches,
  where a whole implementation differs by platform — see `MiniMap.tsx`
  vs `MiniMap.web.tsx` as the reference pattern.
- **No `react-query`** — a hand-rolled `useAsync` hook instead
  (`src/hooks/useAsync.ts`). Deliberate, every data-fetching hook
  follows it.
- **Auth is a stub** — `login()`/`register()` accept anything; real
  screens correctly read the signed-in `user` object, they just don't
  populate it from a real backend yet (Phase 3). Registration's DOB/18+
  gate is a genuine client-side check, not a stub — it's the *identity*
  behind the account that's still unverified, not the age math itself.
- **Chat streaming assumes newline-delimited JSON** from a future
  backend — adjust `chatService.ts` if the real API uses SSE instead.

## Development Commands

```
npm install                        # postinstall syncs maplibre-gl's worker
                                    # build into public/vendor/ automatically
                                    # (see scripts/sync-maplibre-worker.js) —
                                    # works in this sandbox as of 2026-09-12
                                    # (npm registry is reachable); expo
                                    # install still fails (needs expo.dev's
                                    # version-check API, not on the allowlist)
                                    # — use plain npm install/npm ci instead
npx tsc --noEmit                    # typecheck — clean as of 2026-09-13
npx jest --config jest.config.js    # smoke + unit tests — 71/71 pass as of 2026-09-13
npx expo export --platform web      # verifies the web build actually bundles — 35/35 routes, 2026-09-13
npx expo start --web                # dev server (needs a real browser to view)
npx expo run:ios|android            # native — needs a dev-client build for MapLibre
npm audit                           # 0 vulnerabilities as of 2026-09-12
```

## Data Model & Pages Reference

**Data model** (`src/types/index.ts` unless noted) — additions beyond
an initial scaffold, kept here since they're not obvious from the types
file alone:
- `FamilyMember.phone`, `.lastKnownLocation`, `.isPrimaryEmergencyContact`,
  `.inviteStatus` (`'pending' | 'accepted'`), `.latitude`/`.longitude`
  (optional — only set for members who've actually shared a location;
  never fabricated for ones who haven't).
- `SafePlace.phone`; `NotificationItem`/`NotificationKind`; `ChatThread`
  (`ChatThreadSummary` + `messages`); `MedicalProfile` (allergies,
  conditions, usesMobilityAid, hasVisualImpairment, hasHearingImpairment);
  `ProfileData.dob`/`.bloodType`; `SosEvent` (id, triggeredAt,
  calledEmergencyNumber, contactsNotified, location).
- **Deliberately not added**: a separate `EmergencyContact` type — one
  `FamilyMember.isPrimaryEmergencyContact` flag covers it instead, since
  onboarding's family-circle and emergency-contact steps used to keep
  two overlapping lists that could drift; now one merged, de-duplicated
  circle. A structured address on `ProfileData` — stays a single
  free-text field since every screen reading `location` expects a plain
  string. A second registration-time DOB field on `ProfileData` —
  `register.tsx`'s 18+ gate validates inline and only uses the value for
  math, it doesn't silently pre-fill onboarding's own separate `dob`
  field (which is skippable and shouldn't assume a value the user
  didn't expect remembered).

**Map SDK: MapLibre + OpenFreeMap**, not `react-native-maps` — chosen
for zero API key on either platform (react-native-maps defaults to paid
Google Maps on Android) and OpenFreeMap's no-rate-limit tile hosting
(survived a real 100k req/s spike in Aug 2025 per their own postmortem).
Setup needs a dev-client rebuild either way — this doesn't work in plain
Expo Go. Maps are deliberately scoped to 3 screens with real value
(`safe.tsx`, `place-detail.tsx`, `family-member.tsx` when a member has
coordinates on file), not added to every screen with a coordinate —
`report.tsx` (free-text location field, a map doesn't clarify that) and
`updates.tsx`/`family.tsx`'s list view stay map-free by design.
`sos.tsx`'s confirmed screen also has one now (added 2026-09-11, shown
only when a GPS fix exists). Web uses `maplibre-gl` v6.9.0 (pinned
exact, not v5 — see Important Decisions for the CVE that forced the
v5→v6 migration and how the ESM/worker problem that originally kept it
on v5 was actually solved) via a platform-split
`MiniMap.shared.tsx`/`MiniMap.tsx`/`MiniMap.web.tsx`, not `react-map-gl`.

**Pages map** — current status of every route not already covered in
Completed Work above:

| Route | Status |
|---|---|
| `app/index.tsx` | Splash/startup router. Solid. |
| `app/login.tsx`, `register.tsx`, `forgot-password.tsx` | Real local flows; auth itself is a stub (see Architecture) pending Phase 3. |
| `app/privacy-policy.tsx`, `terms.tsx` | Real, app-specific content; not hosted at a public URL (portfolio scope). |
| `app/onboarding/*.tsx` (5 steps) | All real persistence via `onboardingService.ts`, merging into the real stores on completion. |
| `app/(tabs)/index.tsx` (Home) | Real greeting/date/counts; SOS entry point. |
| `app/(tabs)/updates.tsx`, `report.tsx`, `family.tsx`, `safe.tsx` | All real data + persistence; `family.tsx` needs real backend-side invite accept/decline (Phase 3). |
| `app/chat.tsx`, `voice.tsx` | Real conversation persistence (`chatService.ts`), sources rendering, mic-interrupt/barge-in. |
| `app/readiness.tsx`, `alert-preferences.tsx`, `privacy-security.tsx` | All three now genuinely persist their toggles (audit closed 2026-09-13 — see Completed Work). |
| `app/guidance-result.tsx`, `family-member.tsx`, `place-detail.tsx`, `update-detail.tsx` | Real data, real maps where applicable, all individually audited clean. |
| `app/profile.tsx` | Real persistence, Medical ID card, no loading-flash. |
| `app/notifications.tsx`, `sos-history.tsx` | Local storage only (real, not mocked), real destinations. |
| `app/sos.tsx` | Working press-and-hold trigger, real Maps link, local logging. Needs push/alarm + hardware trigger (Phase 3/5). |

**Missing screens, not yet built**: `help-support.tsx`; an internal
moderation/verification tool (Phase 3, backend-dependent).

## TODO

**Open task: the critical/premium-quality review — not started.**

The hardcoded-data audit that preceded this (find screens that silently
reset/fake persistence) is fully closed and verified as of 2026-09-13 —
see Completed Work for what it found and fixed. Don't re-run it from
scratch; it should only resurface if new screens/features are added.

This review is a distinct, substantial piece of work from that audit —
the audit asked "does this pretend to be real when it isn't"; this asks
"is this actually good, professional, premium work" even where a screen
IS honestly wired to mock data (UX friction, error-handling gaps,
accessibility, consistency, edge cases, anything a careful reviewer
would flag before calling a screen done). Don't skip it just because the
audit already found and fixed some things — different category of issue.

- No plan written yet for how to scope/sequence the critique (which
  screens first, what counts as in-scope vs. a visual-redesign concern)
  — start there before diving into individual screens.
- The user's *next* session after this one will be a full visual
  redesign (light/dark theme, purple accent on neutral black/white,
  prompt already shared in an earlier conversation) — stays explicitly
  out of scope for this review, but the critique should still surface
  functional/UX issues worth fixing independent of that later visual
  pass, not visual-design opinions the redesign session will supersede
  anyway.
- Known Gaps below lists specific, still-open items (voice/chat gesture
  feel, web map pixel-rendering) that a real browser/device can close
  quickly — worth folding into this review's pass rather than treating
  as separate, since they're exactly the kind of "does this actually
  work well" question the review is for.

## Completed Work

- **Hardcoded-data audit (2026-09-12 → closed 2026-09-13), user-
  requested — found and fixed 3 real "silently resets, never actually
  saves" bugs, all verified (typecheck + jest + web export all green):**
  - **`alert-preferences.tsx`'s weather/community/traffic/family
    toggles** were local `useState` initialized to hardcoded defaults
    every mount — nothing the user chose ever persisted. Fixed with a
    new `src/services/alertPreferencesService.ts` (plain AsyncStorage —
    these are just category on/off flags, no personal data) +
    `src/hooks/useAlertPreferences.ts` (optimistic toggle, same pattern
    as `useReadiness.ts`'s `toggleItem`).
  - **`readinessService.ts`'s `toggleReadinessItem`** computed the
    updated checklist/score correctly but never wrote it anywhere —
    `useReadiness.ts`'s `override` was purely in-memory, so every
    checked-off item reverted to `mockReadiness`'s hardcoded `done:
    true` on restart. Fixed the same way (plain AsyncStorage, storing
    which item ids are done; `fetchReadiness` overlays that onto the
    mock checklist and recomputes the score). Covered by
    `__tests__/readinessPersistence.test.ts` (4 tests: default state,
    toggle-survives-refetch, score recomputation, un-toggling).
  - **`privacy-security.tsx`'s "Share live location" / "Visible to my
    circle" toggles** (found 2026-09-13, continuing the same audit) —
    identical bug: local `useState(true)`, no service backing either
    flag, confirmed via grep that neither was read anywhere else in the
    codebase. Fixed with `src/services/privacySettingsService.ts` +
    `src/hooks/usePrivacySettings.ts` (same AsyncStorage/optimistic-
    toggle pattern as the two fixes above), wired into
    `privacy-security.tsx` with a proper `isInitialLoad` gate (was
    previously rendering both loading and content at once, the same
    profile.tsx flash bug fixed earlier — now consistent). Covered by
    `__tests__/privacySettings.test.ts` (5 tests, including a missing-
    key-merges-with-defaults case and corrupted-storage fallback).
    `localDataService.ts`'s "delete my account" needed no change — it
    already wipes AsyncStorage generically via `getAllKeys()`, not a
    hardcoded key list, so the new storage key is covered automatically.
  - **Full sweep confirmed clean**: every other screen checked
    individually (`place-detail.tsx`, `update-detail.tsx`,
    `sos-history.tsx`, `terms.tsx`/`privacy-policy.tsx`,
    `notifications.tsx`) plus a broader grep of every
    `useState(true|false)` call across `app/`/`src/` — nothing else
    found. `onboarding/medical.tsx`'s accessibility toggles were
    double-checked specifically (they read like settings) and are
    correctly wired to real persistence. **Audit is closed** — don't
    re-run it from scratch; it should only resurface if new
    screens/features are added.
- **User-requested UX/functionality batch (2026-09-12, 14 items from
  screenshots + chat), all DONE and verified (clean tsc, jest, web
  export):** voice mic-interrupt (tap-to-interrupt while ResQ is
  speaking/thinking) plus voice-only barge-in (interrupt by speaking,
  not just tapping); SOS entry/exit confirmed already correct
  (`router.push`/`router.back()`, single entry point — no code change
  needed, just verified); pull-to-refresh on Family and Safe places
  (`Screen`'s shared `onRefresh`/`refreshing` pattern); the
  guidance-result "Continue chat with ResQ" button (seeds `/chat` with
  the specific disaster-guidance topic via a `topic` param); native
  iOS/Android voice input wiring; chat.tsx composer/keyboard spacing fix
  (`marginBottom: Math.max(insets.bottom, 16)` replacing dead fixed
  space) and a mic⇄send icon toggle keyed off `useKeyboardVisible.ts`;
  full chat/voice conversation persistence via `chatService.ts`
  (encrypted via `secureStorage`, seed-once-from-mock pattern, both
  `useChat.ts` and `useVoiceAssistant.ts` wired to save on every turn —
  tested in `__tests__/chatService.test.ts`); profile.tsx's
  loading-flash fix (was rendering `LoadingState` and the full mock-
  fallback UI simultaneously; now gated behind `isInitialLoad`);
  family-member.tsx hero-card redesign; and the navbar-hide-delay fix,
  corrected mid-session to use `beforeRemove` in
  `useHideTabBar.ts`/`NavVisibilityContext.tsx` after an initial
  attempt only covered explicit button taps — `beforeRemove` fires for
  gestures, hardware back, and browser back too, on all three
  platforms (see Verified Findings for why this is the general fix for
  this whole class of bug).
- **Dependency update pass (2026-09-12), user-requested ("update it
  without breaking anything and 0 vulnerabilities").**
  - **First real `npm install` in this project's history** — this
    sandbox's network allowlist covers the npm registry (previous
    sessions assumed no network at all; that was only true for
    `expo.dev`, which `expo install`/`expo install --check` need and
    which is still unreachable — confirmed directly, see Verified
    Findings). This unblocks real verification going forward instead of
    the syntax-only checks prior sessions were limited to.
  - **Expo SDK 57 companion packages bumped to what `expo@57.0.22`
    itself designates as compatible** — `expo` `~57.0.21` → `~57.0.22`,
    plus `expo-blur`, `expo-constants`, `expo-crypto`, `expo-dev-client`,
    `expo-haptics`, `expo-image-picker`, `expo-linear-gradient`,
    `expo-linking`, `expo-location`, `expo-notifications`, `expo-router`,
    `expo-secure-store`, `expo-splash-screen`, `expo-video` each bumped
    one patch version to match. Determined without `expo install
    --check` (unreachable, see above) by downloading `expo@57.0.22`'s
    tarball and diffing its bundled `bundledNativeModules.json` — the
    same manifest `expo install --check` itself reads — against the
    installed `57.0.21` copy; this is exactly what produced the "14
    other packages may need updating" the user saw. `react`,
    `react-native`, `maplibre-gl`, `lucide-react-native`, `jest`,
    `typescript`, `react-native-gesture-handler`, and the other
    "Latest"-column jumps `npm outdated` showed are deliberately **not**
    applied — they're outside SDK 57's compatibility set (e.g.
    `react-native@0.87.1`, `jest@30`, `typescript@7`) and bumping them
    would risk exactly the breakage the user asked to avoid.
  - **Two real, pre-existing bugs surfaced by finally having a working
    install** (both predate this session; neither was introduced by the
    version bump):
    1. `app/chat.tsx`'s `backdropFill` style used
       `StyleSheet.absoluteFillObject`, which doesn't exist on RN's
       `StyleSheet` (confirmed against `react-native`'s own `.d.ts` —
       only `absoluteFill`, an already-built style object, exists).
       Fixed: `{ ...StyleSheet.absoluteFillObject }` →
       `StyleSheet.absoluteFill` (drop-in, since it's used inside a
       style array). This was a real `tsc --noEmit` failure, invisible
       to every prior session's `transpileModule`-based syntax check.
    2. `jest.config.js` had no resolver/mock wiring for
       `react-native-worklets` (reanimated 4.x's split-out native
       runtime) — `chat.tsx`'s smoke test crashed at require-time
       (`Cannot read properties of undefined (reading 'loadUnpackers')`)
       because Jest was resolving worklets' `.native.ts` entry, which
       needs a real native module that doesn't exist under Jest. Fixed
       per worklets' own docs (docs.swmansion.com/react-native-worklets/
       docs/guides/testing): added `resolver:
       'react-native-worklets/jest/resolver'` to `jest.config.js`, which
       makes Jest resolve worklets' JS/web implementation instead. This
       was the exact gap flagged in the prior session's Known Gaps
       ("whether the Gesture.Pan()/reanimated drawer... was reasoned
       through by hand, not run") — `chat.tsx`'s smoke test now actually
       mounts and passes instead of being silently uncovered.
  - **Full real verification, all green**: `npm audit` → 0
    vulnerabilities (856 prod + 86 dev + 13 optional + 11 peer deps
    scanned). `npx tsc --noEmit` → clean. `npx jest --config
    jest.config.js` → 4/4 suites, 54/54 tests pass (up from 53 — no new
    tests added, `chat.tsx`'s smoke test now actually runs instead of
    crashing before assertions). `npx expo export --platform web` → all
    35 routes bundle. Re-verified after a clean `npm ci` (lockfile
    consistency check) to make sure the working tree wasn't hiding a
    stale `node_modules` accident. `public/vendor/*.mjs` reconfirmed
    byte-identical (md5sum) to `node_modules/maplibre-gl/dist/` after the
    reinstall, and the exported bundle still contains both
    `setWorkerUrl` and the `.maplibregl-marker{position:absolute` CSS fix
    from the prior v6 migration — the maplibre worker-sync mechanism
    (Important Decisions, below) survived the dependency bump intact.
  - `overrides` (`decode-uri-component@^0.5.0`, `uuid@^11.1.1` — see
    Important Decisions for what these fix) still resolve correctly
    post-bump, reconfirmed via `npm ls`.

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
  - **Speech-to-text: real on both native and web.** `src/services/
    voiceService.ts` (native) / `.web.ts` (web) — the same platform-file
    pattern as `MiniMap.tsx`/`MiniMap.web.tsx`. `voiceService.web.ts`
    wires the browser's actual `SpeechRecognition`/
    `webkitSpeechRecognition` API. `voiceService.ts` (native) wraps
    `expo-speech-recognition` (iOS `SFSpeechRecognizer`/Android
    `SpeechRecognizer`) — added and wired in the 2026-09-12 UX batch
    below; requires a dev-client build (not Expo Go). `voice.tsx` falls
    back to a typed-input composer only if neither path is available.
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
  - Not yet run on a real device — see Known Gaps for what's still
    unverified (drawer gesture feel, native TTS/STT round-trip).

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

- **Phases 0–2 complete**: stop-lying-to-the-user pass (removed fake
  "done" states that had no real data behind them), full safety product
  (SOS, medical profile, family circle, safe places, disaster guidance
  all wired to real local persistence), and a legal/privacy baseline
  (data-safety docs, privacy policy, terms — see `docs/data-safety.md`).
- **Real maps, both platforms.** `src/components/MiniMap.shared.tsx` +
  `MiniMap.tsx` (native, MapLibre RN + OpenFreeMap) +
  `MiniMap.web.tsx` (web, MapLibre GL JS + the same OpenFreeMap
  tiles) — wired into `safe.tsx`, `place-detail.tsx`, `family-member.tsx`,
  and (2026-09-11) `sos.tsx`'s confirmed screen. Full SDK rationale and
  version history under Data Model & Pages Reference and Important
  Decisions.
- **Web markers weren't rendering — missing `.maplibregl-marker` CSS
  (2026-09-11).** Root cause: `maplibre-gl`'s `Marker` only sets
  `transform` on its wrapper, relying on `maplibre-gl.css`'s
  `.maplibregl-marker{position:absolute}` for the positioning base —
  `MiniMap.web.tsx` deliberately skips importing that stylesheet (see
  Important Decisions) and hadn't carried this one rule over. Fixed by
  adding just that rule to the existing injected `<style>` tag. Two other
  hypotheses (a v6 `isStyleLoaded()` change; the
  `setMissingStyleImageResolver()` console warnings) were checked and
  ruled out first — see Verified Findings for the `Marker` mechanism.
  Verified at the build level only — `tsc
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
  wired in (portfolio-scope, not a blocker).

## Known Gaps

- **Voice page + nav/UX pass (2026-09-11 session 2) — now verified at
  the build/test level (2026-09-12), not just syntax.** `npm install`
  succeeded for the first time this project has had it available; `tsc
  --noEmit`, the full jest suite (including `chat.tsx`'s previously-
  never-run smoke test), and `expo export --platform web` all pass —
  see Completed Work above for the two real bugs this surfaced and
  fixed. What's still **not** verified, because none of the above
  exercises it: whether the `Gesture.Pan()`/reanimated drawer in
  `chat.tsx` actually *feels* right on a real device/simulator (the sign
  convention, clamping, and velocity-based close threshold were reasoned
  through by hand — the smoke test only confirms it mounts without
  throwing, not that the gesture behaves correctly); whether
  `expo-speech`'s actual on-device TTS behavior matches its documented
  API surface (`onBoundary`/`onDone` firing as expected); or whether the
  browser `SpeechRecognition` path in `voiceService.web.ts` behaves as
  expected in a real browser. **Before trusting this remaining part**:
  `npx expo start --web`, manually open `/voice` and `/chat`'s drawer,
  confirm the orb animation and swipe gesture behave as designed. A
  native run (`expo run:ios`/`android` via a dev-client build) would
  confirm the TTS/STT native behavior — still unverified in any sandbox
  so far.
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
  portfolio scope, both real gaps if that scope ever changes.
- No eslint config exists in the repo (`npm run lint` / `expo lint` would
  prompt to create one interactively) — not treated as a gap under this
  project's portfolio scope, noting it here so it isn't mistaken for an
  oversight next time someone looks for a lint command.

## Resume Here

**Open task: the critical/premium-quality review (see TODO above) — not
started.** The hardcoded-data audit that preceded it is fully closed and
verified (2026-09-13) — don't redo it. Start the review by writing a
short scoping plan (which screens, what counts as in-scope functional/UX
issue vs. a visual-design opinion the upcoming redesign session owns
instead), then work through screens systematically, proposing fixes as
real issues are found rather than a pure critique document.

Two longstanding items still need a real browser/device, which no
sandbox here has had yet: (1) `/voice` and `/chat`'s drawer swipe —
`npx expo start --web`, manually check the orb animation and gesture
feel (see Known Gaps); (2) the web map (MapLibre v6 migration +
marker-CSS fix) — open `/safe` or any MiniMap screen, confirm tiles
load and markers appear at the right spot. Otherwise: the Data Model &
Pages Reference section above has the current status of every screen —
check there before assuming something is unbuilt.

## Important Decisions

- **Planned: backend-assisted voice barge-in, once a real backend
  exists (not yet implemented — this is a forward-looking design note,
  written 2026-09-12 per a direct request to plan it for later).**
  Today's voice-activated interrupt (`startBargeInListener` in
  `useVoiceAssistant.ts`) is honestly best-effort: without headphones,
  the mic picks up ResQ's own TTS output from the speaker along with the
  user's real speech, so it can false-trigger on ResQ's own words. Real
  assistants (Siri, Alexa) solve this with **acoustic echo cancellation
  (AEC)** — the device already knows exactly what audio it's currently
  playing out the speaker, so a DSP stage subtracts that known signal
  from the mic input before it ever reaches speech recognition, leaving
  only what the user actually said. Two concrete paths once a backend
  exists, roughly in order of how much they buy vs. cost to build:
  1. **`expo-speech-recognition`'s `iosVoiceProcessingEnabled` option**
     (already wired into `voiceService.ts` as of this session) turns on
     iOS's own `AVAudioEngine` voice-processing I/O unit, which does
     real hardware/OS-level AEC — this is very likely "enough" on its
     own for iOS once the native build is actually running on a device
     (untested here — no device available in this sandbox). No backend
     needed for this part; it's already in place, just unverified.
  2. **True backend-assisted AEC** (the more complete fix, and what the
     "dedicated audio processing" comment in `useVoiceAssistant.ts`
     refers to): once a real backend exists and TTS audio is
     streamed/generated server-side rather than played by-name from
     `expo-speech`, the reference signal (exactly what's being played)
     can be sent alongside the mic stream to a server-side AEC/VAD
     (voice-activity-detection) pass before treating anything as a
     genuine interruption — this is the only way to fully solve it on
     Android, which has no equivalent to iOS's voice-processing unit
     exposed through this library. Concretely: the backend's streaming
     TTS endpoint would need to expose the audio it's currently sending
     (or a timestamp/marker stream) so the client can pair it with the
     concurrent mic capture, and either do local AEC (if a suitable RN
     module exists by then) or forward both streams to a backend AEC
     service. Revisit this once Phase 3 (backend) is underway — not
     before, since it's meaningless to design the exact API shape
     against a backend that doesn't exist yet.
  Until then: `iosVoiceProcessingEnabled: true` is already set (best
  available mitigation with zero backend), tap-to-interrupt remains the
  fully reliable fallback on every platform, and the limitation is
  documented in-code (`useVoiceAssistant.ts`) and to the user rather than
  silently shipped as if it were flawless.
  - **2026-09-12 follow-up: researched whether a no-backend, cross-
    platform (web + iOS + Android) npm library could close this gap now,
    the same way `expo-speech-recognition` closed the native-STT gap.
    Conclusion: no, and here's why, so this isn't re-researched later
    without cause.** The honest constraint, confirmed via a browser
    engineering write-up on exactly this failure mode: browser AEC
    (`echoCancellation: true` in `getUserMedia`) only treats audio as a
    cancelable reference if it arrives via the browser's own recognized
    playback paths — a real `<audio>` element or a WebRTC remote track.
    Locally-synthesized speech (`speechSynthesis`/Web Speech API — what
    `expo-speech`'s web implementation actually uses, confirmed by
    reading `ttsService.ts`) does not register as a reference signal no
    matter how AEC is configured. The one credible-looking client-side
    fix found (`reflex-aec`, an npm package doing real digital AEC via
    an AudioWorklet, no ML, no backend, claiming Safari iOS support) was
    evaluated and rejected on inspection, not on reputation alone: (1)
    its `playBotAudio(audioData: ArrayBuffer)` API requires the TTS
    engine itself to hand over raw synthesized audio bytes — `expo-
    speech`'s `Speech.speak(text)` never exposes any such bytes, so
    adopting it would mean replacing this app's TTS engine entirely
    (with, e.g., a cloud TTS API that returns audio data), which is a
    materially bigger and riskier change than it looks and defeats the
    "save work for backend side" goal, since a full TTS-engine swap is
    backend-shaped work either way; (2) it is browser-only — no
    `AudioWorkletNode`/`getDisplayMedia`/`AudioContext` exist in React
    Native's JS runtime, so it could only ever help the web build, not
    iOS/Android; (3) it's a brand-new, single-maintainer, zero-star
    package with no track record — not a bar this app's other
    dependencies are held to lightly. Also checked for a cross-platform
    RN wrapper around the OS-level primitives every serious AEC solution
    actually uses under the hood (iOS `AVAudioEngine`/`VoiceProcessingIO`,
    Android `AcousticEchoCanceler`) — none exists as a maintained Expo/RN
    package; the closest analog found is Flutter-only. **Net result:
    `iosVoiceProcessingEnabled: true` (already in place) remains the
    correct, genuinely-real no-backend answer for iOS — it's the same
    underlying hardware AEC mechanism other serious solutions wrap —
    and web/Android have no comparable no-backend option worth adopting
    today.** The backend-assisted path above (§2) is still the right
    long-term fix for web and Android; nothing here changes that plan,
    it just confirms skipping straight to a library wasn't the shortcut
    it might have looked like.
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
- **Project goal clarified as portfolio/resume-quality, not a real store
  launch (2026-09-10).** The app will not actually be submitted to the
  Play Store or App Store. This changes which *business/legal* steps
  count as real blockers, not the engineering bar — every phase is still
  built to a genuinely working, non-placeholder standard. Concretely:
  real signing credentials for the release workflow, legal-counsel
  review of the Privacy Policy/Terms, and publicly hosting those legal
  docs are not blockers under this scope, since there's no real
  submission they'd be gating — they're recorded as real gaps to revisit
  only if that scope ever changes (see Known Gaps).
- Other smaller decisions worth knowing: guest mode gets full SOS access
  (not a deliberate SOS-specific choice — `sos.tsx` sits in the same
  `Stack.Protected` group as the rest of the authenticated app, and
  guest sessions land there by existing design; worth narrowing later if
  a session wants to hide the on-device SOS history log for guests
  specifically). `readinessService.ts`'s score is a straight percentage
  of checklist completion — an explicit placeholder, not a final
  formula; a real backend should factor in more (profile completeness,
  check-in recency, etc.).

## Verified Findings

- **This app runs on web, iOS, and Android, and each platform's primary
  "go back" mechanism is different — any fix for "the tab bar/UI state
  doesn't update on back navigation" must account for all of them, not
  just an on-screen button.** Concretely: an explicit on-screen back
  button (universal, but not how most users actually go back most of the
  time), Android's hardware back button and edge swipe gesture, iOS's
  edge swipe-back gesture, and the browser's own back/forward buttons on
  web. A fix that only hooks a screen's own button onPress handler (the
  first attempt at the navbar-delay fix below) silently misses every one
  of the other three — caught directly by the user, not by testing,
  since nothing in this sandbox can exercise a real gesture or hardware
  button. **The general, correct fix for this class of problem is
  React Navigation's `beforeRemove` core event**
  (`useNavigation().addListener('beforeRemove', ...)` — see
  reactnavigation.org/docs/navigation-events#beforeremove, available
  directly from `expo-router`'s own `useNavigation` export, no extra
  package needed): it fires for every removal path uniformly, because
  button taps, gestures, hardware back, and browser back all dispatch
  the same kind of "remove this route" navigation action under the hood,
  and it fires before the transition animation starts, not after. One
  listener replaces needing separate BackHandler (Android)/gesture
  (iOS)/popstate (web) handling. Reach for this any time a screen needs
  to react to "the user is leaving," not a per-button `onPress` override
  — see `useHideTabBar.ts` for the worked example and AGENT.md's
  Completed Work entry on the navbar delay for the full before/after.
- **Sandbox network reaches the npm registry but not `expo.dev`
  (confirmed 2026-09-12).** Earlier sessions assumed no network at all;
  that was wrong — `npm install`/`npm ci`/`npm view`/`npm pack` all work
  fine here. What actually fails is `expo install` and `expo install
  --check` specifically, because they call an `expo.dev` version-
  compatibility API (confirmed via the exact error: `fetchWithCredentials`
  in `@expo/cli` gets an HTML "Host not i[n allowlist]" response instead
  of JSON). **Workaround that doesn't need `expo.dev` at all**: the
  installed `expo` package ships its own compatibility manifest at
  `node_modules/expo/bundledNativeModules.json` — this is the same data
  `expo install --check` reads. To find what a newer `expo` patch/minor
  wants, `npm pack expo@<version>` into a scratch dir and diff its copy
  of that file against the installed one; every `expo-*` package listed
  there should be bumped to match, and packages *not* listed there
  (`react`, `react-native`, third-party libs) should NOT be bumped
  off the back of `npm outdated`'s "Latest" column alone — that column
  ignores Expo SDK compatibility entirely.
- Use plain `npm install <pkg>@<version>` for anything `expo install`
  would otherwise handle; confirm the version is real first with `npm
  view <pkg> versions`.
- **A native Expo Module (real native iOS/Android code, e.g.
  `expo-speech-recognition`) installs cleanly via plain `npm install` in
  this sandbox and its TypeScript types can be verified for real —
  `npm install` doesn't need to compile any native code, only fetch the
  package and its JS/TS layer.** What genuinely cannot be verified here
  is the native code actually *running* — that needs `expo prebuild` +
  Xcode/Android Studio + a real device or simulator, none of which exist
  in this sandbox. So for any native-module task: install for real,
  typecheck the integration against the library's real (not
  remembered/guessed) type definitions, add whatever jest mock the
  module needs to keep the test suite passing (see the
  `react-native-worklets` and `expo-speech-recognition` entries in this
  file for two examples of the same underlying issue — "Cannot find
  native module X" under Jest, fixed with a mock, not a real
  workaround), and be explicit with the user that the device-level
  behavior itself is unverified and needs their own build to confirm.
  This is meaningfully more real progress than declining to touch native
  modules at all, and meaningfully more honest than claiming they're
  "done" without that caveat.
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
- **`react-native-worklets` (reanimated 4.x's split-out native runtime)
  needs explicit Jest wiring or any screen importing reanimated crashes
  at require-time under Jest** (`Cannot read properties of undefined
  (reading 'loadUnpackers')` — it tries to load a real native module
  that doesn't exist in Jest's environment). Per the package's own docs
  (docs.swmansion.com/react-native-worklets/docs/guides/testing), the
  fix is a top-level `resolver: 'react-native-worklets/jest/resolver'`
  in `jest.config.js` (forces resolution to worklets' web/JS
  implementation instead of its `.native.ts` entry) — no per-test
  `jest.mock()` needed. Already wired in this project's `jest.config.js`
  as of 2026-09-12; don't remove it if `react-native-reanimated` or
  `react-native-worklets` are ever bumped.
- `StyleSheet.absoluteFillObject` is not a real React Native API —
  confirmed against `react-native`'s own `.d.ts` (checked
  `node_modules/react-native/types_generated/.../StyleSheetExports.d.ts`
  directly). Only `StyleSheet.absoluteFill` exists (a ready-made style
  object, not a template to spread) — use it directly wherever the old
  `{ ...StyleSheet.absoluteFillObject }` pattern shows up.
