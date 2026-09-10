# ResQ — Roadmap & Progress

This file is the project's memory across sessions. Read **§1 Status at a
glance** first — it's the whole picture in one table. Drill into §3 for
the detail behind any phase. §8 (Archive) holds old, fully-superseded
session logs; you don't need to read it to work on this project.

**Working assumptions** (confirm these still hold before trusting anything
below):
- **Project goal (clarified 2026-09-10): a portfolio/resume-quality
  build, not an actual store submission.** The app will not actually be
  uploaded to the Play Store or App Store. This matters for how to read
  Phase 2 and 5 below: items like "legal counsel review" and "public
  hosting of legal docs" were originally scoped against a real launch
  — under this clarified goal they're not real blockers, since there's
  no real submission they'd be gating. Every phase is still built to a
  genuinely working, non-placeholder standard (per this file's own
  discipline, §0/§1) — this only changes which *business/legal* steps
  are in-scope, not the engineering bar.
- Launch market is **India first** — the emergency number (112), privacy
  law (DPDP Act 2023), and localization choices below assume this.
- **No backend exists yet.** This mobile repo is the entire project today.
  Phase 3 is "build a backend from scratch," not an integration ticket.
- Mock/demo data stays in place and works throughout — every phase before
  Phase 4 is designed to need zero backend.

**When you finish an item:** check it off, add one dated line (what you
did, any real decision made), and update §1's status line for that phase.
Don't delete old lines — this file's value is the history.

---

## 1. Status at a glance

| Phase | Goal | Status |
|---|---|---|
| **0 — Stop lying to the user** | Every visible control does the real (or honestly simulated) thing it claims. No fake values on screen. | ✅ **Complete** (2026-09-09). |
| **1 — Build the actual safety product** | SOS, medical info, family circle, and guidance work end-to-end on-device, no backend needed. | ✅ **Complete (2026-09-10).** Real maps (MapLibre + OpenFreeMap) shipped, closing the phase's last open item. |
| **2 — Legal, privacy & store-compliance baseline** | Privacy Policy/Terms, Data Safety mapping, minimum-age decision, signed release builds. | ✅ **Complete (2026-09-10), under this project's clarified scope.** In-app Privacy Policy/Terms, a real 18+ registration gate, a Data Safety mapping doc, and the signed-build workflow are all built and verified. **Not actually store-submission-ready** — the signed workflow has no real credentials wired in, and the legal docs aren't hosted at a public URL or counsel-reviewed — but per the working assumption above, this app isn't heading to a real store submission, so those aren't blockers for this project's actual goal. See §3.2 for the honest line between "built" and "would still need X for a real launch." |
| **3 — Stand up a real backend** | Build the backend from scratch (none exists). | ⬜ **Not started** — blocked on the stack decision (§4). |
| **4 — Cut over from mock to real data** | Swap each service's mock branch for the real API, one domain at a time. | ⬜ **Not started** — blocked on Phase 3. |
| **5 — Hardening for public release** | — | ⬜ **Not started.** |
| **6 — Post-launch / scale** | — | ⬜ **Not started**, not blocking v1. |

**Next session:**
- **Phase 1 is complete.** No further work queued for it.
- **Phase 2 is complete.** No further work queued for it under this
  project's clarified goal (portfolio build, not a real store
  submission — see working assumptions above). If that goal ever
  changes back to an actual launch, three real items would reopen:
  wiring real credentials into `build-release-signed.yml`, hosting the
  legal docs at a public URL, and a counsel review — see §3.2 for
  specifics.
- **Checkpoint (2026-09-10, later same day): real at-rest encryption
  added, closing the Data Safety doc's "no ResQ-side encryption layer"
  gap.** `src/services/secureStorage.ts` (new) — AES-256-GCM envelope
  encryption (key in `expo-secure-store`/Keychain-Keystore, ciphertext
  in AsyncStorage), wired into `profileService.ts`,
  `medicalProfileService.ts`, `familyService.ts` (the sensitive
  domains). `localDataService.ts` updated so "Download my data" still
  decrypts for export and "Delete my account" now also destroys the
  SecureStore key (real complete erasure, not partial). Added
  `expo-crypto`, `expo-secure-store`, `expo-dev-client` to
  `package.json` and registered the SecureStore plugin in `app.json`.
  **Caught and fixed a real bug in the process:** jest-expo's
  auto-mock silently no-ops expo-crypto's AES functions, which would
  have made every encrypted read/write fail invisibly (secureStorage.ts
  treats a decrypt failure as "key not found," not a thrown error) —
  wrote a real jest mock using Node's actual AES-256-GCM
  (`__tests__/__mocks__/expoCryptoMock.ts`) plus a dedicated 12-test
  suite (`__tests__/secureStorage.test.ts`) covering round-trip, legacy
  plaintext migration, key destruction, and export decryption.
  Verified: `tsc --noEmit` clean, **51/51 tests passing** (39 previous +
  12 new), `expo-doctor` unchanged at 19/21 (same 2 network-only
  failures as baseline — not regressions).
  **Follow-up (same day): both items closed.**
  `app/privacy-policy.tsx` gained a new section 4, "How your data is
  protected on-device" — states plainly what's encrypted (profile,
  medical, family circle), where the key lives, what account deletion
  destroys, and the same honest limitations `secureStorage.ts`/
  `data-safety.md` state (native-only, doesn't protect an
  already-unlocked device, no web equivalent yet). Sections renumbered
  5–8 accordingly; existing profile/medical/family bullets in section 2
  updated with a one-line encryption mention each. `LAST_UPDATED` was
  already today's date, so left as-is rather than bumped. Checked
  against `secureStorage.ts`/`data-safety.md` directly, not
  independently reworded, so the three stay consistent.
  `expo-dev-client` was registered in `app.json`'s `plugins` array
  (was installed as a package last session but not actually wired into
  the CNG config — real gap, now fixed) and a new README section,
  "Running with maps (dev-client build)," gives the actual runnable
  commands: `npx expo run:android`/`run:ios` for a local toolchain, and
  `npx eas-cli build --profile development` for no local toolchain
  (e.g. building an iOS dev client from Windows — this app's own dev
  machine per its terminal output, which can't build iOS locally at
  all). Also notes explicitly that `expo-secure-store`/`expo-crypto`
  don't need this — both are included in Expo Go already, unlike
  MapLibre, so only the map screens require the dev-client build.
  Re-verified after these edits: `tsc --noEmit` clean, **51/51 tests
  still passing**, `expo-doctor` unchanged at 19/21 (same 2
  network-only failures), `app.json` still valid JSON.
