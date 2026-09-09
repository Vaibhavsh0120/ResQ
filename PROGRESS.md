# ResQ — Master Roadmap & Progress

This file has two parts from here on:

1. **Master Roadmap** (below) — a full plan, written 2026-09-08, for taking
   ResQ from its current UI-mockup-with-real-architecture state to an
   enterprise-grade, Play-Store-ready app. Nothing in the 2026-09-08 pass
   touched code — it was a planning session. Work through the phases in
   order; each item is a checkbox so progress can be tracked directly in
   this file. When you finish an item, check it off **and** add a short
   dated note under it (one or two lines: what you did, any decision
   made) — don't just delete the line, this file is the project's memory.
2. **Archive** (bottom of file) — every prior session's notes, preserved
   as-is.

**Starting assumptions this plan was built on** (confirm these still hold
before assuming the plan does too):
- Launch market is **India first**. Emergency number, privacy law, and
  first-localization-language choices below assume this.
- There is **no backend yet** — this mobile repo is the entire project
  today. Phase 3 below is itself a "build a backend from scratch" plan,
  not an integration ticket.
- Demo/mock data stays in place and should **keep working** throughout —
  every phase before Phase 4 is designed to need zero backend.

---

## 1. What "done" means for this app

An enterprise, Play-Store-ready release of a disaster-safety app means, at minimum:
- Nothing on screen is decorative — every visible button/toggle/link does
  the real (or realistically locally-simulated) thing it claims to do.
- Nothing on screen shows a value that isn't real — no hardcoded names,
  dates, counts, or locations standing in for actual state.
- The app's actual promise (help in an emergency: SOS, medical info to
  responders, family circle, guidance) works end-to-end, today, without
  waiting on a backend.
- It meets Play Store policy (account deletion, data safety disclosure,
  privacy policy, signed release build) and India's DPDP Act 2023.
- Demo data can be swapped for a real backend one domain at a time without
  touching a single screen or hook — this part is **already true** of the
  current architecture and should be preserved, not redone.

---

## 2. Current-state audit (2026-09-08)

### 2.1 What's genuinely solid — keep, extend, don't rebuild
- The `screen → hook → service → (mock | real)` layering (`src/hooks/`,
  `src/services/`, `src/config/env.ts`). This is exactly the right shape
  for "keep demo data, stay switch-ready" and should be the pattern every
  new feature below follows.
- `src/theme/colors.ts` + `ThemeContext` — zero hardcoded colors, real
  light/dark contrast tokens. Keep this discipline for every new screen.
- The auth-state routing in `app/_layout.tsx` (`Stack.Protected` guards) —
  correctly clears history on login/logout/onboarding transitions.
- TypeScript typing in `src/types/index.ts`, including the RAG-shaped
  types (`RagSource`, `DisasterGuidance`, `ChatStreamEvent`) — a real
  backend can be built against these shapes as a contract.
- `guidance-result.tsx`'s sources + confidence-badge rendering — this is
  the pattern to copy wherever else sources should appear (chat, updates).
- Splash screen (`app/index.tsx`) already has tap-to-skip and a fallback
  timer if the video fails to fire an end event — good defensive UX,
  don't lose this in any redesign.

### 2.2 Dead UI — exists visually, does nothing when touched
Every one of these must be wired up or removed before *any* build (demo
or real) ships to a real user — a dead button in a safety app is worse
than a missing one.
- [x] `src/components/Header.tsx` — the default Bell "Notifications" action
  (`onPress={() => {}}`) on every screen that doesn't override `action`.
  **2026-09-09**: Built a real `app/notifications.tsx` destination
  (local-storage-backed list, read/unread state, mark-all-read) plus
  `src/services/notificationsService.ts` / `src/hooks/useNotifications.ts`
  following the existing screen→hook→service pattern. Bell now
  `router.push('/notifications')`. Also used this pass to make `Header`
  auto-derive avatar initials from the signed-in user instead of
  defaulting to `'AC'` — see §2.3.
- [x] `app/place-detail.tsx` — "Directions" and "Call ahead" buttons have
  no `onPress` at all.
  **2026-09-09**: Directions opens a Google Maps deep link (uses
  lat/long when available, falls back to a name search). Call ahead
  opens `tel:`. Added `phone` to `SafePlace` type + mock data
  (placeholder India/Delhi-area numbers and coordinates). Both buttons
  disable + gray out when the place has no phone on file.
- [x] `app/family-member.tsx` — "Call", "Message", "Locate" buttons have
  no `onPress` at all.
  **2026-09-09**: Call → `tel:`, Message → `sms:` (platform-aware `?`
  vs `&` separator), Locate → opens a Google Maps search for the
  person's last-known-location string (no live-tracking backend exists
  yet, so this shares what we have rather than pretending to track).
  Added `phone`/`lastKnownLocation` to `FamilyMember` type + mock data.
  Buttons disable when no phone is on file, with a note explaining why.
- [x] `app/privacy-security.tsx` — "Download my data" and "Delete my
  account" rows have no `onPress` at all (these are also a Play Store
  compliance requirement — see §2.7).
  **2026-09-09**: Built `src/services/localDataService.ts` —
  `exportLocalData()` reads every AsyncStorage key via `getAllKeys()`
  (not a hardcoded list, so it stays correct as new features add their
  own storage keys) and `wipeLocalData()` clears all of it. "Download my
  data" shares the JSON export via the OS share sheet (`Share` from React
  Native core — no new dependency needed). "Delete my account" opens a
  proper in-app confirm dialog (matching the app's existing custom-modal
  style rather than a native `Alert.alert`, which doesn't exist anywhere
  else in this codebase), then wipes storage and calls the existing
  `logout()` — no manual navigation needed, since `logout()` flips
  `isLoggedIn` and the root layout's `Stack.Protected` guard handles the
  redirect on its own (same pattern `profile.tsx`'s sign-out button
  already relies on). Both actions have loading and error states.
- [x] `app/login.tsx` — "Forgot?" password link has no action.
  **2026-09-09**: Built `app/forgot-password.tsx` — a locally-simulated
  reset flow (email validation, simulated send delay, confirmation
  state) registered in the logged-out `Stack.Protected` group. Once real
  auth exists, only the request itself needs to change.
- [x] `app/login.tsx` / `app/register.tsx` — "Continue with Google" calls
  the exact same `onLogin`/local stub as the plain sign-in button.
  **2026-09-09**: Removed the button (and the divider) rather than
  building throwaway OAuth scaffolding with no client ID/backend behind
  it — decided a missing button is more honest than a fake-working one.
  Real Google sign-in via `expo-auth-session` is still open, tracked
  under Phase 3 (needs a backend to validate against anyway).
- [x] `app/chat.tsx` — tapping a row in the "Previous chats" drawer just
  closes the drawer.
  **2026-09-09**: `mockChat.ts` now holds full per-thread message
  arrays; added `fetchChatThreadMessages` to `chatService.ts` and
  `loadThread`/`activeThreadId` to `useChat`. Tapping a thread now loads
  its real messages and highlights it as active in the drawer. Also
  fixed the hardcoded "Hi Alex" welcome message to use the signed-in
  user's first name (`buildWelcomeMessage`).
- [x] `app/readiness.tsx` — checklist rows are read-only `View`s, not
  `Pressable`s; there's no way to manually mark something done.
  **2026-09-09**: Rows are now `Pressable` with proper
  `accessibilityRole="checkbox"`. Added `toggleReadinessItem` to
  `readinessService.ts`, which also recomputes `score` as % of checklist
  items done (so the ring stays honest instead of drifting from the
  visible checklist) — flagged in the code as a placeholder scoring
  rule until a backend computes readiness from more than the checklist.
- [ ] `.github/workflows/build-release.yml` — only builds an **unsigned
  debug APK**. **Not done this session** — this is really a Phase 2 item
  (needs `eas.json` + a signing-credentials decision first); left for
  when that phase is picked up rather than half-done here.

### 2.3 Hardcoded/fake state (only "works" because mock data happens to line up)
- [x] `app/(tabs)/index.tsx` — greeting hardcoded `"Good morning, Alex"`
  and the eyebrow hardcoded `"TUESDAY, 24 SEPTEMBER"`.
  **2026-09-09**: Added `src/utils/format.ts` (`timeOfDayGreeting`,
  `todayEyebrow`, `initialsFromName`). Greeting now reads the signed-in
  user's first name and real time-of-day; eyebrow shows the real
  current date, locale-formatted.
- [x] `app/(tabs)/index.tsx` — "Check on family" subtitle hardcoded
  `"3 people in your circle"`.
  **2026-09-09**: Now reads `members.length` from `useFamily()`, with
  proper singular/plural/loading/empty copy (`familyCircleSubtitle`
  helper).
- [x] `app/(tabs)/report.tsx` — success screen hardcoded `"Thank you,
  Alex."`; location field defaulted to `"Near Riverside Park"`.
  **2026-09-09**: Success message now uses the real first name (or a
  guest-safe generic "Thank you." — see `thankYouMessage`). Location
  field now seeds from the shared `useCurrentArea()` hook (see §2.3
  "Riverside" entry below) instead of a hardcoded street name — still
  editable by the user, since there's no device-location hook yet
  (that's Phase 1).
- [x] `app/profile.tsx` — avatar hardcoded `"AC"`; stat cards hardcoded
  `"82%"`, `"3"`, `"4"`.
  **2026-09-09**: Avatar now uses `initialsFromName(profile.name)` (or
  `'G'` for guests). Stats now read real `useReadiness().score`, real
  `useFamily().members.length`, and a new real "guides read" counter
  (see below) — no more hardcoded numbers.
- [x] `src/components/Header.tsx` — `initials` prop defaulted to `'AC'`.
  **2026-09-09**: `Header` now auto-derives initials from the
  signed-in user via `useAuth()` + `initialsFromName()` unless a screen
  explicitly overrides the prop (kept as an escape hatch, not the
  default path). This fixed the same issue on every `showProfile` tab
  screen (Home, Updates, Family, Safe, Report) in one place rather than
  touching each screen individually.
- [x] `app/(tabs)/family.tsx` — `invite()` always added a fixed
  `"Jamie Lee" / "Friend"` contact; "add someone" card had no real inputs.
  **2026-09-09**: Real name text input, a relation chip-picker
  (Partner/Parent/Sibling/Child/Friend/Other — a simple preset list
  rather than a full picker component, matches the scope of what's
  actually needed here), and an optional phone input. Threaded `phone`
  through `inviteFamilyMember`/`useFamily().invite()`.
- [x] `"Riverside district"` / `"Near Riverside Park"` hardcoded
  independently in 5 places (`updates.tsx`, `safe.tsx`, `family.tsx`,
  `family-member.tsx`, `report.tsx`).
  **2026-09-09**: Added `src/hooks/useCurrentArea.ts`, a thin wrapper
  around `useProfile()` that's now the single source of truth. All 5
  screens read from it: `updates.tsx`/`family.tsx` display it directly;
  `safe.tsx` seeds its already-existing editable "district" search
  field from it (kept the local per-session override — that's a
  sensible existing pattern, just was seeded from a literal before);
  `report.tsx` now seeds its location field the same way; `family.tsx`
  and `family-member.tsx`'s "Riverside district" family-location strings
  became real `lastKnownLocation` fields on each mock family member
  instead. Left alone (correctly, not duplicates of this issue):
  `mockSafePlaces.ts`'s "Riverside Community Hall" (a place's proper
  name) and `mockUpdates.ts`'s "Riverside district" mentions (content
  *about* a place in the feed, not the user's own location claim).
- [x] "Guides read" counter — **flagged in the original audit as not
  existing yet.** **2026-09-09**: Built it — `src/services/
  guidesReadService.ts`, a small AsyncStorage counter incremented once
  per guide actually viewed in `guidance-result.tsx` (guarded with a
  ref against double-counting on retry). Backs the Profile stat above.
  Not wired into readiness "next steps" yet, since those are static
  cards with no drill-in screen currently — noted as a gap, not solved,
  to avoid inventing a new screen outside this session's scope.