- **Follow-up (2026-09-10, later same day): stale-dev-client-build
  confusion, README gap closed; real web-map support scoped but
  deliberately not started this pass.** User hit the exact
  `MLRNCameraModule` error again after the `expo-dev-client` plugin fix
  — but this time the terminal banner correctly said `Using development
  build`, confirming Metro found the dev client fine. Root cause: a dev
  client's *native binary* only picks up a new native module (or a
  plugins-array change) on an actual rebuild — `npx expo start` alone
  reloads JS into whatever's already installed, it never rebuilds
  native code. The user's installed dev client predated the
  `expo-dev-client`/MapLibre plugin registration, so the JS was calling
  a native module the installed binary genuinely didn't have compiled
  in. Not a bug in this codebase — added an explicit "if you still see
  this after already having a dev client installed" paragraph to
  README's "Running with maps" section so this doesn't reoccur
  silently for the next native-module addition either; the fix is
  re-running `expo run:android`/`run:ios` (or a fresh EAS build), not a
  code change.
  **Web maps, investigated, not implemented this pass:** confirmed
  `maplibre-gl` (the WebGL JS library, distinct from
  `@maplibre/maplibre-react-native`) plus `react-map-gl/maplibre` (its
  React wrapper, MapLibre's own recommended web integration) is a real,
  current, actively maintained path — same OpenFreeMap style URL
  already in use would work unchanged on web. Real scope, not a small
  tweak: a second map rendering path with its own marker/camera API
  (not identical to the native library's), a CSS import needing
  verification against this project's Metro web-export setup
  specifically (not just a generic bundler), and `react-map-gl`/
  `maplibre-gl` v6 being ESM-only with a Web Worker URL registration
  quirk that also needs checking against Expo's web bundler. Given that
  real scope and that web was explicitly scoped out as "nice-to-have
  only" when maps were first built (§3.1), this deserves its own
  implementation session rather than a rushed same-message patch — see
  the ready-to-paste prompt given directly to the user for that
  session's starting point.
- Phase 3 (backend stack) is the next real unblocked decision — see
  §4's "not yet made" list.

**Fix (2026-09-10, later same day): `expo-doctor` patch-version mismatch.**
Reported on a real machine (not this sandbox): `expo` and `expo-router`
were pinned to `~57.0.20`/`~57.0.19` in `package.json`, one patch behind
what the installed Expo SDK expected (`~57.0.21`/`~57.0.20`) — a normal
drift from Expo shipping SDK patch releases after this repo's
`package-lock.json` was generated, not a real bug. Bumped both ranges in
`package.json` and regenerated the lockfile with `npm install` (Expo's
own recommended fix, `npx expo install --check`, does the same
resolution). Verified in this sandbox: `expo-doctor`'s version-match
check now passes explicitly (`✔ Check that packages match versions
required by installed Expo SDK` under `--verbose`); the same 2
network-allowlist failures as every prior session remain (unrelated,
see the note below) — real baseline is now 20/21 in a network-restricted
sandbox, expected 21/21 on a normal machine. `tsc --noEmit` clean,
39/39 tests still passing — no regression from the bump.

**Verification note (2026-09-10): the npm-registry network block that
affected every prior session is gone in this sandbox.** `npm install`,
`npx tsc --noEmit`, `npm run test:smoke`, and `npx expo-doctor` all ran
for real this session — not the filtered/static verification prior
sessions had to fall back on. Current real baseline: **39/39 tests
passing** (28 render-smoke + 11 new unit tests for `src/utils/age.ts`),
`tsc --noEmit` clean, `expo-doctor` 19/21 (the 2 failures are calls to
Expo's remote validation servers blocked by this sandbox's own network
allowlist — not project issues; re-run on a normal machine to confirm
21/21). If a future session finds this network block is back, fall back
to the filtered-`tsc`-only verification approach documented in the
archive (§8) and flag it here again.

**Correction to this file's own prior claim:** an earlier version of
this file listed "placeholder app icon/splash — still present,
unchanged" under Phase 2. That's stale. Checked the actual files this
session (`assets/images/icon.png`, `icon-dark.png`, `adaptive-icon.png`,
`favicon.png`, both splash variants) — these are a real, deliberate
brand mark with correct light/dark/transparent treatment per platform,
already fixed in an archived session (§8, "Icon backgrounds fixed,
video asset cleanup"). Nothing to redo here; removed from Phase 2's
checklist below.

---

## 2. Architecture — what's solid, keep as-is

- **`screen → hook → service → (mock | real)`** layering
  (`src/hooks/`, `src/services/`, `src/config/env.ts`). Every new feature
  should follow this. See §5 for the exact recipe.
- **`src/theme/colors.ts` + `ThemeContext`** — zero hardcoded colors,
  real light/dark contrast tokens. Keep this discipline.
- **Auth-state routing** in `app/_layout.tsx` via `Stack.Protected` —
  correctly clears navigation history on login/logout/onboarding
  transitions. `privacy-policy`/`terms` (added 2026-09-10) sit outside
  every protected group deliberately — see §3's Phase 2 writeup for why.
- **`src/types/index.ts`** — the RAG-shaped types (`RagSource`,
  `DisasterGuidance`, `ChatStreamEvent`) are a real contract a backend
  can be built against.
- **`guidance-result.tsx`'s sources + confidence badge** — the reference
  pattern for showing sources anywhere else (already copied into
  `chat.tsx`).
- **`src/components/MiniMap.tsx`** (added 2026-09-10) — the reusable map
  surface (real MapLibre on native, static-pin fallback on web). Any new
  screen that wants a map should use this rather than a new one-off —
  see §3.1 for the design rationale.
- **Splash screen** (`app/index.tsx`) has tap-to-skip and a fallback
  timer if the intro video fails to fire an end event.

**Known, accepted tradeoffs (not bugs):**
- Auth is a stub — `login()`/`register()` accept anything. Real screens
  correctly read the signed-in `user` object; they just don't populate
  it from a real backend yet (Phase 3). Registration now also requires a
  real, validated date of birth (2026-09-10, see §3 Phase 2) — that part
  isn't a stub, it's a genuine client-side gate; it's the *identity*
  behind the account that's still unverified.
- No `react-query` — a hand-rolled `useAsync` hook instead. Deliberate,
  still fine, every hook follows it.
- Chat streaming assumes newline-delimited JSON from the backend: adjust
  `chatService.ts` if the real API uses SSE instead.
- `config.useMockData` is one global flag for every domain (not
  per-domain). Fine for now, flagged as a Phase 4 item.

---

## 3. Phase detail

### Phase 0 — Stop lying to the user ✅ Complete (2026-09-09)

Every dead button, hardcoded value, and fake placeholder found in the
original audit is fixed. Highlights:
- **Dead UI wired up:** Header bell → real `/notifications`; Place
  detail's Directions/Call ahead → real Maps link / `tel:`; Family
  member's Call/Message/Locate → real `tel:`/`sms:`/Maps search;
  Privacy & Security's data export/delete → real local-data
  export+wipe; Login's "Forgot?" → real (locally-simulated) reset flow;
  Chat's thread list → actually loads real per-thread messages.
- **Removed rather than faked:** "Continue with Google" (no backend to
  validate against — a missing button beats a fake-working one).
- **Hardcoded values replaced with real state:** greeting/date, family
  member count, report success message, profile avatar/stats, chat
  welcome message — all now read from the signed-in user or real mock
  data instead of a literal "Alex" / "82%" / "3 people".
- **Deferred to Phase 2, done there:** the CI workflow only produces an
  unsigned debug APK — see Phase 2's writeup below; this was
  investigated and deliberately left as-is this session too (still
  needs real signing credentials, not a code change).

Full per-item history: §8 has nothing on this (it predates Phase 0); this
summary is the complete record.

### Phase 1 — Build the actual safety product ✅ Complete (2026-09-10)

*Goal: SOS, medical info, family circle, and guidance all work end-to-end
today, on-device, with zero backend.*

- [x] **SOS** — the single most important item in the whole roadmap.
  Home has a prominent **Emergency SOS** bar → `app/sos.tsx`: a 2.5s
  press-and-hold trigger (haptic feedback, cancels cleanly on early
  release) that surfaces **Call 112** (`tel:112`) and one **Message**
  button per family member with a phone on file (`sms:`). Every
  activation logs locally, viewable at `/sos-history`. SMS body and
  history log include a real Google Maps link when a GPS fix is
  available (added once device location existed — see below).
  *Not done, deliberately out of scope:* no local push/alarm sound, no
  lock-screen/hardware-button trigger, no server-side fan-out — all
  need Phase 3's backend.

- [x] **Onboarding persistence.** Every onboarding screen used to hold
  answers in local `useState` only — finishing onboarding lost
  everything. Now: `src/services/onboardingService.ts` writes a real
  AsyncStorage draft per step on Continue *and* Skip, reloaded on
  return to that step. On completion, drafts merge into the app's real
  stores (`profileService.mergeProfile()`,
  `familyService.seedFamilyMembers()`) — not a separate onboarding-only
  store.
  `AuthContext.logout()` clears the draft (not the profile/family data
  itself) so a new user on the same device doesn't inherit it.
  Building this surfaced and fixed **two real bugs unrelated to
  onboarding**: `familyService.ts` and `profileService.ts` only
  mutated in-memory React state — any edit from the Family tab or
  Profile screen (not just onboarding) was silently lost on restart.
  Both are now properly AsyncStorage-backed.
  Also fixed: onboarding's family-circle step and emergency-contacts
  step used to be two separate, overlapping contact lists (with the
  same fake person pre-seeded in both). Unified into one list — see §4
  for why no separate `EmergencyContact` type was added.

- [x] **Real device location.** `src/hooks/useDeviceLocation.ts` wraps
  `expo-location` (`getCurrentPositionAsync` + reverse geocode),
  request-based rather than a continuous watcher — nothing in the app
  needs a moving position today. `useCurrentArea()` now prefers this
  live location over the profile's static home address, with zero
  code changes needed in screens that only read `{ area }`. Safe
  places sorts by real distance; Report's location field seeds from
  real GPS; SOS's SMS/history include a real Maps link.
  *Not done:* `FamilyMember.lastKnownLocation` is still free text only
  (no lat/long) — needed before `family-member.tsx` can show a real
  mini-map (see §6's data-model note).

- [x] **Chat sources parity.** `chat.tsx` now renders each assistant
  message's `sources` under its bubble (same pattern as
  `guidance-result.tsx`). Mock data previously never populated
  `sources` anywhere, so this would have been dead code — fixed by
  adding a source to one saved thread and to the live mock stream
  reply.

- [x] **`FamilyMember.inviteStatus`.** Added a typed
  `'pending' | 'accepted'` field, separate from the existing free-text
  `status` (display copy like "Safe"/"Invite sent" — unaffected).
  `inviteFamilyMember` sets `'pending'`; `checkInFamilyMember` upgrades
  to `'accepted'` on first check-in. No new UI surfaces this field yet
  — the task was the typed field itself.

- [x] **`dob`/`bloodType` in Profile's edit form.** Onboarding always
  collected these; `profile.tsx` now has a matching DOB field and
  blood-type chip picker (same pattern/values as onboarding), plus
  read-only detail rows when present.

- [x] **Medical ID display surface.** `profile.tsx` shows a "Medical
  ID" card (allergies, conditions, accessibility needs) when the user
  has actually filled in onboarding's medical step. Found and fixed a
  real bug while building this: `MedicalProfile` had **no durable
  storage at all** — only the onboarding-draft key, which gets wiped
  on logout. New `src/services/medicalProfileService.ts` fixes that
  (same AsyncStorage pattern as `profileService.ts`).
  *Not done:* no edit flow outside onboarding; no Medical ID card on
  `sos.tsx`'s confirmed screen (deliberately Profile-only — that
  screen is a dense, scan-fast action list, not a data-display one).

- [x] **Camera capture for incident reports.** `report.tsx`'s photo
  section now offers "Take photo" (new, via `expo-image-picker`'s
  camera APIs) alongside the existing "Choose from library," plus a
  small preview/remove control. Added a `cameraPermission` string to
  `app.json`.

- [x] **Local notifications.** One real, honest reminder — a "Remind
  me" toggle on `family.tsx`'s check-in card. Schedules a genuine
  one-off local notification 24h out via `expo-notifications`
  (deliberately *not* a repeating daily alarm, since nothing in the app
  configures a fixed daily time). New
  `src/services/localNotificationsService.ts` handles
  permission/schedule/cancel.
  Explicitly separate from `notificationsService.ts` (the in-app
  read/unread feed — no OS-level alert).
  *Not done, always out of scope for this item:* remote/push
  notifications (needs a backend) — Phase 2/3.

- [x] **Real maps.** **2026-09-10**: Shipped per §3.1's plan — MapLibre
  (`@maplibre/maplibre-react-native@^11.3.10`) + OpenFreeMap, no API key,
  no rate limits. Verified rather than assumed at every step this session:
  re-fetched the live style URL and confirmed OpenFreeMap's "no limits"
  claim independently (it survived a real 100k req/s spike in August
  2025); confirmed the exact prop API against the *installed* package's
  own TypeScript source plus MapLibre's official "Migrating to v11" doc
  (the public docs site's main pages are stale, pre-v11 — the source and
  the migration guide agreed with each other and are what this was built
  against); ran a real `expo prebuild --platform android` (not just
  config-parse) to confirm the plugin actually works; ran a real
  `expo export --platform web` to confirm the web fallback path doesn't
  break the static web build.
  New `src/components/MiniMap.tsx` — one reusable component: native
  platforms render a real `Map`/`Camera`/`ViewAnnotation` tree over
  OpenFreeMap tiles; web (which MapLibre React Native doesn't support at
  all) falls back to the same static-pin illustration style
  `safe.tsx`/`place-detail.tsx` already used, so nothing regresses on
  web. Includes a visible "© OpenStreetMap contributors" label — OSM's
  data license (ODbL) requires attribution wherever the map is shown.
  Wired into exactly the three places from §3.1's table where it adds
  real value (deliberately not "everywhere there's a coordinate" — see
  the user's own explicit steer to keep this scoped):
  - `safe.tsx` — replaced the fake-pin card with a real map of all safe
    places; removed the now-pointless "Highlight map" button/state that
    only existed because the old card was static.
  - `place-detail.tsx` — replaced the fake single-pin card with a real
    map centered on that place.
  - `family-member.tsx` — added `FamilyMember.latitude`/`.longitude`
    (optional, alongside the existing free-text `lastKnownLocation`, not
    replacing it) and a map shown only when a member actually has
    coordinates on file. Seeded `mockFamily.ts`'s two members who already
    have a real "shared N min ago" location; left the "not shared yet"
    member without coordinates — resolves §3.1's open seeding question by
    mirroring the existing honesty pattern rather than inventing fake
    coordinates for someone who hasn't shared one. `onLocate()` now
    prefers a real coordinate-based Maps link when available, falling
    back to the previous name-search behavior otherwise.
  Added the required Jest mock (`__tests__/smoke.test.tsx`) for
  `@maplibre/maplibre-react-native` — necessary because Jest's test
  environment reports `Platform.OS === 'ios'`, not `'web'`, so
  `MiniMap`'s conditional native `require()` really does fire under
  test; without the mock all three screens' smoke tests would try to
  load native-only code. Verified this actually matters, not just
  boilerplate: ran the suite (39/39 pass) with the mock in place.
  **Deliberately not done, matching §3.1's original scope line:** no web
  map renderer (would need a completely separate library,
  `react-map-gl` + `maplibre-gl-js` — explicitly out of scope, user said
  web is a nice-to-have only); no map on `sos.tsx`'s confirmed screen
  (was a stretch item, not required); no `fitBounds`-based camera
  framing (a simple marker-average center is a fine, correct tradeoff at
  this app's actual scale of 2-3 markers per map — revisit only if a
  screen ever needs to show meaningfully more markers than that).

- [x] `app/notifications.tsx` — built in Phase 0 as part of fixing the
  dead Header bell; satisfies this Phase 1 item too.

### Phase 2 — Legal, privacy & store-compliance baseline ✅ Complete (2026-09-10, portfolio scope)

*Goal: the legal/compliance surface a real store submission would need,
built honestly against what this no-backend app can actually promise
today.*

**Where this genuinely stands:** every item that could be *coded* is
done — Privacy Policy/Terms, the 18+ age gate, the Data Safety mapping
doc, and the signed-build workflow itself. **Closed as complete
2026-09-10** under this project's clarified goal (working assumptions,
top of file): this is a portfolio/resume build, not heading to an
actual store submission, so the three items that would otherwise block
a real launch — real signing credentials, legal counsel review, and
public hosting of the legal docs — aren't blockers for what this
project is actually for. They're recorded below, per item, exactly as
they'd need to be revisited if that goal ever changes; nothing here was
silently dropped, the scope was deliberately narrowed and that decision
is logged.

- [x] **In-app Privacy Policy and Terms of Service.** **2026-09-10**:
  Built `app/privacy-policy.tsx` and `app/terms.tsx`, rendered through
  a new shared `src/components/LegalDocument.tsx`. Both are real,
  app-specific content (not generic boilerplate) — checked against the
  actual AsyncStorage keys every service uses
  (`grep`'d every `*_KEY` constant across `src/services/`) and against
  `app.json`'s actual permission strings, so claims like "nothing
  leaves this device" and the list of what's collected are verified,
  not assumed. The Terms are explicit that SOS doesn't dispatch real
  help — the user still has to complete the call themselves — since
  overstating this in a safety app is itself a real risk, not just a
  legal nicety.
  Registered in `app/_layout.tsx` **outside every `Stack.Protected`
  group** (same tier as `index`) rather than duplicated into both the
  logged-out and logged-in groups — expo-router doesn't allow the same
  screen name registered twice anyway, and Play Store policy expects a
  privacy policy readable *before* account creation. Linked from
  `login.tsx`/`register.tsx`'s footer text (now real `Text onPress`
  links, previously plain unlinked copy) and from two new rows on
  `privacy-security.tsx`.
  **Out of scope, flagged in each file's own header comment:** neither
  document is reviewed by counsel, and neither is hosted at a public
  URL — Play Store's Data Safety section would require a live link for
  a real submission, but per the working assumption above this project
  isn't heading to one, so this is a deliberate scope line, not a gap.

- [x] **Minimum age / parental-consent decision — made and built.**
  **2026-09-10**: This was the one genuinely open decision blocking
  this phase (§4 previously listed it as unresolved). Decided: **18+
  required at registration**, enforced client-side with a real date-of-
  birth field. Rationale: India's DPDP Act 2023 (Section 9) requires
  verifiable parental/guardian consent before processing a child's
  personal data; ResQ has no backend to verify a parent's identity or
  consent against, so building a fake consent checkbox would be
  dishonest about what it actually accomplishes — requiring the account
  holder to be an adult is the option this app can actually stand
  behind today. A real parental-consent flow becomes possible once
  Phase 3's backend exists to receive and verify it.
  Built as `src/utils/age.ts` (DOB parsing for the existing
  "DD / MM / YYYY" format already used by onboarding's personal step,
  plus age-threshold math) — new, not touched: onboarding's own `dob`
  field is a separate, later, optional profile field and needed no
  changes. `app/register.tsx` now has a required DOB input that blocks
  `onRegister()` with an inline error both for unparseable dates and for
  under-18 dates. Guest mode ("Emergency App Access") is deliberately
  unaffected — no profile is created for a guest session, so there's no
  age claim being made about them; see the Privacy Policy's "Minimum
  age" section for exactly this distinction, written so it doesn't read
  as a loophole.
  11 new unit tests (`__tests__/age.test.ts`) cover leap-year DOBs,
  exact-boundary birthdays (turns 18 *today* vs. one day short), and
  malformed input — `meetsMinimumAge()` takes an optional injected
  `now` specifically so these assertions don't quietly go stale as real
  time passes.

- [x] **Play Store Data Safety mapping.** **2026-09-10**: Built
  `docs/data-safety.md` — maps this app's real data collection onto
  Play Console's actual Data Safety questionnaire categories (data
  type, purpose, voluntary/required, security practices), written to be
  filled into that form directly at submission time. Every row cites
  the actual source file/storage key so it can be re-verified instead
  of trusted blindly as the app changes. Caught and corrected one claim
  while writing it: incident-report photos are **not persisted
  anywhere** even in mock mode (`reportService.ts`'s mock branch
  discards the input after returning a result) — checked the actual
  code rather than assuming a `@resq_reports`-style key existed to
  document.
  **Not done, explicitly noted in the doc's own "what changes this
  document" section:** no independent security review has been
  performed; at-rest encryption relies entirely on OS-level app-storage
  protection, with no ResQ-side encryption layer on top — both are real
  pre-launch items, not oversights.

- [x] **Signed release build workflow — built, deliberately inert until
  real credentials exist.** **2026-09-10**: Built
  `.github/workflows/build-release-signed.yml`, a real second workflow
  (per the prior session's own recommendation) that builds a signed
  Android App Bundle (`bundleRelease` with a real upload keystore) and
  a signed, installable iOS IPA (`xcodebuild archive` + `-exportArchive`
  with a real distribution certificate/provisioning profile), then
  attaches both to a GitHub Release. The original
  `build-release.yml` is untouched and remains the fast, credential-free
  path for day-to-day device testing — see §3.2/`.github/workflows/README.md`.
  This workflow does not fabricate, guess, or hardcode any credential —
  every secret (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
  `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `IOS_DIST_CERT_BASE64`,
  `IOS_DIST_CERT_PASSWORD`, `IOS_PROVISIONING_PROFILE_BASE64`,
  `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_BASE64`) must already exist as
  a real GitHub Actions secret before the workflow will attempt
  anything. A `check-secrets` job runs first and fails immediately,
  naming exactly which secrets are missing, rather than letting a build
  fail confusingly mid-signing — verified this actually happens by
  reasoning through the `if:` conditions on `build-android`/`build-ios`
  (each gated independently on its own platform's `check-secrets`
  output) and by validating the file's YAML structure and every
  embedded shell block's syntax (`python3 -m yaml` + `bash -n` on each
  `run:` block) in this sandbox, since no real GitHub Actions runner
  was available to execute it end-to-end.
  `.github/workflows/README.md` now documents, per secret, exactly what
  it is and how a human obtains it (keystore generation command, where
  in the Apple Developer portal / App Store Connect each credential
  comes from) — none of which could or should be generated from this
  session.
  **Not wired to real credentials, and that's fine under this project's
  scope:** no Apple Developer Program membership or Android upload
  keystore exists, so this workflow has never actually run — it's
  scaffolding, ready for the day it's needed. Per the working
  assumption above (portfolio build, not an actual store submission),
  that day isn't expected to come for this project; recorded here so
  it's an honest, deliberate non-blocker rather than a silently
  abandoned task. Same for actual Play Console / App Store Connect
  *submission* — this workflow deliberately stops at producing signed
  artifacts, not publishing them, which was never in scope either way.

### Phase 3 — Stand up a real backend ⬜ Not started
Blocked on the backend-stack decision (§4 — not yet made).

### Phase 4 — Cut over from mock to real data ⬜ Not started
Blocked on Phase 3. Swap each service's mock branch for the real API,
one domain at a time — no screen/hook changes needed anywhere, by
design (§2, §5).

### Phase 5 — Hardening for a real public release ⬜ Not started

### Phase 6 — Post-launch / scale ⬜ Not started, not blocking v1

---

### 3.1 Maps — shipped 2026-09-10; kept below as the design record

Everything in this section describes what was actually built (see Phase
1's writeup above for the session log) — kept here rather than deleted
since it's still the reference for *why* each choice was made, and the
per-screen table below is where to look before adding a map to a new
screen in the future.

**SDK decision (made 2026-09-09, planning only): MapLibre + OpenFreeMap**,
not `react-native-maps`. User's stated priorities, in order: free with no
API key, one-time native setup, good on both platforms, web is a
nice-to-have only.

- `react-native-maps` defaults to Apple Maps on iOS (free) but Google
  Maps on Android, which needs an API key this project doesn't have —
  not a one-time setup. Routing it at raw OpenStreetMap tiles via
  `UrlTile` was considered and rejected: react-native-maps' own docs
  say this doesn't work on Android and isn't recommended for iOS beyond
  small-scale testing.
- **MapLibre (`@maplibre/maplibre-react-native`) + OpenFreeMap**
  (`https://tiles.openfreemap.org/styles/liberty`) needs no API key on
  either platform and OpenFreeMap states no rate limits by design,
  positioning itself as production-appropriate. *Re-verify the style
  URL and OpenFreeMap's current terms at the start of the
  implementation session* — this was carried over from an earlier
  exploration, not freshly re-checked.
- Setup is genuinely one-time: a config-plugin entry in `app.json` plus
  a dev-client rebuild — the same rebuild `react-native-maps` would
  also need, so this isn't trading away "one-time" to get "free."
  **This means it won't work in plain Expo Go** — flag that to the user
  before starting, it changes the local dev workflow.
- Web is explicitly out of scope: neither library has real web support,
  and MapLibre's web story needs a completely separate library
  (`react-map-gl` + `maplibre-gl-js`). Web keeps the existing static-pin
  illustration / "Open in Maps" link fallback. Deliberate scope line,
  not an oversight — the user said web was a nice-to-have only.
- Don't guess a package version — install with
  `npx expo install @maplibre/maplibre-react-native` when
  implementation starts.

**Re-verified live at implementation time (2026-09-10), not assumed:**
the style URL was re-fetched and resolves; OpenFreeMap's "no limits"
claim was independently confirmed (survived a real 100k req/s spike in
August 2025 without falling over, per their own postmortem). The exact
component API (`Map`/`Camera`/`ViewAnnotation`, `initialViewState`,
`lngLat`) was verified against the *installed* v11.3.10 package's own
TypeScript source plus MapLibre's official "Migrating to v11" guide —
worth knowing for next time: **the public docs site's main component
pages are stale/pre-v11** (they still show `MapView`/`centerCoordinate`);
the source and the migration guide agreed with each other and are what
this was actually built against.

| Screen | Has real coords today? | Map added? |
|---|---|---|
| `safe.tsx` | Yes | **Done** — replaced the fake-pin placeholder |
| `place-detail.tsx` | Yes | **Done** — replaced the fake-pin placeholder |
| `family-member.tsx` | Now yes for 2 of 3 mock members — see below | **Done** — added optional `latitude`/`longitude` to `FamilyMember`, shown only when a member has coordinates on file |
| `sos.tsx` (confirmed screen) | Yes | **Not done** — was a stretch item, not required; still open if wanted later |
| `report.tsx` | Yes | No — the location field is an editable text input; a map doesn't clarify a free-text field the way it clarifies a fixed point |
| `updates.tsx`, `family.tsx` | Only a free-text area string | No — nothing to plot |

**Seeding question resolved:** `mockFamily.ts`'s two members with a real
"shared N min ago" location got real coordinates; the member whose
location is "not shared yet" was left without coordinates — mirrors the
existing honesty pattern (no fake position for someone who hasn't
actually shared one) rather than inventing one.

**Implementation sequencing (historical — all steps done):**
1. ~~`npx expo install @maplibre/maplibre-react-native`; add the config
   plugin to `app.json`.~~ Done — installed directly via `npm install`
   after `expo install` failed on this sandbox's network-blocked
   remote-version check (same class of issue as `expo-doctor`'s 2
   known failures); confirmed via `npm view` that `^11.3.10` is a real,
   current published version before pinning it.
2. ~~Build one reusable `MiniMap` component~~ Done —
   `src/components/MiniMap.tsx`.
3. ~~Wire it into `safe.tsx` and `place-detail.tsx`~~ Done.
4. ~~Add `latitude`/`longitude` to `FamilyMember`, wire `family-member.tsx`~~
   Done.
5. ~~Add a Jest mock for the new native module~~ Done —
   `__tests__/smoke.test.tsx` mocks `@maplibre/maplibre-react-native` to
   plain Views, same pattern as the existing `expo-blur` mock. Confirmed
   necessary, not just cautious boilerplate: Jest's test environment
   reports `Platform.OS === 'ios'`, so `MiniMap`'s conditional native
   `require()` genuinely fires under test.
6. `sos.tsx`'s map was the one stretch item — not done, still open.

### 3.2 Signed release builds — what's actually needed to pick this up

Nothing code-side is missing here — `.github/workflows/README.md`
(2026-09-10) lays out the tradeoffs. What's actually blocking this is
non-technical and has to happen before any session, not during one:

1. An Apple Developer Program membership (paid, ~$99/year) if a real
   iOS build for real-device testing or App Store submission is wanted.
   A Google Play Console developer account (one-time fee) if a signed
   Android release/App Bundle for Play Store submission is wanted.
2. Once those exist: either (a) let EAS Build manage credentials
   (`eas.json`, `eas credentials`), or (b) generate a real Android
   upload keystore and an iOS distribution certificate/provisioning
   profile manually and store them as GitHub Actions secrets for a
   second, new workflow — see `.github/workflows/README.md` for the
   exact tradeoff between these two paths.
3. Whichever path: add a **second** workflow file rather than editing
   `build-release.yml`, so the existing fast unsigned build stays
   available for day-to-day device testing.

---

## 4. Decisions log

**Made:**
- **No separate `EmergencyContact` type.** The two onboarding contact
  steps (family circle, emergency contacts) used to keep independent,
  overlapping lists, and SOS only ever messaged one of them. Instead of
  adding a second type to keep in sync, `FamilyMember` gained a single
  `isPrimaryEmergencyContact: boolean` flag, and both onboarding steps
  now write into one merged, de-duplicated circle. Tradeoff: this
  assumes every emergency contact is conceptually part of the family
  circle — true for this app's current scope, would need revisiting if
  a future feature wants emergency contacts who explicitly aren't part
  of the family/check-in system.
- **Map SDK: MapLibre + OpenFreeMap, shipped 2026-09-10.** See §3.1 for
  the full rationale, including the live re-verification done at
  implementation time.
- **Map placement was deliberately kept to 3 screens, not "everywhere
  there's a coordinate."** Reviewed per-screen for genuine usability
  value (§3.1's table) and further scoped down at the user's explicit
  request not to over-add maps — `report.tsx`, `updates.tsx`, and
  `family.tsx`'s list view stay map-free by design, and `sos.tsx`'s map
  remains a deliberately-skipped stretch item, not an oversight.
- **Guest mode gets full SOS access**, same as a registered user. Not a
  deliberate SOS-specific choice — `sos.tsx` sits in the same
  `Stack.Protected` group as the rest of the authenticated app, and
  guest sessions already land in that group by existing design. Worth
  revisiting if a future session wants to narrow this (e.g. hide the
  local SOS *history* log for guests, since it's on-device storage a
  guest session may not expect to persist).
- **Minimum age: 18, enforced client-side at registration.** See
  Phase 2's writeup above and `src/utils/age.ts`'s doc comment for the
  full DPDP Act 2023 reasoning. Tradeoff: this can't actually verify
  anyone's real age (there's no ID-verification backend), so it's
  better understood as "an honest, good-faith gate" than a compliance
  guarantee — revisit once Phase 3's backend can support real identity
  verification or a real parental-consent flow.
- **Legal screens (`privacy-policy`, `terms`) live outside every
  `Stack.Protected` group**, not duplicated into the logged-out and
  logged-in groups separately. expo-router doesn't allow registering
  the same screen name twice anyway, and both screens genuinely need to
  be reachable in every auth state (pre-login for Play Store policy,
  post-login from Settings) — so "always mounted, like `index`" is the
  correct fit, not a workaround.
- **Signed release builds deliberately deferred, not built speculatively.**
  See Phase 2's writeup and §3.2. The blocking piece (Apple/Google
  developer credentials) is a real-world, often paid, human decision —
  building `eas.json` or a signing workflow against nothing would just
  be guessed-at scaffolding nobody could verify.

**Not yet made — still open:**
- **Backend stack.** No decision recorded anywhere in this file
  (checked the full archive, §8) — genuinely still open. Phase 3 is
  blocked on this.

**Implementation note, not a full decision:**
`readinessService.ts`'s `toggleReadinessItem` recomputes the readiness
score as a straight percentage of checklist items completed. This is
explicitly a placeholder — a real backend should compute readiness from
more than the checklist (profile completeness, check-in recency, etc.)
— but it's a real, defensible number rather than the disconnected
hardcoded 82% that was there before.

---

## 5. Adding a new backend-connected feature

1. Add/extend a type in `src/types/index.ts`.
2. Add mock data in `src/data/mock<Domain>.ts` matching that type exactly.
3. Add a service in `src/services/<domain>Service.ts` with the
   `if (config.useMockData) { ... } return apiRequest(...)` pattern —
   copy any existing service as a template.
4. Add a hook in `src/hooks/use<Domain>.ts` — usually a thin
   `useAsync(fetchThing, [])` wrapper.
5. Call the hook from the screen. Screens never import a service or
   mock data directly.

Domains already following this pattern end-to-end: updates, family,
safe places, guidance, chat, reports, readiness, profile, medical
profile, notifications, SOS, local reminders.

---

## 6. Data model — additions made so far

All in `src/types/index.ts` unless noted:
- `FamilyMember.phone`, `.lastKnownLocation`, `.isPrimaryEmergencyContact`, `.inviteStatus` (`'pending' | 'accepted'`), `.latitude`/`.longitude` (optional, added 2026-09-10 for the family-member map)
- `SafePlace.phone`
- `NotificationItem` / `NotificationKind`
- `ChatThread` (`ChatThreadSummary` + `messages`)
- `MedicalProfile` (allergies, conditions, usesMobilityAid, hasVisualImpairment, hasHearingImpairment)
- `ProfileData.dob`, `.bloodType`
- `SosEvent` (id, triggeredAt, calledEmergencyNumber, contactsNotified, location)

**Deliberately not added:** a separate `EmergencyContact` type (§4); a
structured address on `ProfileData` (stays a single free-text field —
every screen that reads `location` already expects a plain string, and
onboarding composes a `city, state` summary into it rather than exposing
the raw structured fields it collects). Also deliberately not added:
`ProfileData` did **not** grow a separate registration-time DOB field —
`src/utils/age.ts`'s DOB gate at registration is validated inline in
`register.tsx` and only re-used for math, not persisted as a second DOB
alongside onboarding's own `dob` field. If a future session wants the
registration DOB to actually populate the profile (skipping onboarding's
own re-ask), that's a real, deliberate follow-up — not done automatically
here, since onboarding's step is explicitly skippable and shouldn't be
silently pre-filled from a value the user may not expect it to remember.

---

## 7. Pages — full map

| Route | Purpose | Notes |
|---|---|---|
| `app/index.tsx` | Splash / startup router | Solid |
| `app/login.tsx` | Sign in | Forgot-password real (local flow); Google button removed. Footer Terms/Privacy links now real (2026-09-10). Needs real validation once a backend exists |
| `app/register.tsx` | Sign up | **2026-09-10**: real date-of-birth field + 18+ gate (`src/utils/age.ts`); footer Terms/Privacy links now real. Needs real validation once a backend exists |
| `app/forgot-password.tsx` | Locally-simulated password reset | Solid for no-backend stage; swap the request call once real auth exists |
| `app/privacy-policy.tsx` | **New 2026-09-10.** In-app Privacy Policy | Real, app-specific content via `LegalDocument`; not yet hosted at a public URL |
| `app/terms.tsx` | **New 2026-09-10.** In-app Terms of Service | Real, app-specific content via `LegalDocument`; not yet hosted at a public URL |
| `app/onboarding/personal.tsx` | Name/phone/DOB/blood type | Real persistence, merges into `ProfileData`. Its own `dob` field is separate from register.tsx's age-gate DOB — see §6 |
| `app/onboarding/medical.tsx` | Allergies/conditions/accessibility | Real persistence; now has a display surface too (Profile's Medical ID card) |
| `app/onboarding/family.tsx` | Family members | Real persistence, fake pre-seed removed |
| `app/onboarding/location.tsx` | Home address + device location | Real persistence; one-time snapshot by design (live location lives elsewhere — `useDeviceLocation()`) |
| `app/onboarding/emergency.tsx` | Emergency contacts | Real persistence, merged into the same circle as `family.tsx` (§4) |
| `app/(tabs)/index.tsx` | Home | Real greeting/date/counts; SOS entry point |
| `app/(tabs)/updates.tsx` | Live updates | Real area source |
| `app/(tabs)/report.tsx` | Incident report | Real name/location seed, camera capture done |
| `app/(tabs)/family.tsx` | Family circle | Real invite form + persistence; check-in reminder toggle. Needs: real backend-side accept/decline (Phase 3) |
| `app/(tabs)/safe.tsx` | Safe places | Real coordinates + distance sort. **2026-09-10**: real MapLibre map replacing the fake-pin card |
| `app/chat.tsx` | Ask ResQ assistant | Real history switching, sources rendering done |
| `app/readiness.tsx` | Readiness detail | Tappable checklist |
| `app/guidance-result.tsx` | Post-report guidance | Reference pattern for sources UI; increments guides-read counter |
| `app/family-member.tsx` | Person detail | Working Call/Message/Locate. **2026-09-10**: real map when the person has coordinates on file |
| `app/place-detail.tsx` | Place detail | Working Directions/Call. **2026-09-10**: real MapLibre map replacing the fake-pin card |
| `app/update-detail.tsx` | Update detail | Not yet audited in depth |
| `app/profile.tsx` | Profile & settings | Real name/stats, real persistence, dob/bloodType fields, Medical ID card |
| `app/alert-preferences.tsx` | Notification category toggles | Needs: persistence, gating real notifications (Phase 1/5) |
| `app/privacy-security.tsx` | Privacy settings | Working data export/deletion (local). **2026-09-10**: added Privacy Policy/Terms link rows |
| `app/notifications.tsx` | Alerts/updates list | Local storage only, real working destination |
| `app/sos.tsx` | Emergency SOS | Working, local-only logging, real Maps link in SMS/history. Needs: push/alarm, hardware trigger (Phase 1/5) |
| `app/sos-history.tsx` | Past SOS activations | Local storage only, real destination |

**Missing screens still to add:** `help-support.tsx` (Phase 1/5), an
internal moderation/verification tool (Phase 3).

**Known to remove/replace later:** the debug-APK-only CI workflow is
staying as-is deliberately (§3.2) — not something to "remove," just to
add a signed sibling to once credentials exist. (The fake-pin map
illustration on `safe.tsx`/`place-detail.tsx` was replaced with a real
map on 2026-09-10 — it now only remains as `MiniMap.tsx`'s deliberate
web fallback, since MapLibre has no web renderer, not as a placeholder
waiting to be built.)

**Non-code deliverables still open (Phase 2):** host the Privacy Policy
and Terms at a public URL; get both reviewed by counsel familiar with
India's DPDP Act 2023 before a real public launch; fill
`docs/data-safety.md`'s mapping into the live Play Console form at
submission time.

---

## 8. Archive

Full session-by-session logs from before the current roadmap (§1–§7)
existed — tab bar layout fixes, navigation push/replace audit,
icon/video asset cleanup, a pre-Home-screen flow redesign, crash fixes,
and early UI polish. All of it is superseded by the current state
described above — **nothing here is required reading**, it's kept
because this file is the project's memory and nothing gets silently
deleted, not because it's still relevant. Skip straight to §1 unless
you're specifically tracing the history of an old fix.

Preserved exactly as originally written, unedited, below this line.

---
# PROGRESS

## Session (Tab bar gap fix + navigation stack/replace audit) — COMPLETE

Picked up two asks: a screenshot showing inconsistent horizontal gaps
between the bottom tab bar's icons, and a request to review the whole
app's navigation and decide, deliberately, which transitions should
`push` (stack, back-navigable) vs `replace` (swap, no history) — "including
the auth pages and all."

### 1. Tab bar gap fix

**Root cause, confirmed by simulation, not eyeballing.** Every tab
(`src/components/TabBarButtons.tsx`) used `flex: 1`, so all 5 cells were
forced to equal width, with content centered inside each. That's fine when
every icon is the same size — but the Report button's circle (54px) is
wider than the other tabs' icon pill (44px), so within an equal-width
cell it ate 10px more than a regular tab's icon did, leaving 5px less
padding on *each* side. Installed `yoga-layout` (the actual layout engine
React Native uses) in a scratch sandbox and built the exact layout tree
from this file's own style values to check this rather than guess from
the screenshot: confirmed the gap on either side of Report comes out
~20% smaller than every other gap, consistently, regardless of simulated
bar width. That's the reported "unconsistent gap."

**Fix**: stopped using equal `flex: 1` cells. Every tab now gets a fixed
width — `icon width + 2 × 10px` — using the same 10px padding constant
for every tab regardless of its own icon's size, so Report's cell is
simply 10px wider (matching its 10px-larger icon) rather than fighting
for an equal share. `tabBarStyles.bar`'s `justifyContent` changed from
`space-around` to `space-between`, which — verified with the same Yoga
simulation at three different bar widths, including a tablet width —
splits any leftover width equally across the 4 gaps regardless of the
cells' own widths either side of a gap. Result: gaps come out
mathematically identical (22.00/22.00/22.00/22.00 on one simulated
width, 35.00 across the board on another) rather than approximately
close.

**Also fixed while in this file** (same screenshot, same component):
Report's label was rendering outside the bar's own rounded bottom edge —
its raised circle (54px tall, `marginTop: -18` to pop it above the bar)
pushes the label a few px lower than the other tabs' 32px-tall icon pill
does, and the bar's `minHeight: 64` wasn't tall enough to contain that.
Bumped to `72` (computed from the actual content stack height, not a
round-number guess) so every label — Report's included — sits fully
inside the bar.

**Also added**: a `TAB_BAR_MAX_WIDTH = 480` cap in `app/(tabs)/_layout.tsx`,
computed via `useWindowDimensions` and applied as a dynamic `left`/`right`
inset (TabList can't be wrapped in a positioning `View` — see the
structural comment already in that file — so the cap has to be computed
inline rather than via a wrapper). Without this, the newly-exact-equal
gaps would still stretch to fill an iPad or Mac window's full width
(~110px between icons on a simulated 700px-wide bar) — equal but
absurd isn't the goal. On any real phone this resolves to the original
fixed 14pt inset with no visual change; it only kicks in above ~508pt of
width. Matches the `maxWidth: 480/520` centering convention
`login.tsx`/`register.tsx`/`OnboardingLayout.tsx` already use.

### 2. Navigation push/replace audit ("including the auth pages and all")

Read every `router.push`/`router.replace`/`router.back()` call in the
app (30+ call sites) and checked each against expo-router's *actual
source* (pulled `expo-router@57.0.19` — the exact version this project
pins — from the npm registry into a scratch sandbox and read
`global-state/getNavigationAction.js`, `ui/TabRouter.js`, `ui/TabTrigger.js`)
rather than assuming behavior, because this app's custom headless tab
bar makes "does push duplicate something" a genuinely non-obvious
question here.

**What's already correct, and why** (confirmed from source, not just
"looks fine"):
- **Splash → login/onboarding/tabs** (`app/index.tsx`): all `replace`.
  Correct — splash should never be swipe-back-able to.
- **Login ⇄ Register**: `login.tsx`'s "Sign up" is `push` (so back
  returns to login — standard peer-auth-screen UX); `register.tsx`'s
  "back to login" is `router.back()`, safe because register is only ever
  reached by that one push, never a direct entry point.
- **Login/Register/Guest → tabs, Onboarding → tabs**: all `replace`.
  Redundant-but-harmless on top of `Stack.Protected`'s own
  guard-flip history-clearing (documented in an earlier session below),
  not a bug.
- **Onboarding step 1→2→3→4→5**: all `push`, including the "Skip for
  now" buttons (skip just advances without saving that step's fields —
  still `push`, so back can still return to a skipped step). Correct
  wizard-flow semantics.