### 2.4 The single biggest gap: SOS doesn't exist
**Fixed 2026-09-09 (first Phase 1 slice).** `app/onboarding/emergency.tsx`
and `app/onboarding/location.tsx` both explicitly promise SOS behavior in
their copy — *"Designate contacts who will be immediately alerted with
your live location when you initiate an SOS"*, *"Emergency services
(911/112) will always be connected directly in an SOS"*, *"location data
is encrypted... only broadcast during active SOS alerts."* A real SOS flow
now exists: a prominent red **Emergency SOS** bar sits on Home above the
readiness card (not buried in a menu or folded into the quick-actions
grid), leading to `app/sos.tsx` — a full-screen press-and-hold trigger
(2.5s, cancels cleanly on early release, haptic feedback via
`expo-haptics`) that, once activated, surfaces a **Call 112** button
(`tel:112` — India's unified emergency number, per this plan's launch-
market assumption) and one **Message** button per family member who has a
phone number on file (`sms:`, reusing the exact platform-separator pattern
already built for `family-member.tsx`). Every activation is logged locally
(`src/services/sosService.ts`, AsyncStorage-backed, same shape as
`notificationsService.ts`) and viewable at `/sos-history` (linked from
Profile's settings list, danger-tinted icon so it doesn't read as a routine
row). Runs entirely against `useFamily()`'s existing mock data — no
onboarding-persistence dependency, as this plan's §7 anticipated.
Real `tsc --noEmit` (network was available this session, unlike prior
sessions — see §2.8) and the full smoke suite both pass clean, including
the two new screens added to `__tests__/smoke.test.tsx`.
**Not yet done, deliberately scoped out of this slice:** No local
push/alarm sound, no lock-screen or hardware-button trigger (e.g.
power-button-5x), no server-side fan-out to responders — all of that
needs Phase 3's backend. These are natural follow-ups, not oversights.
(Originally this note also flagged that the SMS body sent only a static
area, not live coordinates — **resolved 2026-09-09, see §2.9**: it now
sends a real Maps link when a GPS fix is available.)

### 2.5 Onboarding is data-loss-by-design
**Fixed 2026-09-09.** Every onboarding screen used to hold everything the
user typed in local `useState` only; finishing onboarding just flipped one
boolean (`AuthContext.completeOnboarding`) and every field was lost. Real
persistence now exists across all five steps:

- **`src/services/onboardingService.ts`** (new) — AsyncStorage-backed
  per-step drafts (personal/medical/location/family/emergency), written on
  each step's Continue *and* Skip (skip means "don't require finishing
  this step," not "discard what's already there"), and loaded back on
  mount so returning to an earlier step pre-fills it. `MedicalProfile` and
  `ProfileData.dob`/`bloodType` (§5) were added to give the personal and
  medical steps somewhere real to write.
- **Two pre-existing services turned out to not persist anything at
  all**, discovered while wiring this up — not an onboarding-specific
  bug, but a real gap affecting the live app too:
  - `familyService.ts` read straight from the static `mockFamily.ts`
    array; `inviteFamilyMember` only mutated `useFamily()`'s in-memory
    React state, so a member added from the **Family tab** (not just
    onboarding) vanished on app restart. Now AsyncStorage-backed,
    seeded from `mockFamily.ts` once, same pattern as
    `notificationsService.ts`.
  - `profileService.ts`'s `updateProfile` just echoed back whatever was
    passed in — an edit from `profile.tsx` was equally lost on restart.
    Now AsyncStorage-backed, plus a new `mergeProfile()` for onboarding
    steps that each only own a slice of the profile.
- **Onboarding's family step and emergency-contacts step used to be two
  separate, overlapping contact lists**, each with its own pre-seeded
  fake person ("Maya Chen" appeared in *both*, "David Chen" only in the
  second). Fixed by unifying them: no separate `EmergencyContact` type
  was added (deliberately — see §6) — instead `FamilyMember` gained an
  `isPrimaryEmergencyContact` flag, and
  `onboardingService.mergeOnboardingContacts()` de-dupes a person entered
  in both steps (matched by phone, falling back to name) before
  `emergency.tsx`'s `handleFinish` writes the merged list into the real
  family circle via a new `familyService.seedFamilyMembers()`. Both
  pre-seeded fake people are gone; each step now starts empty with a
  proper empty-state card and loads its own real draft.
  `seedFamilyMembers()` replaces the untouched `mockFamily.ts` demo data
  on a user's first real completion (tracked via a `SEEDED_KEY` flag so
  this only happens once) rather than appending onboarding's contacts
  onto the demo people — a user finishing onboarding sees their own
  circle, not their circle mixed in with three people they never added.
  If a user adds zero contacts across both steps, the demo circle is
  left as-is (a reasonable fallback for a demo-data app, not an
  oversight).