- **Every drill-down detail screen** (`update-detail`, `family-member`,
  `place-detail`, `readiness`, `alert-preferences`, `privacy-security`,
  `guidance-result`, `chat`, `profile`): reached by `push` from a list
  screen, backed out via `router.back()`. Standard, correct, and
  consistent everywhere.
- **Switching tabs via a card/button inside a tab screen**
  (`app/(tabs)/index.tsx`'s quick-action cards doing
  `router.push('/(tabs)/updates')` etc., and `report.tsx`'s in-tab
  navigation): confirmed via `getNavigationAction.js` that expo-router
  auto-converts a `PUSH` into effectively a same-instance tab focus
  switch whenever the *divergent navigator* between the current and
  target route is the tabs group itself (`navigationState.type !==
  'stack'` triggers `PUSH` → `NAVIGATE`, and `ExpoTabRouter`'s own
  `getStateForAction` in `ui/TabRouter.js` delegates any non-`JUMP_TO`
  action straight to React Navigation's stock `TabRouter`, which focuses
  an existing route rather than duplicating it). So this pattern is safe
  as written — no duplicate tab-bar instances, no change needed.

**What was actually broken, and fixed**:
- `app/guidance-result.tsx`'s "Back to home" button and
  `app/profile.tsx`'s "My people" row both did `router.push('/(tabs)...')`
  from a screen that is a **root-level sibling** of `(tabs)` (per
  `app/_layout.tsx`'s `Stack.Protected` groups), not a screen *inside*
  it. From there, the divergent navigator is the **root stack**, not the
  tabs group — so the auto-conversion above does *not* apply, and `push`
  genuinely stacks a second, separate `(tabs)` instance on top of
  whichever one is already mounted underneath. Traced a concrete
  repro: Home tab → Report tab (in-tab, no stack entry) → push
  `guidance-result` → push `/(tabs)` from its "Back to home" button
  yields `[(tabs)-Report, guidance-result, (tabs)-Home]` — two separate
  mounted tabs instances in history, meaning back from the new Home would
  land on `guidance-result` again instead of leaving the flow, and a
  second back would be needed to reach the original tabs instance.
  **Fixed**: both changed to `router.replace(...)`. A fresh `(tabs)`
  mount via `replace` still correctly lands on the intended tab (Home for
  guidance-result's case, Family for profile's "My people") because
  React Navigation initializes a newly-created nested navigator's focus
  from the target path's nested params — same mechanism that makes deep
  links land on the right tab. `replace` swaps the *current* screen for
  that fresh mount instead of stacking a third entry on top, which
  removes the double-back-press problem. (Deliberately did not reach for
  `router.dismissTo`, which would be the theoretically tidier fix — it
  pops back to an already-mounted matching instance instead of creating
  a fresh one — because I couldn't verify from source, without a live
  device, whether `dismissTo`'s `POP_TO` action reliably re-focuses the
  *nested* tab on an existing instance versus just reusing whatever tab
  it already had focused. `replace` has no such ambiguity: it's a fresh
  mount, so it deterministically initializes to the target tab.)
- Confirmed via `grep` that these were the *only* two occurrences of this
  pattern (`push` targeting `/(tabs)...` from a file outside
  `app/(tabs)/`) anywhere in the app.

### Verify

No `node_modules` in this sandbox (same standing constraint as every
prior session below — no registry access from the actual build tooling,
only from a scratch npm sandbox used to pull `yoga-layout` and
`expo-router` for read-only inspection). Verified instead with:
- A standalone `tsc --noEmit` pass (global `tsc`, throwaway `tsconfig`
  pointing only at the 4 touched files) — zero errors beyond the same
  "Cannot find module 'react'/etc." noise every untouched file in this
  project also produces without a real install; no new error class
  introduced.
- Brace/paren/bracket balance check on all 4 touched files — clean.
- The Yoga gap-math and the expo-router push-semantics claims above were
  each verified by actually running simulated layouts / reading the
  exact pinned package version's source, not asserted from memory.

### Known gaps (unchanged, carried forward)

Everything in "Known gaps / suggested next steps" further down this file
is still accurate and untouched this session — auth is still a stub,
location still isn't wired to `safe.tsx`, no test suite was run here
(couldn't be, same missing-`node_modules` constraint). The main
recommended next step specific to *this* session: run `expo start` on a
real device and exercise the guidance-result → back-to-home and
profile → My People flows once, to confirm the `replace` fix lands on
the intended tab in practice, not just in source-level reasoning.

---

## Session (Icon backgrounds fixed, video asset cleanup) — COMPLETE

Picked up two user-reported issues: a crash log showing `app/index.tsx`
requiring a non-existent `../logo/Startup Animation Dark Mode.MP4`, and a
repeated request that `assets/images` icons not have a green background —
icons should be light/dark per theme instead.

- [x] **Investigated the crash report first, before changing anything.**
      Read the zip's actual `app/index.tsx`: it already requires
      `../assets/videos/startup-light.mp4` / `startup-dark.mp4` (lowercase,
      correct relative path), and both files exist at that path and are
      registered as asset extensions in `metro.config.js`. So the crash the
      user pasted reflects an **older** state of the code than what's in
      this zip (likely their local checkout / a stale `expo start` cache
      predates the fix from a previous session) — not a bug present in
      these files. Confirmed via `grep -rn` that zero references to the old
      `logo/...MP4` path remain anywhere in `app/`, `src/`, or config files.
- [x] **Found and removed a real latent problem anyway**: `logo/` still
      contained byte-identical duplicate copies of both `.mp4` files
      (verified via `md5sum` — exact match with the `assets/videos/`
      copies). Harmless to the build, but confusing (it's what made the
      user's old crash trace look plausible at a glance) and needless
      repo weight. Removed the two `.mp4` files from `logo/`; kept
      `logo/light icon.png` and `logo/dark icon.png` there since those are
      still the actual source-of-truth design files the icon generation
      script reads from.
- [x] **GitHub Action reviewed** (`.github/workflows/build-release.yml`):
      structurally correct as-is — `actions/checkout@v4` will pick up
      whatever's committed, `.gitignore` has no pattern that would exclude
      `assets/videos/*.mp4` or `logo/*.png`, both video files are ~2.5–2.9MB
      each (nowhere near GitHub's 100MB hard limit or even the 50MB soft
      warning), no `assetBundlePatterns` restriction in `app.json` to
      exclude them from the native build, and the Android/iOS jobs already
      do a real `expo prebuild` + native build rather than relying on EAS
      (so no `eas.json` asset-pattern config applies here either). No
      changes made — nothing was actually broken here; flagged for the user
      in the handoff below in case what they were seeing was a stale local
      Metro cache or an outdated commit on their end, not a repo problem.
- [x] **Fixed the actual green-background icon issue** — root cause:
      `assets/images/icon.png` and `favicon.png` still had a solid
      `rgb(22,76,74)` (`#164c4a`-family) fill behind the brand mark, left
      over from before `icon-dark.png` was correctly redone in an earlier
      session. Regenerated all system icon assets from the same two clean
      source files (`logo/light icon.png` = black mark on white,
      `logo/dark icon.png` = white mark on black) using one script so every
      variant shares identical mark geometry (extracted the mark as an
      alpha-only mask, thresholded on luminance, cropped to content
      bounds, then re-centered at a fixed scale on each target canvas):
  - `icon.png` — white background (`#ffffff`), black mark. Used as the
    default/light iOS icon and the top-level `expo.icon`.
  - `icon-dark.png` — near-black background (`#0b0f0e`), white mark.
    Regenerated at the same scale/centering as `icon.png` for visual
    consistency (previously generated separately, in an earlier session,
    from the same source at the same 0.62 scale — now produced by the
    same script run in one pass).
  - `adaptive-icon.png` — Android adaptive-icon foreground: transparent
    background, black mark. Deliberately scaled smaller (0.5, matching
    the splash icon) rather than reusing the 0.62 scale the flat icons
    use, because Android launchers crop adaptive-icon foregrounds to a
    center "safe zone" (roughly the center 66% of the canvas, varies by
    launcher mask shape) — the mark's wide horizontal arms would sit right
    at the edge of that zone at 0.62 and risk clipping on circular/squircle
    masks. `app.json`'s existing `android.adaptiveIcon.backgroundColor` is
    `#ffffff`, so the transparent foreground shows a white system
    background — no green anywhere in the composited result.
  - `favicon.png` — same treatment as `icon.png` (white bg, black mark),
    196×196.
  - `splash-icon.png` (light) / new `splash-icon-dark.png` (dark) —
    transparent, black mark / white mark respectively, 0.5 scale. **Wired
    the new dark variant into `app.json`**: the `expo-splash-screen`
    plugin config's `dark.image` previously pointed at the same
    `splash-icon.png` used for light mode. That's a genuine bug this
    session's icon fix would otherwise have introduced — a plain black
    mark composited over the dark splash's `#000000` background would
    have been invisible. Caught by actually compositing the generated
    dark splash asset over black and inspecting it before finishing,
    not just assuming the light asset would work for both.
  - Verified with `PIL`: sampled corner pixels of every asset in
    `assets/images/` to confirm alpha/RGB values match the intended
    background (white/`#ffffff`, near-black/`#0b0f0e`, or fully
    transparent alpha=0) with zero remaining `rgb(22,76,74)` pixels
    anywhere. Also re-grepped `app.json` and `src/theme/colors.ts` for
    the brand teal hex (`#164c4a`, `#1f6865`) — the only remaining hits
    are legitimate in-app UI color tokens (buttons, the `Logo.tsx` badge
    background, success-state color), not system icon files, so those
    were correctly left untouched.
- [x] **README.md updated**: removed a stale "app icons are placeholders,
      generated brand-color 'R' mark" note in Known limitations (that
      description was inaccurate even before this session — the real
      brand mark was substituted in over a session ago; this pass just
      also fixed its background color). Updated the structure-overview
      line for `assets/images/` and added a line for `assets/videos/`.
- [x] **Verify**: no `node_modules` present in this sandbox and no network
      access, so `npx tsc --noEmit` / `npx expo-doctor` / `npm run
      test:smoke` could not be executed here this session — none of this
      session's changes touch `.ts`/`.tsx` source (only binary image
      assets, `app.json`'s two splash-image path strings, `README.md`
      prose, and deleting two duplicate `.mp4` files from `logo/`), so
      there's no new surface for type or runtime errors. Recommend running
      `npx expo-doctor` and `npm run test:smoke` once on a machine with
      network access to confirm, per standard practice — flagged in the
      handoff.

## Session summary

The reported crash (`../logo/...MP4` not found) doesn't reproduce against
this zip's actual code — `app/index.tsx` already requires the correct
`assets/videos/` files, which exist. Removed a confusing duplicate copy of
those same video files that was still sitting in `logo/` (likely the
source of the stale crash trace) and confirmed the GitHub Action has
nothing that would exclude or mishandle either asset. The real, reproducible
bug was the icon backgrounds: `icon.png` and `favicon.png` still carried
the green brand-teal fill the user has asked to remove more than once.
Regenerated every system icon variant (iOS light/dark, Android adaptive,
web favicon, splash light/dark) from the same two clean source marks with
consistent geometry and correct per-theme backgrounds (white / near-black /
transparent — never green), and caught + fixed a follow-on bug the mark
recoloring would otherwise have caused (dark splash screen using an image
that only worked on a light background).

---

## Session (Pre-Home-Screen Flow Redesign & App Config Fixes) — COMPLETE

Redesigned the entire pre-home-screen experience, resolved `app.json` schema and version mismatches, added custom page transitions, and ensured responsive layout for phones and iPad/tablets across portrait and landscape.

- [x] **App Config & Schema Fixes (`app.json`)**:
      - Resolved all `expo-doctor` schema errors: removed deprecated `splash` property, removed invalid top-level `newArchEnabled`, and removed `android.edgeToEdgeEnabled`.
      - Completely removed green brand color `#164c4a` from app-level configuration. System splash and background now use clean `#ffffff` (light) and `#000000` (dark).
      - Updated `orientation` to `"default"` to support landscape on iPad and large devices.
      - Integrated `expo-video` plugin in `app.json`.
      - Ran `npx expo install --fix` to align dependencies with Expo SDK 57: updated `jest`, `@types/jest`, `react-native-reanimated`, and `typescript`.
      - `npx expo-doctor` now passes **21/21 checks** (100% clean).

- [x] **Startup Video Screen & Media Assets (`app/index.tsx`, `assets/videos/`)**:
      - Moved startup videos into the standard project asset directory `assets/videos/`:
        - `assets/videos/startup-light.mp4` (Light mode animation)
        - `assets/videos/startup-dark.mp4` (Dark mode animation)
      - Configured `metro.config.js` to explicitly register `mp4` and `MP4` asset extensions.
      - Fullscreen video playback using `expo-video` (`VideoView` + `useVideoPlayer`).
      - Dynamically selects video variant based on system theme:
        - Light mode on a pure white `#ffffff` canvas.
        - Dark mode on a pure black `#000000` canvas.
      - On tap or on playback completion, smoothly fades out and transitions to `/login`.
      - If user is already authenticated and onboarded, skips playback and navigates straight to `/(tabs)`.

- [x] **GitHub Actions Workflow (`.github/workflows/build-release.yml`)**:
      - Added explicit Java 17 setup (`actions/setup-java@v4` with Temurin JDK 17) for the Android build job to ensure full compatibility with modern React Native 0.86 / Expo SDK 57 Android Gradle builds.
      - Verified `npm ci` succeeds without peer dependency or lockfile conflicts.
      - Added `--clobber` to GitHub release creation so re-running a build on an existing tag updates release assets gracefully.

- [x] **Auth State Management (`src/context/AuthContext.tsx`)**:
      - Lightweight, persistent authentication context using `@react-native-async-storage/async-storage`.
      - Supports `isLoggedIn`, `isGuest`, and `hasCompletedOnboarding`.
      - Provides `login()`, `register()`, `loginAsGuest()` (emergency access), `completeOnboarding()`, and `logout()`.

- [x] **Redesigned Login Page (`app/login.tsx`)**:
      - Centered brand crest and modern minimalist layout constrained to `maxWidth: 480` for tablet/iPad responsiveness.
      - Form inputs with clear active focus states, modern rounded design tokens, and password visibility toggle.
      - Primary "Sign In" button, "Continue with Google" social action, and link to register.
      - Prominent "Emergency App Access" button providing one-tap guest access straight to `/(tabs)` without credentials.

- [x] **New Register Page (`app/register.tsx`)**:
      - Matching premium design language with `maxWidth: 480` tablet centering.
      - Inputs: Full Name, Email, Password, and Confirm Password with instant validation.
      - On account creation, persists user credentials and advances immediately to the onboarding flow (`/onboarding/personal`).
      - Also features "Emergency App Access" guest bypass.

- [x] **Onboarding Setup Flow (`app/onboarding/`)**:
      - Created reusable `OnboardingLayout` (`src/components/OnboardingLayout.tsx`) with animated progress indicators, step counters, headers, unified "Continue" / "Skip for now" actions, and `maxWidth: 520` centering for tablets in portrait and landscape.
      - **Step 1: Personal Details (`app/onboarding/personal.tsx`)** — Full name (pre-populated), phone number, DOB, and blood type selector grid.
      - **Step 2: Medical & Accessibility (`app/onboarding/medical.tsx`)** — Tag-style allergies chip input, medical conditions text area, and accessibility toggles (mobility, vision, hearing).
      - **Step 3: Family Circle (`app/onboarding/family.tsx`)** — Add family members with relationship chips and phone numbers; displays removable member cards with avatar initials.
      - **Step 4: Home Location (`app/onboarding/location.tsx`)** — Address, city/district, state, nearest landmark, and a one-tap "Use current location" button powered by `expo-location`.
      - **Step 5: Emergency Contacts (`app/onboarding/emergency.tsx`)** — Select primary emergency contacts from family or add new contacts; "Complete Setup" marks onboarding complete in storage and enters `/(tabs)`.

- [x] **Transitions & Animations (`app/_layout.tsx`)**:
      - Stack transitions configured: `fade` for startup video, `slide_from_right` for login, register, and onboarding steps, and `fade` when transitioning to tabs.

- [x] **Verification**:
      - `npx expo-doctor` passes **21/21** checks.
      - `npx tsc --noEmit` passes with **0 type errors**.
      - `npm run test:smoke` passes **22/22 tests** across all screens (including all new onboarding steps, register, login, and splash).

Picked up from a real `expo start` crash report the user hit after the
previous session's handoff: `Text strings must be rendered within a
<Text> component` in `app/(tabs)/family.tsx`.

- [x] **Root cause found and fixed.** A previous edit had left the closing
      `>` of `<Pressable>` and the following `<View>` on the same physical
      line, separated only by spaces. In JSX, whitespace between tags is
      only stripped when it spans a line break — a same-line run of spaces
      becomes a literal string child. Confirmed by transforming the exact
      snippet through the project's own Babel config
      (`babel-preset-expo`) and inspecting the output AST: it produced
      `children: ["                  ", jsx(View, ...)]`. Fixed by putting
      the `<View>` on its own line. Re-scanned the whole codebase for the
      same pattern (`grep -rnP '>\s{2,}<'`) — this was the only instance.
- [x] **Why this slipped past every prior check.** `tsc --noEmit` doesn't
      catch it (valid TS). The previous session's `expo export --platform
      web` verification also missed it, because static rendering renders
      each screen once while its data hook is still in its initial
      `loading: true` state — the buggy `list.map(...)` branch only runs
      *after* the mock fetch resolves, which never happened during that
      export. This is a real gap in "verify with tsc + expo export" as a
      strategy, not a one-off oversight.
- [x] **Built a real regression harness to close that gap** —
      `__tests__/smoke.test.tsx` (run via `npm run test:smoke`), using
      `jest-expo` + `@testing-library/react-native`. Mounts every screen
      with mocked `expo-router`/`expo-blur`, waits out the mock services'
      ~450ms delay so each screen's "data loaded" render branch actually
      executes, then asserts nothing threw. Deliberately does **not** use
      raw `react-test-renderer`: confirmed by grepping `node_modules/`
      that the "Text strings must be rendered within a `<Text>` component"
      invariant lives inside React Native's own renderer implementation
      (`ReactFabric-dev.js`), not in the generic `react-test-renderer` host
      config — `@testing-library/react-native` is what actually wires
      tests up against RN's real renderer, so it's the tool that can catch
      this bug class at all. Validated the harness itself by deliberately
      re-introducing the exact bug and confirming the test fails with the
      exact same invariant message from the crash report, then restored
      the fix and confirmed all 16 tests pass clean.
  - Needed `test-renderer` (a separate npm package, not `react-test-renderer`)
    as a peer dep of this RTL version, and a `@react-native/jest-preset`
    version matching the project's installed `react-native@0.86.3` (the
    latest jest-preset version assumes a newer RN internal file layout and
    fails to resolve `react-native/setup-env`). Both pinned accordingly in
    `package.json`.
  - `npm run test:smoke` now runs 16/16 green.
- [x] **Tab bar redesigned** (`src/components/TabBarButtons.tsx`) —
      icons now sit in a pill-shaped active indicator (only the icon's
      background highlights on focus, not the whole tab cell — reads less
      "blocky"), labels get a subtle weight bump when active instead of
      relying on color alone, and the center Report button is a proper
      floating action button: larger (50px), thinner ring (3.5px, was a
      heavy 4px), tighter shadow tied to `colors.shadowBrand`, and raised
      further above the bar for clearer visual priority. Bar itself uses a
      hairline border instead of a full 1px stroke for a lighter look.
      The crash-fix structural pattern in `app/(tabs)/_layout.tsx`
      (`TabList` always mounted, visibility via style) was left untouched —
      this pass only changed presentation, not the discovery-sensitive
      structure.
- [x] **iOS light/dark alternate app icon** — implemented via Expo's
      native `ios.icon` config key (confirmed against
      docs.expo.dev/develop/user-interface/splash-screen-and-app-icon,
      not guessed — this is a first-party app-config feature as of SDK 54+,
      not a third-party plugin, and this project is on SDK ~57 so it's
      supported). `app.json`'s `ios.icon` is now
      `{ light: "./assets/images/icon.png", dark: "./assets/images/icon-dark.png" }`.
      Generated `icon-dark.png` using the *same* mark-scale/centering
      logic as the existing `icon.png` (same `square_canvas` helper, same
      0.62 scale) so the two variants share identical geometry per Apple's
      HIG — only the background changes, from the brand teal to a deep
      near-black (`#0b0f0e`), echoing `logo/dark icon.png`'s black/white
      treatment rather than reusing that source file directly (which has
      a different mark-to-canvas ratio and would have made the two
      variants visually inconsistent). Verified the resolved config via
      `npx expo config --type public`, which confirms Expo's own config
      resolver accepts and preserves this exact schema.
- [x] **Verify**: `npx tsc --noEmit` clean. `npm run test:smoke` 16/16.
      `npx expo export` clean for `ios`/`android`/`web`. `npx expo-doctor`
      19/21 (same 2 sandbox-network-blocked checks as every prior session
      — not project issues).
- [x] PROGRESS.md updated, project re-zipped, handed back.

## Session summary

Root-caused and fixed a real on-device crash the user hit after the last
handoff (a JSX whitespace-as-text-node bug my own earlier edit
introduced), and — more importantly — built and validated a proper
regression-test harness specifically because the bug had slipped past
both `tsc` and `expo export` in the previous session. That gap is now
closed: `npm run test:smoke` mounts every screen with real (resolved)
mock data and will catch this class of runtime-only error going forward.
Also redesigned the tab bar for a more polished look and added real
iOS light/dark alternate app icons via Expo's native config (verified
against current docs, not assumed).

---

## Session (crash fix + polish + dead-link wiring) — COMPLETE

Picked up from a prior chat's audit (pasted into this session) plus the
user's own `expo start` crash log. Confirmed every item below by reading
the actual files before touching anything, then implemented and verified
each fix (not just diagnosed).

- [x] **Crash: "Couldn't find any screens for the navigator."** —
      `app/(tabs)/_layout.tsx` wrapped `<TabList>` (and all 5 `<TabTrigger>`s)
      in `{!hideTabBar && (...)}`. The moment `hideTabBar` flips true
      (Profile/Chat call `useHideTabBar()` on focus), `<Tabs>`'s static
      `Children.forEach` walk found zero `TabTrigger`s and threw. Fixed by
      reading the actual `expo-router/ui` source (`Tabs.js`,
      `parseTriggersFromChildren`) to confirm the exact discovery rule,
      then keeping `TabList`/`TabTrigger`s always mounted and toggling
      visibility via style (`opacity` + `translateY` + `pointerEvents`)
      instead of a conditional render. Verified: `expo export --platform
      web` does real static rendering, and all 5 tab labels ("Home",
      "Updates", "Report", "Family", "Places") render correctly in the
      HTML output of every tab route — same verification rigor that
      originally caught the bug.
- [x] **Notch/safe-area check** — re-verified: `Header.tsx` already calls
      `useSafeAreaInsets()` and pads `paddingTop: insets.top + 10`, and
      every screen sits below `Header`, so content was not actually hidden
      behind the notch. The prior audit's claim here was stale; no change
      needed, confirmed unaffected by the tab bar fix.