- **`AuthContext.logout()`** now also clears the onboarding draft (not
  the profile or family circle themselves — those follow the same
  logout-doesn't-wipe-data behavior as everything else in this app),
  so a different user logging in on the same device doesn't inherit a
  previous session's half-finished answers.

Verified: real `tsc --noEmit` and the full smoke suite (26/26, including
all five onboarding screens with their new async load/save effects) both
pass clean. The merge/de-dupe logic in `mergeOnboardingContacts()` was
additionally checked with a throwaway Jest test (written, run, confirmed
correct, then deleted — not part of the permanent suite).

**Not yet done, deliberately scoped out of this pass:** nothing currently
displays the medical profile back to the user post-onboarding (a natural
Phase 1/5 follow-up — a "medical ID" card reachable from Profile or the
SOS confirmed screen, similar to iOS/Android's own Medical ID feature).
`profile.tsx`'s own edit screen doesn't yet surface `dob`/`bloodType`
either — they're optional fields on `ProfileData` so nothing breaks by
their absence, but a user can't currently review or change them after
onboarding without those rows existing there.

### 2.6 Integrations installed but not actually wired
**Partially resolved 2026-09-09 — see §2.9.** Real device location is now
built and wired in. Still true and untouched this pass: no map SDK, no
`expo-notifications`, no crash reporting, no i18n, no `expo-secure-store`.
All remaining Phase 1/5 items.

### 2.7 Compliance / Play Store readiness gaps
**Still true — not touched this session.** No in-app Privacy
Policy/Terms screens, no hosted policy URL, no working account-deletion
path, no Data Safety mapping, no minimum-age decision, no `eas.json`,
placeholder icon/splash still shipped. This is Phase 2 in full — see §7.

### 2.8 Carried forward from the existing archive (still true)
- Auth is a stub — `login()`/`register()` accept anything. Still true;
  this session's fixes (real name/date/greeting) all read the signed-in
  `user` object correctly, they just don't change how that object gets
  populated in the first place.
- `react-query` was deliberately not used — hand-rolled `useAsync`
  instead (documented decision, still fine, and every new hook this
  session — `useNotifications`, `useChatThreads`, `useCurrentArea` —
  follows the same `useAsync` wrapper pattern).
- Chat streaming assumes newline-delimited JSON; unchanged this session.
- No test suite has actually been run this session either — same
  sandbox constraint as prior sessions (no network access to install
  `node_modules`). Verified everything statically instead: brace/paren
  balance check on every touched file, plus a best-effort
  `tsc --noEmit` pass (see below) — zero real type errors found, only
  expected noise from missing `node_modules`/`@types/react` (unresolvable
  imports, and a few false-positive `key`-prop / JSX-children errors that
  a stripped-down non-Expo tsconfig can't correctly type-check; confirmed
  these same false positives also fire on untouched pre-existing code,
  so they're config artifacts, not real issues). Added the two new
  screens (`forgot-password.tsx`, `notifications.tsx`) to
  `__tests__/smoke.test.tsx`'s existing screen lists so they're covered
  whenever the suite can actually run.
- `config.useMockData` is one global flag for every domain — still true,
  still fine for now, still a flagged Phase 4 item.

### 2.9 Real device location
**Fixed 2026-09-09.** `useCurrentArea()` had shipped in an earlier session
as a deliberate stopgap — its own doc comment said "once real GPS location
exists, this is the natural place to prefer it." That gap is now closed:

- **`src/hooks/useDeviceLocation.ts`** (new) — wraps `expo-location`'s
  `requestForegroundPermissionsAsync` → `getCurrentPositionAsync` →
  `reverseGeocodeAsync` sequence (the same one `app/onboarding/
  location.tsx` already used for its one-time home-address snapshot),
  returning live `latitude`/`longitude`/`accuracy` plus a best-effort
  reverse-geocoded `area` string. Deliberately request-based
  (`getCurrentPositionAsync`), not `watchPositionAsync` — nothing in the
  app needs a continuously-updating position today (SOS/Safe places/Report
  all want "where am I right now," not a moving dot); a `refresh()`
  function is exposed for on-demand re-fetching instead. If a real
  live-tracking feature needs a watcher later, that's a distinct hook
  built on this one's permission handling, not a change to this hook's
  contract. Permission is requested automatically on mount, since every
  screen that will call this hook already needs location to do its job —
  there's no separate "ask later" flow to design around.
- **`useCurrentArea()` upgraded**, exactly as its own comment promised:
  now prefers `useDeviceLocation()`'s live reverse-geocoded area, falling
  back to the profile's static home address while a fix is still loading
  or permission was denied. This is a strict upgrade with zero code
  changes needed in the screens that only destructure `{ area }`
  (`updates.tsx`, `family.tsx`) — `latitude`/`longitude` are additionally
  exposed for screens that need real coordinates, not just a place name.
- **`app/(tabs)/safe.tsx`** now passes real coordinates into
  `useSafePlaces()`. **`safePlacesService.ts`**'s mock branch was extended
  so this isn't wiring for its own sake: when coordinates are present, it
  sorts `mockSafePlaces.ts`'s three entries by real great-circle distance
  from the user and rewrites each place's leading "X mi ·" detail text to
  match, instead of silently ignoring the query and always returning the
  same static order. Falls back to the original static order when no fix
  is available, exactly as before.
- **`app/(tabs)/report.tsx`**'s location field now seeds from live GPS
  when available (via `useCurrentArea()`) instead of only the profile's
  home address — no code change was needed here beyond a stale comment
  update, since it already only reads `area`.
- **`app/sos.tsx`**: the SMS body sent to family members and the local SOS
  history log now include a real Google Maps link
  (`src/utils/location.ts`'s `mapsLinkForCoords()`) built from live
  coordinates when a fix is available, falling back to the free-text area
  string exactly as before when it isn't. This is the concrete fix for
  onboarding's `emergency.tsx` copy — "Designate contacts who will be
  immediately alerted with your live location" — which had been a promise
  the app didn't yet keep.

Verified: real `tsc --noEmit` and the full smoke suite (26/26, including
`safe.tsx`, `report.tsx`, and `sos.tsx` with their new location-dependent
code paths) both pass clean.

**Not yet done, deliberately scoped out of this pass:** the map SDK
decision itself (§7) — real coordinates now exist everywhere a map would
need them, but no map view has been built. `FamilyMember.lastKnownLocation`
is still free text only (no lat/long), so "Locate" on `family-member.tsx`
still opens a name-based Maps search rather than a coordinate-based one —
this only matters once family members can share live coordinates, which
has no backend to receive them yet (Phase 3). `useDeviceLocation()`
doesn't cache its last fix across screens/mounts (each screen using
`useCurrentArea()` re-requests independently) — acceptable for now given
how few screens use it, but worth a shared context/store if more screens
adopt it.

---

## 3. The roadmap

No backend exists yet, so phases 0–2 are deliberately backend-free — they
fix what's already broken or missing in the client itself. Phase 3 is
"build a backend from nothing." Phase 4 is the actual cutover. Phases 5–6
are hardening and post-launch.

### Phase 0 — Stop lying to the user
*Goal: every visible control does the real (or locally-simulated) thing it
claims. Nothing shows a fake value. No backend needed for any of this.*

**Status: complete as of 2026-09-09** (session continued from an earlier
checkpoint the same day — see §2.2/§2.3 above for the itemized checklist
and what changed on each pass). One item intentionally deferred to a
different phase, not left undone by mistake:
- [ ] The CI workflow (unsigned-APK-only) — pushed to Phase 2, since it
  needs an `eas.json`/signing decision first rather than being a
  standalone wiring fix like the rest of Phase 0.

Every other item originally listed in Phase 0 — including
`privacy-security.tsx`'s data export/deletion, finished in this session's
second pass — is checked off above, plus two items not explicitly
itemized in the original plan text but covered by "replace every
hardcoded Alex": the chat welcome message (`"Hi Alex"` → real first name)
and the report success screen.

Also completed as part of Phase 0 (`app.json` fix explicitly called out
in the original plan):
- [x] Fixed `app.json`'s `"userInterfaceStyle": "light"` → `"automatic"`.
  **2026-09-09**: One-line change, done.

Also found and fixed while verifying the "replace every hardcoded Alex"
item above — not itemized in the original audit, but the actual root
cause of it: `app/login.tsx`'s `onLogin` unconditionally called
`login({ name: 'Alex Chen', ... })` regardless of what the user typed.
Every other "Alex" fix this session (Home, Profile, chat, report) was
fixing the *symptom*; this was the *source*. Login has no name field
(only email/password, since it's meant to be an existing user signing
in, not registering), so there's no real name to use without a backend
to look one up. Fixed by deriving a placeholder from the email's local
part (e.g. `jane.doe@x.com` → "Jane Doe") instead of a fictional person
— still a stub, but one that doesn't actively mislead a real returning
user into seeing someone else's name. Flagged here as a stopgap: once
real auth exists (Phase 3), this whole derivation goes away in favor of
whatever name the backend actually returns.

### Phase 1 — Build the actual safety product
*Goal: SOS, medical-info-to-responders, family circle, and guidance work
end-to-end today, on-device, with no server. This is the functional heart
of "ResQ" and none of it requires a backend to be real.*

**Status: SOS, onboarding persistence, and real device location — Phase
1's top three priorities — are all now built and verified.** See §2.4/§2.5
below for SOS/onboarding, and §2.9 (new) for device location. Real
`tsc --noEmit` and the full smoke suite (26/26) pass clean as of
2026-09-09 with all three in. Everything else in this phase is still open
(§7) — **real maps is the natural next item**, since it now has real
coordinates to render rather than needing to be built against nothing.

- [x] **Persist onboarding output.** **2026-09-09**: Built — see §2.5
  below for the full writeup (per-step AsyncStorage drafts across all
  five onboarding screens, merged into the real profile + family circle
  on completion).
- [x] Remove pre-seeded fake people from onboarding. **2026-09-09**: Done
  as part of the same pass — see §2.5 and §4.3.
- [x] **Build SOS.** **2026-09-09**: Built — see §2.4 above for the full
  writeup (Home entry point, press-and-hold trigger, tel:112 + SMS to
  contacts, local history log at `/sos-history`). This was the single
  most important item in the whole roadmap.
- [x] **Real device location** via `useDeviceLocation()`. **2026-09-09**:
  Built — see §2.9 below for the full writeup (live GPS via
  `expo-location`, wired into `useCurrentArea()`, Safe places, Report, and
  SOS's SMS/history location).
- [ ] **Real maps** (map SDK). Not started — SDK/scope decision made,
  no code written yet. Real coordinates exist end-to-end today (device
  location, safe places; family members not yet — see §5), so a map view
  has something true to render instead of being built against placeholder
  data. **SDK decided 2026-09-09 (planning session): MapLibre +
  OpenFreeMap**, not react-native-maps — see §6/§7.1 for the full
  rationale and §7.2 for exactly which screens get a map. Nothing
  map-SDK-related is installed yet (see `package.json`).
- [ ] **Camera capture** for incident reports. Not started.
- [x] **New `app/notifications.tsx`** — a real destination for the
  Header bell. **2026-09-09**: Built ahead of schedule as part of
  resolving the dead-bell issue in Phase 0 (§2.2) — local storage only,
  no push server, exactly as this item specifies. Read/unread state,
  mark-all-read, seeded from `mockNotifications.ts` on first open.
- [ ] **Local notifications** via `expo-notifications`. Not started.
- [ ] **Chat sources parity** — `chat.tsx` still never renders
  `ChatMessage.sources` even though the type/mock data support it and
  `guidance-result.tsx` already has the pattern to copy. Deliberately
  left for a proper Phase 1 session rather than bolted on while already
  deep in an unrelated chat-history refactor this session (chat.tsx was
  touched for thread-switching, §2.2, but sources parity is a distinct
  piece of work).
- [x] **"Guides read" counter.** **2026-09-09**: Built — see §2.3 above.
  Originally scoped as a Phase 1 item but pulled forward because
  Profile's Phase 0 fix explicitly needed it to be real instead of
  hardcoded "4".

### Phase 2 — Legal, privacy & store-compliance baseline
**Status: not started.** Everything in this phase remains exactly as
originally planned — see the full item list further down this file (or
the original planning session, referenced in git history/this note) for
the itemized Privacy Policy/Terms/Data Safety/age-policy/eas.json list.
Not re-typed here to avoid this file drifting out of sync with itself;
the authoritative item list is the one under this same heading below.

### Phase 3 — Stand up a real backend
**Status: not started.** No code changes possible here without first
making the stack decision in §6.

### Phase 4 — Cut over from mock to real data
**Status: not started** (blocked on Phase 3).

### Phase 5 — Hardening for a real public release
**Status: not started.**

### Phase 6 — Post-launch / scale
**Status: not started, not blocking v1.**

---

## 4. Pages & navigation — full map

### 4.1 Existing screens (updated 2026-09-09)
| Route | Purpose | Status |
|---|---|---|
| `app/index.tsx` | Splash / startup router | Solid, keep as-is |
| `app/login.tsx` | Sign in | Forgot-password now real (local flow); Google button removed rather than left dishonest. Still needs: real validation before backend exists |
| `app/register.tsx` | Sign up | Needs: real validation before backend exists (unchanged) |
| `app/forgot-password.tsx` | **New 2026-09-09.** Locally-simulated password reset | Solid for a no-backend stage; swap the request call once real auth exists |
| `app/onboarding/personal.tsx` | Name/phone/DOB/blood type | Real persistence done (2026-09-09) — draft + merges into `mergeProfile()` |
| `app/onboarding/medical.tsx` | Allergies/conditions/accessibility | Real persistence done (2026-09-09). Still needs: a screen that shows this back to the user post-onboarding (Phase 1/5) |
| `app/onboarding/family.tsx` | Family members | Real persistence done, fake pre-seed removed (2026-09-09) — see §2.5 |
| `app/onboarding/location.tsx` | Home address + device location | Real persistence done (2026-09-09) — composes into `ProfileData.location`. Deliberately still a one-time snapshot, not live tracking — that's correct for a home-address field. Real live location now exists elsewhere in the app via `useDeviceLocation()`/`useCurrentArea()` (§2.9) |
| `app/onboarding/emergency.tsx` | Emergency contacts | Real persistence done, fake pre-seed removed, merged with family.tsx's list into the real circle (2026-09-09) — see §2.5 |
| `app/(tabs)/index.tsx` | Home | Real greeting/date/counts done. SOS entry point done (2026-09-09) |
| `app/(tabs)/updates.tsx` | Live updates | Real area source done |
| `app/(tabs)/report.tsx` | Incident report | Real name + location-seed done. **2026-09-09**: location field now seeds from live device GPS when available (§2.9), not just the profile home address. Still needs: camera (Phase 1) |
| `app/(tabs)/family.tsx` | Family circle | Real invite form done. **2026-09-09**: now actually persists (`familyService.ts` was previously in-memory-only — see §2.5). Still needs: real backend-side accept/decline flow (Phase 3) |
| `app/(tabs)/safe.tsx` | Safe places | Area seed done. **2026-09-09**: now queries with real device coordinates when available, and the mock service sorts by real distance (§2.9). Still needs: a real map view (Phase 1) |
| `app/chat.tsx` | Ask ResQ assistant | Real history switching done. Still needs: sources UI (Phase 1) |
| `app/readiness.tsx` | Readiness detail | Tappable checklist done |
| `app/guidance-result.tsx` | Post-report guidance | Solid, keep as reference pattern for sources UI. Now also increments the guides-read counter |
| `app/family-member.tsx` | Person detail | Working Call/Message/Locate done |
| `app/place-detail.tsx` | Place detail | Working Directions/Call done |
| `app/update-detail.tsx` | Update detail | Not yet audited in depth — re-check for dead links/hardcoding when picked up |
| `app/profile.tsx` | Profile & settings | Real name/stats done. **2026-09-09**: edits now actually persist (`profileService.ts` was previously in-memory-only — see §2.5). Still needs: surfacing the new `dob`/`bloodType` fields in this screen's own edit form (account export/deletion live on `privacy-security.tsx`, not here — already working, see that row below) |
| `app/alert-preferences.tsx` | Notification categories | Needs: persistence, actually gate real notifications (Phase 1) — unchanged |
| `app/privacy-security.tsx` | Privacy settings | Working data export/deletion done |
| `app/notifications.tsx` | **New 2026-09-09.** Alerts/updates/family check-ins list | Local storage only (no push yet — Phase 1/3), but a real, working destination |
| `app/sos.tsx` | **New 2026-09-09.** Emergency SOS: press-and-hold trigger, tel:112 + SMS to contacts | Working, local-only logging. **2026-09-09**: SMS body and history log now include a real Maps link from live GPS when available (§2.9). Still needs: push/alarm, hardware-button trigger (Phase 1/5) |
| `app/sos-history.tsx` | **New 2026-09-09.** Local log of past SOS activations, linked from Profile | Local storage only, real working destination |

### 4.2 Missing screens to add
- [x] SOS flow (Home-embedded entry point + `app/sos.tsx`) — **Done
  2026-09-09**, see §2.4/§3 Phase 1 above
- [x] `app/notifications.tsx` — **Done 2026-09-09**, see above
- [ ] `app/privacy-policy.tsx`, `app/terms.tsx` — Phase 2, not started
- [x] `app/forgot-password.tsx` — **Done 2026-09-09**, see above
- [ ] `app/help-support.tsx` — Phase 1/5, not started
- [ ] Internal moderation/verification tool — Phase 3, not started

### 4.3 To remove or replace, not just leave as-is
- Pre-seeded fake contacts in onboarding — **removed 2026-09-09** (§2.5):
  `family.tsx`'s "Maya Chen" and `emergency.tsx`'s "Maya Chen"/"David
  Chen" are gone; both steps now start empty with a real empty-state card
  and load an actual saved draft instead
- The "Continue with Google" button — **removed 2026-09-09** (§2.2)
- The static fake-pin "map" illustration on `safe.tsx`/`place-detail.tsx`
  — still present, unchanged (waiting on Phase 1's real map decision)
- Placeholder app icon/splash — still present, unchanged (Phase 2)
- The debug-APK-only CI workflow — still present, unchanged (Phase 2)

---

## 5. Data model additions needed (`src/types/index.ts`)
- [x] `FamilyMember.phone`, `FamilyMember.lastKnownLocation` — **added
  2026-09-09**
- [x] `SafePlace.phone` — **added 2026-09-09**
- [x] `NotificationItem`/`NotificationKind` — **added 2026-09-09** (not
  in the original data-model list below, but needed for the
  notifications screen)
- [x] `ChatThread` (= `ChatThreadSummary` + `messages`) — **added
  2026-09-09** for chat history switching
- [x] `EmergencyContact` — **resolved 2026-09-09 without adding this
  type** — see §2.5/§6: emergency contacts are unified into `FamilyMember`
  (new `isPrimaryEmergencyContact` flag) rather than a separate parallel
  list, so SOS has one contact source instead of two to reconcile
- [x] `MedicalProfile` — **added 2026-09-09** (allergies, conditions,
  usesMobilityAid, hasVisualImpairment, hasHearingImpairment) — see §2.5
- [x] Extend `ProfileData` with dob/bloodType — **added 2026-09-09**
  (both optional free-text fields, populated by onboarding's personal
  step). Structured address was *not* added — `ProfileData.location`
  stays a single free-text field, same as it already was, since
  `useCurrentArea()` and every screen that reads it already expect a
  plain string; onboarding's location step composes a `city, state`
  summary into it rather than the raw structured fields it collects
- [ ] Extend `FamilyMember` with `inviteStatus` ('pending' | 'accepted')
  — not started; note that `inviteFamilyMember` already sets
  `status: 'Invite sent'` on creation, which is a reasonable stand-in
  today, but a proper typed `inviteStatus` field is still the Phase 1
  item as originally scoped
- [x] `SosEvent` — **added 2026-09-09** (id, triggeredAt,
  calledEmergencyNumber, contactsNotified, location) alongside SOS itself
- [ ] Extend `FamilyMember` with optional `latitude`/`longitude` —
  **planned, not yet built** (2026-09-09 planning session, see §7.2/§7.3).
  Needed before `family-member.tsx` can show a real mini-map instead of
  the name-based Maps-search fallback it has today. Open question for the
  implementation session: whether `mockFamily.ts` gets seeded with real
  coordinates (matching `mockSafePlaces.ts`'s pattern) or the map only
  renders once a member actually has one on file — no backend exists yet
  for a family member's own device to report a real position, so this is
  a real design call, not an obvious default.

---

## 6. Decisions log — flagged, not yet made

Three of the four originally-flagged decisions (backend stack, minimum
age/parental consent, maps SDK vs Linking-only) remain exactly as the
original plan left them — see the original item list further down this
file for the full tradeoff writeup on each. The fourth, **guest mode's SOS
scope**, is effectively resolved by existing architecture rather than a
new choice made this session: `app/sos.tsx` sits in the same
`Stack.Protected` group as the rest of the authenticated tabs (see
`app/_layout.tsx`), and guest sessions (`loginAsGuest()`) already land in
that same group — so guests get full SOS access, same as a registered
user. This wasn't a deliberate SOS-specific decision so much as SOS simply
inheriting the app's existing "Emergency App Access" guest design, which
already exists specifically to make emergency-relevant screens reachable
without credentials. Flagging here in case a future session wants to
narrow this (e.g. hide the local SOS *history* log for guests, since it's
tied to on-device storage that a guest session may not expect to persist)
rather than leaving it as an unexamined side effect.

**New decision made this session: no separate `EmergencyContact` type.**
The original data-model list (§5) called for adding `EmergencyContact`
alongside persisting onboarding output. Building it revealed the two
existing onboarding steps — family circle and emergency contacts — kept
two independent, overlapping lists (see §2.5), and SOS only ever messages
`useFamily()`'s list, not a separate emergency-contacts list. Adding
`EmergencyContact` as its own type would have created a second contact
list for the app to keep in sync with the first, with no clear owner of
"the real list SOS uses." Instead, `FamilyMember` gained a single
`isPrimaryEmergencyContact: boolean` flag, and the two onboarding steps
now write into one merged, de-duplicated circle
(`onboardingService.mergeOnboardingContacts()`). Tradeoff: this assumes
every emergency contact is conceptually part of the family circle, which
holds for this app's scope (a physician or neighbor still gets a
`relation` label and a `FamilyMember` row) but would need revisiting if a
future feature wanted emergency contacts who explicitly aren't part of
the family/check-in system.

**New decision made 2026-09-09 (planning only, no code yet): map SDK is
MapLibre + OpenFreeMap, not react-native-maps.** User's stated priorities,
in order: free with no API key, one-time native setup, looks good on both
Android and iOS, web support is a nice-to-have but not required. This
resolves the maps-SDK-vs-Linking-only item the original plan left open —
see §7.1 below for the full rationale (a real build was explored this far
in an earlier session's chat history but never committed to code; this is
the first time the decision itself has been written down in this file).

**New decision made 2026-09-09 (planning only): map placement is
accessibility-driven, not a fixed list.** Rather than restricting maps to
Safe places alone, the user asked for a mini-map wherever it's a genuine
usability win — explicitly naming family-member location as an example.
§7.2 below lists every screen with a real coordinate today and the
per-screen call on whether a map belongs there, so this stays a
deliberate, reviewed set of additions rather than maps creeping onto
every screen that happens to have a lat/long.

One small implementation note worth flagging here even though it's not
a full "decision": `readinessService.ts`'s new `toggleReadinessItem`
recomputes the readiness score as a straight percentage of checklist
items completed. This is explicitly a placeholder — a real backend
should compute readiness from more than just the checklist (profile
completeness, check-in recency, etc., per §3 Phase 3's original
`readinessService` note) — but it's a real, defensible number rather
than the disconnected hardcoded 82% that was there before.

---

## 7. Where to start next session

**Phase 0 is complete. SOS and onboarding persistence — Phase 1's top two
priorities — are both now built, verified, documented, and packaged**
(2026-09-09; see §2.4 for SOS and §2.5 for onboarding persistence,
including a pre-existing family/profile persistence bug that got fixed
along the way, and §6 for the decision to unify emergency contacts into
the family circle instead of adding a separate `EmergencyContact` type).
Real `tsc --noEmit` and the full smoke suite (26/26) both pass clean with
everything included — re-verified in this pass, not just carried forward
from the prior session's notes. README.md's project structure, page list,
and architecture notes have also been brought current with every route
and service added across Phase 0 and Phase 1-so-far (see README's
"Project structure" and "Architecture" sections).

**Real device location is now also built** — see §2.9 for the full
writeup. `useDeviceLocation()` exists, `useCurrentArea()` prefers it over
the profile fallback exactly as previously planned, and Safe places,
Report, and SOS all consume real coordinates now. Re-verified with real
`tsc --noEmit` and the full 26/26 smoke suite after every change in this
pass, including the final `safePlacesService.ts` distance-sort addition.

**The next step is real maps — SDK and scope are now decided (2026-09-09,
planning session, no code written yet).** This was deliberately sequenced
after device location because a map is only meaningful once there are
real coordinates to put on it — that's now true everywhere it matters.

### 7.1 SDK decision: MapLibre + OpenFreeMap

Chosen over `react-native-maps` based on explicit priorities from the
user, in order: free with no API key required, one-time native setup,
looks good on both Android and iOS, web support is a nice-to-have but not
a requirement.

- `react-native-maps` defaults to Apple Maps on iOS (free, zero config)
  but defaults to Google Maps on Android, which needs a Google Maps API
  key or the map silently renders blank — that's a real setup step, not
  one-time-and-done, and this project doesn't have a key today. A prior
  exploratory pass (visible in this project's chat history, never
  committed to code) also looked at pointing `react-native-maps` at raw
  OpenStreetMap tiles via `UrlTile` to dodge the key — react-native-maps'
  own docs explicitly warn this "does not work on Android with URLTile
  and is not recommended for iOS either for other than small-scale test
  use," so that path is out.
- **MapLibre (`@maplibre/maplibre-react-native`) + OpenFreeMap
  (`https://tiles.openfreemap.org/styles/liberty` style URL)** has no API
  key on either platform, no registration, and OpenFreeMap states no
  rate limits by design and positions itself as production-appropriate
  (it's been MapHub's production basemap since 2024) — not a demo-only
  tile source like MapLibre's own default demo tiles, which its docs say
  are explicitly dev-only. (Worth a quick re-check of the style URL and
  OpenFreeMap's current terms at the start of the implementation session
  — this is carried over from an earlier exploration, not re-verified in
  this planning pass.)
- **Setup cost is genuinely one-time**: an Expo config-plugin entry in
  `app.json`'s `plugins` array (no key to manage) plus a dev-client
  rebuild. That rebuild is required either way — `react-native-maps`
  needs the exact same dev-client step, so MapLibre isn't trading away
  the "one-time setup" goal to get "free."
- **Web is out of scope, honestly.** Neither library has real web
  support. Confirmed for MapLibre specifically: real cross-platform setups
  use `@maplibre/maplibre-react-native` for native and a completely
  separate library (`react-map-gl` + `maplibre-gl-js`) for web — genuine
  added complexity, not a config flag. Given the user said web is a
  nice-to-have and explicitly not worth extra effort ("if not then no
  worries"), web keeps the existing static pin illustration / "Open in
  Maps" link fallback (`Platform.OS === 'web'` guard, matching the app's
  existing platform-conditional idiom — e.g. the SMS separator in
  `family-member.tsx`/`sos.tsx`). This is a deliberate scope line, not an
  oversight: taking on a second web map stack isn't worth it for a
  "nice-to-have."
- Package versions were not pinned during this planning pass — install
  with `npx expo install @maplibre/maplibre-react-native` when
  implementation starts, not a guessed version number, since Expo-SDK
  compatibility for native map libraries has been a real source of
  friction historically (this was true for react-native-maps on recent
  Expo SDKs too, per the same earlier exploration).

### 7.2 Where maps actually go

Per-screen review of every place a real coordinate exists today, since
the ask was "add mini-maps where they're a genuine accessibility/
usability win," not "everywhere there's a lat/long":

| Screen | Has real coords today? | Map? | Why |
|---|---|---|---|
| `app/(tabs)/safe.tsx` | Yes — device location + `mockSafePlaces` lat/long | **Yes** | Literally has a fake-pin illustration standing in for a map today (§4.3) — the clearest case there is |
| `app/place-detail.tsx` | Yes — `SafePlace.latitude/longitude` | **Yes** | Same fake-pin placeholder exists here too; a mini-map showing the one place is a natural, small addition, and `onDirections` already computes the exact same coordinates this would need |
| `app/family-member.tsx` | **Not yet** — `FamilyMember.lastKnownLocation` is free text only, no lat/long | **Yes, but needs a data-model step first** | Explicitly named by the user as an example of where this is a good idea. `FamilyMember` needs optional `latitude`/`longitude` added (§5) before a real mini-map can render here — until then this screen can only show a map if/when a coordinate exists, which today it doesn't (mock data would need seeding, see §7.3 open question) |
| `app/sos.tsx` (confirmed screen) | Yes — via `useCurrentArea()`'s `latitude`/`longitude` (§2.9) | **Consider** | Showing the user's own location on a small map at the moment SOS fires could reinforce "this is what we're sending" — worth a look, not mandatory for v1 of this feature |
| `app/(tabs)/report.tsx` | Yes — via `useCurrentArea()` | **No** | The location field here is an editable text field the user can override; a map doesn't add clarity to a free-text input the way it does to a fixed point (a safe place or a person) |
| `app/(tabs)/updates.tsx`, `app/(tabs)/family.tsx` | Only the free-text `area` string, no coordinates | **No** | Nothing to plot — these screens don't have a specific point, just a district name |

Net: build one reusable `MiniMap` component (native MapLibre view + web
fallback), then place it in `safe.tsx`, `place-detail.tsx`, and
`family-member.tsx` — with `sos.tsx`'s confirmed screen as a stretch
addition once the base component exists, since it reuses the exact same
component with the user's own coordinates instead of a place's.

### 7.3 Sequencing and open items for the implementation session

1. `npx expo install @maplibre/maplibre-react-native`; add the config
   plugin to `app.json` (no key needed — see 7.1).
2. Build a small reusable `MiniMap` component: takes `latitude`/
   `longitude`, optional `title`/pin color, renders real MapLibre +
   OpenFreeMap style on iOS/Android, and the existing static pin
   illustration (or an "Open in Maps" link) on web via a `Platform.OS`
   guard — matching this app's existing honest-about-limitations style
   (e.g. `useCurrentArea()`'s own stopgap comments, SOS's "user still has
   to confirm the call" note).
3. Wire `MiniMap` into `safe.tsx` (replacing the fake-pin card) and
   `place-detail.tsx` (replacing its fake-pin preview).
4. **Data-model step required before family-member gets a map**: add
   optional `latitude`/`longitude` to `FamilyMember` (§5), decide whether
   `mockFamily.ts` gets seeded with real coordinates (same spirit as
   `mockSafePlaces.ts`'s real Delhi-area coordinates) or whether the map
   only appears once a member actually has coordinates on file — this is
   a real design call for that session, not an obvious default, given
   there's no backend yet for a family member's *own* device to report
   their real position.
5. New native module → this needs an explicit Jest mock in
   `__tests__/smoke.test.tsx` (same pattern as the existing `expo-video`/
   `expo-blur` mocks) before `safe.tsx`/`place-detail.tsx`/
   `family-member.tsx`'s smoke tests will pass again — budget time for
   this, it's not optional.
6. Requires a dev-client rebuild to actually see it render on a real
   device/simulator — won't work in plain Expo Go. Flag this to the user
   before starting, since it changes their local dev workflow.

Other Phase 1 items still open, roughly in priority order after maps:
camera capture for incident reports, local notifications
(`expo-notifications`), a medical-ID display surface for the
`MedicalProfile` data onboarding now collects but nothing yet shows back
to the user (§2.5), surfacing `dob`/`bloodType` in `profile.tsx`'s own
edit screen, and chat sources parity (`chat.tsx` still doesn't render
`ChatMessage.sources` even though `guidance-result.tsx` already has the
exact pattern to copy — this remains the smallest self-contained warm-up
ticket if one is wanted before maps).

---

## Archive

Everything below this line is preserved exactly as written by prior
sessions, unedited.

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