- [x] **Tab bar visual polish** — wired an actual `<BlurView>` into the tab
      bar using the `blurClip`/`blurFill` styles that already existed in
      `TabBarButtons.tsx` but were never rendered (dead styles). Found and
      fixed a second, previously-invisible bug while doing this:
      `StyleSheet.absoluteFillObject` does not exist in RN 0.86 (confirmed
      against the installed type defs — only `StyleSheet.absoluteFill` is
      exported), so spreading it was a silent no-op and those two styles
      carried zero positioning. Fixed to the real API. iOS/web get frosted
      glass; Android keeps a solid `colors.surface` background since
      `BlurView` support is inconsistent across Android devices.
- [x] **"Buggy" screen switching** — root cause confirmed as the crash
      above. `useAsync`/tab-unmount behavior re-checked: tabs don't
      unmount on switch by default with `expo-router/ui`, so no separate
      fix was needed there.
- [x] **Dead-end links** — all wired, confirmed by reading every screen
      first and building real destinations rather than fake chevrons:
  - `app/(tabs)/updates.tsx`: update cards → new `app/update-detail.tsx`
    (per-update detail with source citation); "Review your plan" →
    existing `/readiness`; "Alert preferences" → new
    `app/alert-preferences.tsx` (real per-category toggles).
  - `app/(tabs)/family.tsx`: person rows → new `app/family-member.tsx`
    (contact detail, call/message/locate actions, check-in action wired
    to the existing `useFamily().checkIn`).
  - `app/(tabs)/safe.tsx`: place rows → new `app/place-detail.tsx`;
    "Change" → inline location editor (the mock district name is
    editable in place); "Map view" → renamed to "Highlight map" and
    highlights the existing static map-preview card, since there's no
    real MapView/map SDK wired in yet (see Known gaps) and pretending to
    switch to a live map would just be a different fake affordance.
  - `app/profile.tsx`: "My people" → Family tab; "Privacy & security" →
    new `app/privacy-security.tsx` (data-sharing toggles + what's
    collected, written as real settings content, not placeholder text).
  - `app/(tabs)/index.tsx`: bottom insight card ("review your emergency
    contacts") → Family tab.
  - All 5 new screens registered in `app/_layout.tsx`'s `<Stack>`.
- [x] **Network dependency on every screen** — `src/components/Logo.tsx`
      and `app/index.tsx` (splash) both loaded a Vercel-hosted PNG. Fixed:
      extracted the brand mark from `logo/light icon.png` (1254×1254)
      programmatically — thresholded to a transparent-background alpha
      mask, cropped to content bounds, verified visually at each step —
      then generated `assets/images/icon.png` (opaque, brand-colored,
      1024×1024), `adaptive-icon.png` (transparent foreground sized to
      Android's safe zone), `splash-icon.png` (transparent, composited by
      Expo over `app.json`'s existing `backgroundColor`), `favicon.png`
      (196×196), and `logo-mark.png` (compact transparent mark for
      in-app use). `Logo.tsx` and `app/index.tsx` now `require()` these
      locally; confirmed zero remaining references to the Vercel URL via
      `grep -rn "vercel-storage"` (no matches). This also resolves the
      "placeholder generated icon" item that was previously in Known
      gaps below — these are the real brand assets now, not a generated
      "R" mark.
  - `app.json` needed no changes — it already pointed at the correct
    filenames (`icon.png`, `adaptive-icon.png`, `splash-icon.png`,
    `favicon.png`); only the file contents were replaced.
- [x] **`Header.tsx` inline `require('lucide-react-native')`** — removed
      the dead `ArrowLeftIcon` function entirely. It was unused (`Header`
      already imports and uses `ArrowLeft` from the project's own
      `src/components/icons.ts` barrel correctly elsewhere in the file).
- [x] **Verify**: `npx tsc --noEmit` — clean, zero errors. `npx expo
      export --platform ios` / `android` / `web` — all three bundle
      successfully; web export performs real static rendering of all 22
      routes (including every new screen) with no crash. `npx
      expo-doctor` — 19/21 (same 2 checks fail as before this session,
      both network calls to Expo's remote validation servers blocked by
      this sandbox's allowlist — not project issues, confirmed identical
      to the pre-existing documented state below).
- [x] PROGRESS.md updated (this section), project re-zipped, handed back.

## Session summary

Fixed the reported crash (root-caused via reading `expo-router/ui`'s own
source rather than guessing), found and fixed one additional latent bug
in the process (`StyleSheet.absoluteFillObject` doesn't exist in this RN
version — was silently breaking tab-bar blur positioning), wired every
dead-end link in the app to a real destination (5 new screens), replaced
both network-dependent logo references with locally generated brand
assets, and cleaned up one piece of dead code. Verified with `tsc`,
`expo export` on all three platforms, and `expo-doctor` after every
change. Nothing in this pass is a stub or placeholder — every new screen
has real (if mock-backed) content and wiring.

---

## Status: working, typed, bundles clean on iOS + Android + web

This project was converted from a single-file Next.js web mockup
(`app/page.tsx` in the original zip) into a full Expo/React Native app with
expo-router navigation, a proper service/hook data layer, and a complete
design-token theme system. Verified with `npx tsc --noEmit` (zero errors),
`npx expo export --platform ios|android|web` (all three bundle
successfully), and `npx expo-doctor` (19/21 checks pass — the 2 failures
are network calls to Expo's remote validation servers blocked by this
sandbox, not project issues; re-run it in a normal environment to confirm
clean). Every dependency version matches
`node_modules/expo/bundledNativeModules.json` — the manifest Expo itself
ships for SDK 57 — rather than a guessed version range. **`npm install`
(no `--legacy-peer-deps` flag) succeeds cleanly** — this was verified after
a real install failure was reported and fixed; see below.

## What's done

### Structure & navigation
- Full Expo Router file-based navigation: root stack (`app/_layout.tsx`) +
  bottom tab navigator (`app/(tabs)/`) with a custom floating tab bar
  matching the original design (including the raised center "Report" button).
- Screens: splash, login, Home, Updates, Report, Family, Safe places,
  Profile, Chat, Readiness (new), Guidance results (new).
- `NavVisibilityContext` + `useHideTabBar()` hook: Profile and Chat hide the
  bottom tab bar while focused, restore it on navigating away.

### Fixes requested this session (all done)
- App renamed to "ResQ" everywhere (was lowercase "resq") — see
  `src/components/Logo.tsx`.
- Safe places header now shows the profile icon, not a back arrow
  (`app/(tabs)/safe.tsx` — it's a primary tab, not a drill-down screen).
- "Report an incident" button is centered (`app/(tabs)/report.tsx`,
  `styles.centeredButtonRow` wraps a full-width button).
- After submitting a report, the success screen offers "See guidance for
  this," which opens `app/guidance-result.tsx` — a new page with
  do-this-now / avoid / why / sources content for the reported hazard type(s).
- Tapping the green readiness card on Home opens `app/readiness.tsx` — a new
  page with a checklist of what's done, what's left, and "good things to do
  next" (disaster-prep guidance), not just a percentage.
- Dark-mode contrast bug fixed: the original CSS had `color: brandDeep` text
  rendered on a `featuredIconBg` fill in dark mode — both dark green,
  unreadable. Fixed by giving every "on a colored surface" case its own
  pre-computed contrast token (`onBrand`, `onDanger`, `featuredIconFg`,
  etc.) in `src/theme/colors.ts`, for both palettes.
- Removed the "Prepared" status pill with the green dot from Home.

### No hardcoded colors
Audited and eliminated every literal hex/rgba/named color outside
`src/theme/colors.ts`. Every color anywhere in the app now comes from
`useAppTheme().colors`. Added missing tokens as needed (`blueSoft`,
`purpleSoft`, `onBrandBorder`, `onBrandCard`, `mapPinRing`, `controlThumb`,
etc.) rather than inlining values at the call site.

### Service/hook architecture for RAG readiness
Built a full `screen → hook → service → (mock | real API)` layering — see
the "Architecture" section in `README.md` for the complete explanation.
Short version:
- `src/config/env.ts` — one flag (`useMockData`) driven by
  `EXPO_PUBLIC_API_BASE_URL` / `EXPO_PUBLIC_USE_MOCK_DATA` decides mock vs.
  real for every service.
- `src/services/apiClient.ts` — shared fetch wrapper (timeouts, JSON,
  consistent `ApiError`, a marked spot for future auth header injection).
- One service per domain: `updatesService`, `familyService`,
  `safePlacesService`, `guidanceService` (RAG), `reportService`,
  `chatService` (RAG, streaming-shaped), `readinessService`,
  `profileService`.
- One hook per domain in `src/hooks/`, all screens consume hooks only —
  never services or mock data directly.
- `src/types/index.ts` expanded with RAG-shaped types: `RagSource`
  (citation shape shared by guidance, chat, and updates),
  `DisasterGuidance` (with `sources` + `confidence`), `ChatStreamEvent`
  (token/sources/done/error), `ChatMessage` (with `role`, `sources`,
  `pending`).
- Mock data split into one file per domain under `src/data/` (was one
  `demoData.ts` monolith before this pass).

### Icon library fixes
`lucide-react-native@0.475.0` renamed several icons from older versions
(`AlertTriangle` → `TriangleAlert`, `Home` → `House`, `MoreHorizontal` →
`Ellipsis`, `AlertCircle` → `CircleAlert`). All icon imports go through a
single barrel file, `src/components/icons.ts`, which re-exports under the
original friendly names — so this is the only file to touch if a future
lucide upgrade renames something again.

### Dependency version fixes
The original `package.json` I drafted had several non-existent version
pins (npm registry rejected them) and, more importantly, paired
`expo@~57.0.20` with `react-native@0.87.1` — **wrong pairing**. Expo SDK 57
targets **React Native 0.86**, confirmed via Expo's own SDK 57 changelog.
0.87.1's stricter `package.json` `exports` map broke `@expo/metro-config`'s
internal `rn-get-polyfills` resolution, which only showed up when actually
bundling (not in `tsc`).

A follow-up audit went further: rather than guessing version ranges,
every dependency now matches `node_modules/expo/bundledNativeModules.json`
exactly — the manifest Expo itself ships listing the precise version of
every native package validated against SDK 57 (`react-native@0.86.3`,
`react-native-reanimated@~4.5.1`, `react-native-worklets@0.10.1`,
`react-native-screens@~4.26.0`, `react-native-safe-area-context@~5.7.0`,
`react-native-svg@15.15.4`, `@react-native-async-storage/async-storage@2.2.0`,
and every `expo-*` package pinned to the SDK-aligned `~57.0.x` scheme Expo
switched to). Verified with `npx expo-doctor`: 19/21 checks pass, including
"packages match versions required by installed Expo SDK" and "Expo SDK
versions affected by Hermes V1 regressions" (the 2 failing checks are
network calls to Expo's remote validation servers, blocked by this
sandbox's network allowlist — not project issues). Both
`npx expo export --platform ios` and `--platform android` succeed cleanly.

### Tab bar rebuilt on the current recommended API (took three attempts)
The custom floating tab bar originally used `expo-router`'s
`<Tabs tabBar={renderProp}>` pattern, which is built on `@react-navigation/
bottom-tabs` under the hood — the *legacy* approach. Two problems: it caused
a real TypeScript error from version skew between expo-router's internal
copy of `@react-navigation/bottom-tabs` types and the separately-installed
package, and — more importantly — Expo dropped support for importing
`@react-navigation/*` directly in app code as of SDK 56, favoring
`expo-router/ui`'s headless `Tabs`/`TabList`/`TabTrigger`/`TabSlot`
components for fully custom tab bars instead. `@react-navigation/native`
and `@react-navigation/bottom-tabs` were removed from `package.json`
entirely as part of this — nothing in the app imports them.

Getting the `expo-router/ui` version actually working took three passes,
because `<Tabs>` discovers its routes in a way that's stricter than it
first appears:

`<Tabs>` walks its own `children` prop with React's `Children.forEach` —
on the **unrendered element tree**, before any component function runs.
That walk only recurses into a plain `<Fragment>` or an actual `<TabList>`
element. Any other element type in between is opaque to it and gets
silently skipped — which drops every tab and throws *"Couldn't find any
screens for the navigator"* at runtime. Two attempts hit this:

1. First attempt put the whole tab bar (`TabList` + `TabTrigger`s) inside a
   separate `<BottomTabBar />` component, rendered as `<Tabs><TabSlot /><BottomTabBar /></Tabs>`.
   `BottomTabBar` is a custom component, not a `Fragment`/`TabList`, so the
   walk stopped there and never saw the `TabTrigger`s inside it. This
   passed `tsc` and even `expo export` for iOS/Android (which only bundle
   code, they don't execute the component tree), so it looked fine until
   actually run with `expo start`.
2. Second attempt inlined `<TabList>`/`<TabTrigger>` correctly inside
   `<Tabs>`, but wrapped `<TabList>` in a plain `<View>` for absolute
   positioning — `<Tabs><TabSlot /><View><TabList>...</TabList></View></Tabs>`.
   Same problem: `View` isn't a recognized wrapper type either, so the walk
   stopped one level higher this time and still found nothing.
3. Working version: `<TabList>` is a **direct child of `<Tabs>`** with no
   wrapper, and every `<TabTrigger asChild>` is a **direct child of
   `<TabList>`**. The positioning that would have gone on a wrapper `View`
   (`position: 'absolute'`, `left`/`right`/`bottom`) goes directly on
   `TabList`'s own `style` prop instead — `TabList` renders as a plain
   `View` under the hood (see `expo-router/ui`'s `TabList.js`, it forwards
   `style` straight through), so this works with no visual difference.
   `TabTrigger`'s `asChild` still hands focus/press state to a
   custom-styled button (`TabButton`/`ReportTabButton` in
   `src/components/TabBarButtons.tsx`) via Radix's `Slot` — that part *is*
   safe to keep in a separate file, since it's a runtime prop-merge, not
   part of the static discovery walk. Only the `Tabs`/`TabList`/`TabTrigger`
   structure itself has to stay inline in `app/(tabs)/_layout.tsx`.

**This was verified by actually rendering it**, not just bundling:
`npx expo export --platform web` performs real static rendering (not just
bundling) for each route, and the output HTML for `/(tabs)` contains all
five tab labels ("Home", "Updates", "Report", "Family", "Places") with no
trace of the discovery error — confirming the fix at the same level of
rigor that caught the original bug (a user actually running `expo start`).
iOS and Android bundles were also re-verified clean after this change.

If this file is touched again: don't extract the `Tabs`/`TabList`/
`TabTrigger` structure into a separate component, and don't wrap `TabList`
in a positioning `View` — style `TabList` directly instead.

### Real `npm install` failure, found and fixed
Everything above had only been verified with `npm install --legacy-peer-deps`
in this sandbox. Running a plain `npm install` on a real machine (Windows,
this case) surfaced a genuine peer-dependency conflict that
`--legacy-peer-deps` had been silently papering over:
`lucide-react-native@0.475.0`'s peer dependency only allows
`react@^16.5.1 || ^17.0.0 || ^18.0.0` — it does not list React 19 at all,
which this project uses (`react@19.2.3`). npm's default (non-legacy)
resolver correctly refused to install rather than produce a broken tree.

Fixed by bumping `lucide-react-native` to `^0.525.0` — confirmed via the
registry as the first version whose peer range includes
`^19.0.0`. Also bumped `@types/react` from `~19.1.10` to `~19.2.18` to
clear a related (non-fatal, but worth silencing) `ERESOLVE overriding peer
dependency` warning from `@react-native/virtualized-lists` (a react-native
dependency) wanting `@types/react@^19.2.0`. Every icon name used in
`src/components/icons.ts` was re-verified against the new
`lucide-react-native` version's actual exports before making the change.

**Verified this actually fixes it, not just theoretically**: reinstalled
from scratch with plain `npm install` (no flags) — zero errors, only the
same unrelated `uuid@7.0.3` deprecation notice every install produces. The
separately-reported `tsconfig.json` error ("File 'expo/tsconfig.base' not
found") was a downstream symptom of the failed install, not a distinct
bug — `node_modules/expo` never existed to extend from. It resolves as
soon as `npm install` succeeds.

### Placeholder assets
Generated simple brand-color "R" mark PNGs for `icon.png`,
`adaptive-icon.png`, `splash-icon.png`, `favicon.png` under
`assets/images/` (none existed before — app.json referenced missing
files). These are functional but generic — replace with real branding
before shipping.

## Known gaps / suggested next steps

- **Auth is a stub.** `app/login.tsx` accepts anything and always succeeds.
  Needs a real `authService` + token storage (a spot for the auth header is
  already marked in `apiClient.ts`).
- **Location isn't wired up yet.** `safePlacesService.fetchSafePlaces`
  already accepts `{ latitude, longitude }`, and `expo-location` is
  installed, but `app/(tabs)/safe.tsx` doesn't request device location or
  pass coordinates through — it's still using the no-args mock-friendly
  call. Next session: add a permission request + `Location.getCurrentPositionAsync`
  call in a small `useDeviceLocation()` hook, feed it into `useSafePlaces()`.
- **Real app icons needed** before any store submission — current ones are
  a generated placeholder.
- **No test suite yet.** The service layer is unit-test-friendly (mock
  `fetch`, assert on `config.useMockData` branching) — worth setting up
  Jest + `jest-expo` as a first follow-up, being mindful of the
  `jest-expo`/`@react-native/jest-preset` peer-dependency mismatch that
  has been reported against SDK 57 (may need an `overrides` entry in
  `package.json` if it recurs — see comments in this session's research).
- **`react-native-web` is installed** and web export now works cleanly
  too (`npx expo export --platform web` succeeds, 17 static routes). The
  earlier failure in this session turned out to be the `react-native@0.87.1`
  mispairing described above, not a web-specific issue — it went away once
  the dependency versions were corrected to match `expo`'s
  `bundledNativeModules.json` exactly.

## Decisions worth knowing about

- Went with hand-rolled `useAsync`/hook pattern instead of adding
  `@tanstack/react-query` — kept the dependency footprint small for a
  project that doesn't have a backend yet. If real caching/retry/
  background-refetch semantics become important once the backend exists,
  swapping the internals of `src/hooks/useAsync.ts` for a `react-query`
  wrapper is a contained change (call sites use `{ data, loading, error,
  refresh }`, which maps cleanly onto `useQuery`'s return shape).
- Chat streaming assumes the backend will send newline-delimited JSON
  events matching `ChatStreamEvent`. If the real backend uses standard SSE
  (`data: {...}\n\n` framing) instead, only the reader loop inside
  `streamChatReply` in `src/services/chatService.ts` needs to change — the
  event shape and the hook consuming it stay the same.

## Session: UI bug fixes — header clipping, tab bar layout, theme modes, logout

Four issues reported from real-device screenshots (iPhone), plus a question
about Expo Go's loading screen. All were reproduced by reading the code
against the screenshots (no device/simulator available in this sandbox —
see "How this was verified" below), fixed, and reasoned through carefully
since nothing here could be run end-to-end.

### 1. Header clipped behind the status bar / notch

`src/components/Header.tsx` had a **fixed** `height: 60` while also adding
`paddingTop: insets.top + 10`. On any device with a tall top inset (notch
or Dynamic Island, roughly 47-59pt), that padding alone could approach or
exceed the fixed height, squeezing the avatar/logo/bell row up against —
or behind — the status bar. This matches the reported screenshot exactly
(home screen's header + "Good morning, Alex" greeting looked squeezed).

Fixed: the header's height is now derived from the same `insets.top` value
the padding uses (`insets.top + HEADER_CONTENT_HEIGHT`, a new constant),
and the content row is bottom-aligned (`alignItems: 'flex-end'` +
`paddingBottom: 10`) instead of vertically centered against a padded box.
This means the content row always sits a fixed 10px above the bottom of
the header regardless of how tall the safe-area inset is — it can't be
squeezed by a fixed height again on any device.

### 2. Tab bar: icon/label side-by-side instead of stacked, Report button overlap

From the screenshot, the tab bar showed "Home" text next to the house icon
instead of below it, and the raised circular Report button's shadow/circle
visually overlapped neighboring tab labels and page content above the bar.

`src/components/TabBarButtons.tsx`'s `.tab` style relied on React Native's
column flex-direction default rather than setting it explicitly — added
`flexDirection: 'column'` explicitly as a safeguard (belt-and-suspenders;
no other cause for the row-like layout was found in the code itself, so if
this recurs after this fix, it's worth checking whether a stale Metro
bundle was running rather than the current source).

The Report button's raised circle used `marginTop: -26` to pop it above
the bar's top edge (a deliberate raised-FAB look) — with no `overflow:
hidden` on the bar (correct, since that would also clip the iOS shadow),
that popped-up circle was free to visually collide with whatever page
content sat just above the tab bar. Reduced to `marginTop: -18` so the
circle's overhang stays inside the bar's own top padding rather than
spilling past it, and added `zIndex: 2` to `reportTab` so it always
renders above its row siblings rather than depending on DOM order.

### 3. Tab bar position

Lowered the bar per explicit feedback: `bottomOffset` in
`app/(tabs)/_layout.tsx` changed from `Math.max(insets.bottom, 10) + 6` to
`Math.max(insets.bottom, 10) - 4`. Still clears the home-indicator/gesture
area on every device (verified against typical inset values), just sits
closer to the bottom edge than before.

### 4. Theme: light/dark/system modes, light-by-default

`src/theme/ThemeContext.tsx` previously only exposed a boolean `isDark` +
`setIsDark`, defaulting to whatever `useColorScheme()` (the raw device
setting) returned — so a phone set to dark mode made the whole app dark by
default, with no in-app way to pick "always light" vs "always dark" vs
"follow system" as three distinct choices.

Rewrote it around a `ThemeMode = 'light' | 'dark' | 'system'`:
- Defaults to `'light'` regardless of device scheme.
- Only resolves to dark when the mode is explicitly `'dark'`, or `'system'`
  while the device itself is in dark mode.
- Persists the choice to AsyncStorage (`@resq_theme_mode`) so it survives
  app restarts; still exposes `isDark` (now derived, not independently
  settable) for the handful of call sites that only need a boolean
  (status bar style, tab bar blur tint).
- `app.json`'s `userInterfaceStyle` changed from `"automatic"` to
  `"light"` so native chrome matches the same light-by-default choice
  before any JS runs.
- `app/index.tsx`'s startup video previously picked light/dark based on
  raw `useColorScheme()` — switched to the app's own resolved `isDark`
  from `useAppTheme()` so the splash video always matches what the app
  actually opens into.

`app/profile.tsx`'s single dark-mode toggle row was replaced with a
3-option segmented control (Light / Dark / System, each with a Sun / Moon
/ MonitorSmartphone icon from `lucide-react-native`, added to
`src/components/icons.ts`). Lives under a new "APPEARANCE" section label,
separate from the existing settings list.

### 5. Logout only navigated, never actually logged out

Root cause: `app/profile.tsx`'s sign-out button called
`router.replace('/login')` directly and never called
`AuthContext.logout()` at all — `isLoggedIn` stayed `true` in storage and
in memory. Since expo-router's `Stack` still had `(tabs)` sitting in
navigation history underneath the newly-replaced `/login` screen, a
back-gesture (or, on a device with no visible back button, the plain
home-indicator swipe-back gesture the user described) could pop right back
into the authenticated app — because nothing had actually ended the
session.

Fixed properly rather than papering over it with a one-line `logout()`
call plus a manual `router.replace`, because that alone doesn't guarantee
the stack is clean (a `.replace` only swaps the *current* screen, it
doesn't touch anything already pushed underneath it). Instead,
`app/_layout.tsx` was restructured around expo-router's `Stack.Protected`
(stable since SDK 53 — this project is on SDK 57, well within support):

- Three `Stack.Protected` groups, matching the three real states in
  `AuthContext` (`isLoggedIn`, `hasCompletedOnboarding`):
  1. `guard={!isLoggedIn}` → `login`, `register`
  2. `guard={isLoggedIn && !hasCompletedOnboarding}` → `onboarding`
  3. `guard={isLoggedIn && hasCompletedOnboarding}` → `(tabs)`, `profile`,
     `chat`, and every other authenticated screen
- Per Expo's own docs: "When a screen's guard is changed from true to
  false, all of its history entries will be removed from the navigation
  history" — so the instant `logout()` flips `isLoggedIn` to `false`,
  every authenticated screen (not just the current one) is dropped from
  history, and the first screen of the newly-active group (`login`, listed
  first in its group) becomes the landing screen. There is nothing left
  in the stack for a back-gesture to return to — this is the actual fix,
  not a manual redirect racing against navigation state.
- `app/profile.tsx`'s sign-out handler is now just `await logout()` — no
  navigation call needed, since the root layout re-renders with the
  correct group the moment auth state changes.
- Verified this restructure doesn't break the registration →
  onboarding → tabs flow or the guest-access path (`loginAsGuest()` sets
  both `isLoggedIn` and `hasCompletedOnboarding` to `true` immediately, so
  guests still land straight in the tabs group, same as before) — traced
  every `router.replace`/`router.push` call in `login.tsx`, `register.tsx`,
  and each `onboarding/*.tsx` screen against the new guard conditions to
  confirm each one lands in a group where the target screen actually
  exists at the moment the call fires.
- `RootStack` now also has a `useAuth()` `isLoading` guard (`return null`
  while hydrating) so a logged-in user restarting the app never sees a
  flash of the login screen before persisted state loads.

`__tests__/smoke.test.tsx`'s `expo-router` mock got a `dismissAll:
jest.fn()` added defensively while iterating on this (an earlier draft of
the fix called `router.dismissAll()` manually before settling on
`Stack.Protected` instead, which needs no such call) — harmless to leave
in as insurance against a future regression back toward manual dismissal.

### 6. "Green logo while loading in Expo" — not a fixable app bug

Traced this all the way to pixel data before concluding it's not
something `app.json` or app code controls. Every icon/splash asset in the
repo was inspected directly (`PIL.Image.getpixel`, not just eyeballing
thumbnails):
- `assets/images/icon.png` — opaque white background, black mark. Correct.
- `assets/images/icon-dark.png` — opaque near-black background, white
  mark. Correct.
- `assets/images/adaptive-icon.png` — transparent background, black mark
  only (no teal or any other color anywhere in the file).
No teal/green pixel exists in any shipped asset. The loading screen shown
(a teal rounded-square icon card, "ResQ" label, "Loading NN.NN%" bar) is
Expo Go's own native dev-client chrome while it bundles the JS — it is not
part of this app's rendered output and isn't configurable from `app.json`
or app code. This was explained to the user rather than "fixed" with a
change that wouldn't actually do anything.

### Cleanup

Removed `src/components/BottomTabBar.tsx` — an orphaned file from the
first (abandoned) attempt at the custom tab bar, documented earlier in
this file's "Known structural gotcha" section. Confirmed zero imports
referenced it anywhere before deleting.

### How this was verified

No device, simulator, or `node_modules` were available in this sandbox
(`npm install` failed — no registry access; see below), so nothing here
could be run end-to-end. Verification instead relied on:
- Reading every touched file back in full after editing, checking prop
  flow and control flow by hand against the reported screenshots.
- A standalone `tsc --noEmit` pass (using the globally-installed
  TypeScript, with a throwaway tsconfig pointing only at the touched
  files) to catch real syntax/type errors independent of the missing
  `node_modules` — every error it reported was a pre-existing "Cannot find
  module" from the missing install (confirmed by checking the same errors
  appear on untouched files like `PrimaryButton.tsx` too), not something
  introduced by these changes.
- Brace/paren balance checks on every edited file.
- Tracing every `router.replace`/`router.push` call touching auth state
  transitions against the new `Stack.Protected` guard conditions by hand,
  screen by screen, rather than assuming the restructure was safe.
- Cross-checking the `Stack.Protected` approach itself against Expo's
  current docs (docs.expo.dev/router/advanced/protected, dated Feb 2026 —
  after this app's SDK 57 release) rather than relying on training data,
  since this is exactly the kind of framework-version-specific behavior
  that goes stale.

**Recommended next step for whoever picks this up**: install dependencies
and actually run `expo start` on a real device/simulator to confirm all
of the above visually, especially the tab bar overlap fix (its exact pixel
overlap couldn't be reproduced/measured here, only reasoned about from the
screenshot and the style values) and the `Stack.Protected` logout flow
end-to-end (sign out, then try swiping back). The `npm install` failure in
this session was `403 Forbidden` fetching `zod` from the npm registry —
sandbox network restriction, not a real dependency problem; a normal
machine should install cleanly per the dependency versions already fixed
in an earlier session (see the `lucide-react-native`/`@types/react`
section above).

## Known gaps / suggested next steps (carried forward + updated)

- **Auth is still a stub** — `login()`/`register()` accept anything and
  always succeed; `Stack.Protected` now correctly gates navigation on
  `isLoggedIn`/`hasCompletedOnboarding`, but the underlying credential
  check itself is unchanged from before this session.
- **Location isn't wired up yet** — unchanged from before this session,
  see the entry above.
- **Real app icons** — the current `icon.png`/`icon-dark.png` pair is
  correct and opaque (verified this session), but still worth a final
  design pass before store submission.
- **No test suite run this session** — `__tests__/smoke.test.tsx` exists
  and was updated (see above) but couldn't actually be executed here
  (no `node_modules`). Run `npm test` on a real machine to confirm the
  `Stack.Protected` refactor and theme changes don't break any of the
  existing screen-mount assertions.

## Session: actual root cause of the tab bar layout bug found

The previous session's tab bar fix (`flexDirection: 'column'` on `.tab`,
raised-button `marginTop` adjustment) did not fix the reported bug — the
same screenshot (icon and label side-by-side, Report button overlapping
neighbors) came back. That ruled out my first theory and forced a proper
investigation instead of another guess.

### Root cause

`TabButton` and `ReportTabButton` in `src/components/TabBarButtons.tsx`
spread `{...rest}` **after** their own `style` prop:

```jsx
<Pressable
  style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
  {...rest}   // <-- rest.style, if present, wins — applied last
>
```

In JSX, when the same prop appears twice in an element (once explicitly,
once via a later spread), the later one wins. `rest` here is everything
`TabTrigger`'s `asChild` Slot forwards to the wrapped component, and
`expo-router/ui`'s `TabTrigger` **does** forward its own `style` through
that slot (confirmed against Expo's own current official reference
implementation at docs.expo.dev/router/advanced/custom-tabs, which
explicitly separates `{ icon, children, isFocused, ...props }` and then
applies its own `style` **after** `{...props}` for exactly this reason).
So `rest.style` was silently overwriting `styles.tab`/`styles.reportTab`
in their entirety — wiping out `flexDirection: 'column'`, `alignItems`,
`gap`, all of it — which is what actually produced the side-by-side
icon/label layout and the Report button's overlap. The `flexDirection:
'column'` fix from the previous session was real and correct, it just
never had a chance to apply, because the whole style object it lived in
was being discarded before render.

**Fix**: reordered both components to spread `{...rest}` first, then
apply `style` last — matching Expo's own canonical `TabButton` example
exactly. `style` no longer tries to merge with whatever `rest.style`
might contain; it deliberately replaces it, same as the official
reference does. The incoming `style` prop is destructured out (as
`_incomingStyle`, unused) purely so it can't leak into `...rest` and get
spread onto the `Pressable` a second time by accident.

### Tab bar position, again

Lowered further per repeated feedback: `bottomOffset` went from
`Math.max(insets.bottom, 10) + 6` (original) → `- 4` (previous session)
→ `- 8` (this session). Still floored so it can't collide with the
home-indicator area on any device.

### Considered and rejected: native tabs / full redesign

The request also asked about redesigning the tab bar or using "the Apple
one." Looked into `expo-router/unstable-native-tabs` (Expo's native
system-tab-bar wrapper) as an alternative — decided against migrating to
it:
- It's explicitly alpha status per Expo's own docs ("Native tabs is in
  alpha... API is subject to change"), not something to build a real app
  on.
- It would mean losing the app's actual design — the floating rounded
  pill bar, frosted blur, and raised circular Report button — since
  native tabs render the platform's flat system tab bar with no support
  for that kind of custom raised element.
- The actual bug turned out to be a genuine, fixable code defect (prop
  order), not a structural limitation of the custom `expo-router/ui`
  approach — so a full redesign wasn't the right-sized fix for what was
  actually wrong.

### How this was verified

Same sandbox constraints as before (no device/simulator, no working
`npm install`). This time, rather than re-guessing from the screenshot
alone, the fix was cross-checked against Expo's own current, official
reference `TabButton` implementation (fetched directly from
docs.expo.dev/router/advanced/custom-tabs) — which independently
confirmed both the prop-ordering root cause and that `flexDirection:
'column'` (not `'row'`) is the correct, intended layout. Re-ran the
standalone `tsc --noEmit` pass and brace/paren balance check on both
touched files; no errors beyond the same pre-existing missing-`node_modules`
noise seen in every previous check.

**This one genuinely needs on-device verification before trusting it
further** — two attempts at this same bug from reasoning alone is a sign
the remaining risk is in things that only show up at runtime (Slot
merge behavior, exact `TabTrigger` prop shape) that couldn't be
confirmed with certainty by reading source `.d.ts`-free in this sandbox.
The fix now matches Expo's own shipped example verbatim, which is about
as much confidence as static reading can provide — but the recommended
next step is unchanged: `npm install` + `expo start` on a real device.
