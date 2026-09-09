# ResQ — Master Roadmap & Progress

This file has two parts from here on:

1. **Master Roadmap** (below) — a full plan, written 2026-09-08, for taking
   ResQ from its current UI-mockup-with-real-architecture state to an
   enterprise-grade, Play-Store-ready app. Nothing in this pass touched code
   — it's a planning session. Work through the phases in order; each item
   is a checkbox so progress can be tracked directly in this file. When you
   finish an item, check it off **and** add a short dated note under it (one
   or two lines: what you did, any decision made) — don't just delete the
   line, this file is the project's memory.
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
- [ ] `src/components/Header.tsx` — the default Bell "Notifications" action
  (`onPress={() => {}}`) on every screen that doesn't override `action`.
- [ ] `app/place-detail.tsx` — "Directions" and "Call ahead" buttons have
  no `onPress` at all.
- [ ] `app/family-member.tsx` — "Call", "Message", "Locate" buttons have
  no `onPress` at all.
- [ ] `app/privacy-security.tsx` — "Download my data" and "Delete my
  account" rows have no `onPress` at all (these are also a Play Store
  compliance requirement — see §2.7).
- [ ] `app/login.tsx` — "Forgot?" password link has no action.
- [ ] `app/login.tsx` / `app/register.tsx` — "Continue with Google" calls
  the exact same `onLogin`/local stub as the plain sign-in button. It
  isn't broken, it's dishonest UI: it visually promises Google OAuth and
  delivers the demo stub instead.
- [ ] `app/chat.tsx` — tapping a row in the "Previous chats" drawer just
  closes the drawer (`onPress={() => setHistoryOpen(false)}`); it never
  loads that thread's messages.
- [ ] `app/readiness.tsx` — checklist rows are read-only `View`s, not
  `Pressable`s; there's no way to manually mark something done.
- [ ] `.github/workflows/build-release.yml` — only builds an **unsigned
  debug APK** via `gradlew assembleDebug`. This cannot be uploaded to Play
  Console. There is no `eas.json` and no release-signing setup anywhere
  in the repo.

### 2.3 Hardcoded/fake state (only "works" because mock data happens to line up)
- [ ] `app/(tabs)/index.tsx` — greeting hardcodes `"Good morning, Alex"`
  and the eyebrow hardcodes `"TUESDAY, 24 SEPTEMBER"` — neither reads
  from real user/date state.
- [ ] `app/(tabs)/index.tsx` — the "Check on family" quick-action subtitle
  hardcodes `"3 people in your circle"` instead of `list.length` from
  `useFamily()`.
- [ ] `app/(tabs)/report.tsx` — success screen hardcodes `"Thank you,
  Alex."`; the location field defaults to the literal string
  `"Near Riverside Park"` instead of device location.
- [ ] `app/profile.tsx` — avatar text hardcodes `"AC"` regardless of the
  actual profile name; the three stat cards hardcode `"82%"`, `"3"`,
  `"4"` instead of computing from `useReadiness()` / `useFamily()` / a
  real "guides read" counter (which doesn't exist yet — see §3 Phase 1).
- [ ] `src/components/Header.tsx` — `initials` prop defaults to `'AC'`.
- [ ] `app/(tabs)/family.tsx` — `invite()` always adds a fixed
  `"Jamie Lee" / "Friend"` contact; the "add someone" card has no actual
  name/phone input fields, just a "Demo mode is ready" message and a
  button.
- [ ] `"Riverside district"` / `"Near Riverside Park"` appear as
  independent hardcoded strings in `updates.tsx`, `safe.tsx`,
  `family.tsx`, `family-member.tsx`, and `report.tsx` — five different
  places asserting the user's area, none of them reading from one source
  of truth.

### 2.4 The single biggest gap: SOS doesn't exist
`app/onboarding/emergency.tsx` and `app/onboarding/location.tsx` both
explicitly promise SOS behavior in their copy — *"Designate contacts who
will be immediately alerted with your live location when you initiate an
SOS"*, *"Emergency services (911/112) will always be connected directly in
an SOS"*, *"location data is encrypted... only broadcast during active SOS
alerts."* **There is no SOS button, screen, or flow anywhere in the actual
app.** Not on Home, not as a tab, nowhere. For an app called ResQ, this is
the product's core promise and it's currently vaporware. This is Phase 1's
first item below.

### 2.5 Onboarding is data-loss-by-design
Every onboarding screen (`personal.tsx`, `medical.tsx`, `family.tsx`,
`location.tsx`, `emergency.tsx`) holds everything the user types in local
`useState` only. None of it — name, DOB, blood type, allergies,
conditions, accessibility needs, home address, emergency contacts — is
written to `AsyncStorage`, `ProfileData`, the `FamilyMember` list, or any
persisted store. Finishing onboarding only flips one boolean
(`hasCompletedOnboarding` in `AuthContext`). A real user who carefully
fills in two emergency contacts and their blood type will never see that
data again anywhere in the app. There's also no resume-in-progress: force-
quitting mid-onboarding restarts at step 1 next launch. Additionally,
`emergency.tsx` and `family.tsx` pre-seed fake contacts ("Maya Chen",
"David Chen") as if they already exist — confusing for a genuine first-run.

### 2.6 Integrations installed but not actually wired
- `expo-location` is installed and permission-stringed in `app.json`, but
  only `onboarding/location.tsx` calls it — and even there, the result
  isn't persisted (§2.5). Safe Places, Report, and Family "Locate" all
  still use hardcoded location strings.
- `expo-image-picker` only offers the media library — no camera capture
  for "evidence from the scene right now."
- No map SDK at all. The "map" on `safe.tsx` and `place-detail.tsx` is a
  static styled `View` with three fixed-percentage pin positions — not
  real geography, and it doesn't move if location changes.
- No `expo-notifications` — despite `alert-preferences.tsx` implying four
  real push categories (weather/community/traffic/family) exist.
- No crash reporting or analytics SDK of any kind.
- No i18n library — relevant given the India-first assumption (Hindi
  alongside English at minimum).
- No `expo-secure-store` — auth session state (and, once persisted, medical
  data) currently has nowhere more secure than plain `AsyncStorage` to live.

### 2.7 Compliance / Play Store readiness gaps
- No in-app Privacy Policy or Terms of Service screen — both auth screens
  only show static footer *text* ("...agree to the Terms and Privacy
  Policy") with nothing to tap.
- No hosted Privacy Policy URL (a required Play Console field).
- No working account-deletion path, in-app or web — Google Play has
  required both since its 2023 policy update, for any app that supports
  account creation.
- No Data Safety mapping exists anywhere documenting that ResQ collects
  location, health/medical info, contacts, and photos — needed to fill out
  Play Console's Data Safety form honestly.
- No stated minimum age / parental-consent policy, despite collecting
  health data — India's DPDP Act 2023 defines a "child" as **under 18**
  (not under 13) and requires verifiable parental consent to process a
  child's personal data. This is broader than most teams' default mental
  model and needs an explicit decision (§6).
- `app.json` has no privacy-policy field, no real `versionCode` strategy,
  and there's no `eas.json` anywhere in the repo.
- Generated placeholder app icon/splash (flagged in earlier sessions, per
  the archive below) is still what's shipped — fine for internal testing,
  not for a store listing.

### 2.8 Carried forward from the existing archive (still true)
- Auth is a stub — `login()`/`register()` accept anything.
- `react-query` was deliberately not used — hand-rolled `useAsync` instead
  (documented decision, still fine).
- Chat streaming assumes newline-delimited JSON; a real backend using SSE
  framing only requires changing `streamChatReply` in `chatService.ts`.
- No test suite has actually been run (sandbox constraint in prior
  sessions, not a code issue) — `__tests__/smoke.test.tsx` exists.
- `config.useMockData` is one global flag for every domain — fine today,
  should become per-domain flags before a real backend rolls out
  incrementally (Phase 4 below).

---

## 3. The roadmap

No backend exists yet, so phases 0–2 are deliberately backend-free — they
fix what's already broken or missing in the client itself. Phase 3 is
"build a backend from nothing." Phase 4 is the actual cutover. Phases 5–6
are hardening and post-launch.

### Phase 0 — Stop lying to the user
*Goal: every visible control does the real (or locally-simulated) thing it
claims. Nothing shows a fake value. No backend needed for any of this.*

- [ ] Wire `Header`'s bell → the new Notifications screen (Phase 1), or
  hide the icon entirely until that screen exists. Never ship a dead bell.
- [ ] `place-detail.tsx` "Directions" → `Linking.openURL` a Google Maps
  directions URL built from the place's lat/long (works with zero SDK:
  `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>`).
- [ ] `place-detail.tsx` "Call ahead" → add a `phone` field to `SafePlace`
  (type + mock data) and `Linking.openURL('tel:' + phone)`.
- [ ] `family-member.tsx` "Call"/"Message"/"Locate" → add `phone` +
  `lastKnownLocation` to `FamilyMember`; wire `tel:`, `sms:`, and a
  "share current location" flow.
- [ ] `login.tsx` "Forgot?" → build a real (locally-simulated for now)
  forgot-password screen, or remove the link until it exists.
- [ ] "Continue with Google" → implement real Google sign-in via
  `expo-auth-session`, or remove the button. It must not silently act
  identical to plain sign-in.
- [ ] `chat.tsx` history drawer → tapping a thread actually loads that
  thread's messages (extend `mockChat.ts` to hold per-thread message
  arrays, extend `useChat`/`chatService` to support switching threads).
- [ ] `readiness.tsx` checklist rows → make them `Pressable`, toggle
  done/undone locally (until Phase 1 drives them from real profile
  completeness automatically).
- [ ] Replace every hardcoded `"Alex"`/`"AC"` with the real signed-in
  user's name/initials (derive initials from `user.name`; handle guests
  gracefully — no name to derive from).
- [ ] Replace Home's static date string with the real current date,
  locale-formatted.
- [ ] Replace Home's `"3 people in your circle"` with `list.length` from
  `useFamily()`.
- [ ] Replace Profile's hardcoded `82%/3/4` stats with real computed
  values (readiness score, family count, and a real "guides read"
  counter — new, see Phase 1).
- [ ] Give `family.tsx`'s "add someone" card real inputs (name, relation
  picker, phone) instead of always inviting "Jamie Lee."
- [ ] Turn `privacy-security.tsx`'s dead "Download my data" / "Delete my
  account" rows into working local flows now (export everything in
  `AsyncStorage` as JSON; fully clear local storage + log out). These
  become the real GDPR/DPDP-compliant flows later with zero UI rework —
  building them now also satisfies the Play Store account-deletion
  requirement from day one.
- [ ] Pick one source of truth for "current area" (today hardcoded
  separately in 5 files as "Riverside district"/"Near Riverside Park") —
  should read from `ProfileData.location` or device location, in one
  place, consumed everywhere else via a hook.
- [ ] Fix `app.json`'s `"userInterfaceStyle": "light"` → `"automatic"`, so
  native chrome matches the in-app theme toggle instead of contradicting
  it in dark mode.

### Phase 1 — Build the actual safety product
*Goal: SOS, medical-info-to-responders, family circle, and guidance work
end-to-end today, on-device, with no server. This is the functional heart
of "ResQ" and none of it requires a backend to be real.*

- [ ] **Persist onboarding output.** Add to `src/types/index.ts`:
  `EmergencyContact` (name, relation, phone, isPrimary), `MedicalProfile`
  (bloodType, allergies, conditions, mobilityAid/visualImpairment/
  hearingImpairment flags); extend `ProfileData` with `dob`/`bloodType`/
  structured address. Add `src/services/localStore.ts` (AsyncStorage-
  backed today, swappable later) and have every onboarding screen write
  into one persisted draft as the user types — so force-quitting mid-flow
  resumes instead of restarting. On finishing onboarding, commit the draft
  into `ProfileData`, a new `MedicalProfile` store, and the `FamilyMember`
  list (as real pending invites — not fake accepted members).
- [ ] Remove the pre-seeded fake people from `onboarding/emergency.tsx`
  and `onboarding/family.tsx` — start empty with a proper "add your first
  contact" empty state. Keep `mockFamily.ts`'s richer demo data for
  guest/demo mode only, not layered silently under real onboarding.
- [ ] **Build SOS** — the top-priority missing flow:
  - A visible, unmissable entry point on Home — not buried in a menu.
  - A deliberate-trigger interaction (press-and-hold, or confirm-then-
    5-second-cancel-window) to prevent accidental activation.
  - On confirm: offer `Linking.openURL('tel:112')` (India's unified
    emergency number) directly, *and* compose a pre-filled SMS/share-sheet
    message (`expo-sms` or the native share sheet) to every emergency
    contact with a phone number, containing current coordinates + a
    Google Maps link. Both work with zero backend.
  - A local SOS history log (past triggers, cancelled or not, timestamp),
    surfaced in Profile/Settings.
  - A persistent disclaimer wherever SOS is introduced (Home, onboarding,
    first use): this supplements, never replaces, calling 112 directly.
- [ ] **Real device location** via one shared `useDeviceLocation()` hook,
  consumed by Safe Places, Report (replacing the hardcoded default
  location), SOS (required), and Family "Locate" (share, not live-track,
  until a backend exists to receive continuous updates).
- [ ] **Real maps.** Add `react-native-maps` (Google provider) for an
  actual map on Safe Places / place-detail, replacing the static fake-pin
  illustration — or at minimum keep "Directions" as the cheap
  zero-SDK `Linking` deep link either way; don't build in-app turn-by-turn.
- [ ] **Camera capture** for incident reports alongside the existing
  library picker (`ImagePicker.launchCameraAsync`).
- [ ] **New `app/notifications.tsx`** — a real destination for the Header
  bell: list of past alerts/updates/family check-ins, read/unread state,
  local storage for now.
- [ ] **Local notifications** via `expo-notifications` (device-only, no
  push server yet): check-in reminders, readiness nudges. Wire
  `alert-preferences.tsx`'s toggles to actually gate which fire, and
  persist those toggle states (currently reset every launch — they're
  local `useState` with no storage).
- [ ] **Chat sources parity** — `chat.tsx` never renders
  `ChatMessage.sources` even though the type and mock data support it;
  copy the pattern already working in `guidance-result.tsx`.
- [ ] **"Guides read" counter** — increment a small local counter whenever
  a guidance-result or a readiness next-step is opened, to back the
  Profile stat honestly instead of hardcoding "4".

### Phase 2 — Legal, privacy & store-compliance baseline
*Goal: none of this needs a server — it's screens, copy, and Play Console
configuration — but every item blocks a legitimate store listing.*

- [ ] Ship an in-app **Privacy Policy** screen (`app/privacy-policy.tsx`)
  and **Terms of Service** screen (`app/terms.tsx`), linked from
  login/register/Profile — not just static footer text.
- [ ] Host the same Privacy Policy at a public URL (required Play Console
  field regardless of the in-app copy).
- [ ] In that policy, explicitly list every category of data ResQ
  collects (location, health/medical, contacts, photos, account info) and
  why — this is also the source for Play Console's **Data Safety** form.
- [ ] Decide and state a minimum-age / parental-consent policy for account
  creation (DPDP Act 2023: under-18 counts as a "child," needs verifiable
  parental consent to process their data) — affects registration and
  onboarding copy. Flagged as a decision, not defaulted — see §6.
- [ ] Finish the local "Download my data" / "Delete my account" flows from
  Phase 0 into fully compliant data-export and full-account-erasure
  actions once real accounts exist.
- [ ] Add a persistent, hard-to-miss disclaimer that ResQ guidance/SOS
  supplements but never replaces calling 112 or local authorities.
- [ ] Real app icon/splash/adaptive-icon artwork, plus a feature graphic
  and screenshots for the Play listing (placeholder icons are still in
  place per the archive below).
- [ ] `app.json`: add a real `versionCode` strategy and confirm every
  permission string (`location`, `photos`, and later `notifications`,
  `camera`) is accurate and specific — Play Console reviews these against
  actual usage.
- [ ] Add `eas.json` with at least a `production` profile producing a
  signed **AAB** (not APK). `.github/workflows/build-release.yml`
  currently only produces an unsigned debug APK and cannot be submitted
  as-is — replace or supplement it.
- [ ] Decide and document a release-signing-key storage plan (EAS-managed
  credentials is the simplest default for a small team).

### Phase 3 — Stand up a real backend
*This is a from-scratch build, not an integration ticket — no backend
exists today.*

- [ ] **Pick a stack** (flagged as a real decision — see §6 for the full
  tradeoff writeup):
  - Fast path: **Firebase** (Auth + Firestore + Cloud Functions + FCM) or
    **Supabase** (Postgres + Auth + Realtime + Storage) — minimal ops,
    good fit for a small team, push notifications largely built-in.
  - More-control path: custom Node/Express or FastAPI + Postgres + Redis
    + a separate vector store (pgvector/Pinecone/Weaviate) for RAG.
  - *Recommended default*: start with Supabase or Firebase to get
    auth/data/push working fast; revisit a custom backend only if the
    RAG/guidance pipeline outgrows it.
- [ ] **Auth**: real signup/login/reset, session/JWT handling, tokens in
  `expo-secure-store` (not `AsyncStorage`), and fill in the `Authorization`
  header TODO already marked in `src/services/apiClient.ts`.
- [ ] **One endpoint per existing service file**, matching
  `src/types/index.ts` shapes exactly so no client code has to change:
  - `updatesService` → live feed + ingestion from weather/municipal
    sources.
  - `familyService` → real invite delivery (SMS/email/link), accept/
    decline, live status.
  - `safePlacesService` → real shelter/resource directory, ideally sourced
    from NDMA/state disaster-management data.
  - `guidanceService` (RAG) → retrieval over an ingested NDMA/WHO/state
    knowledge base.
  - `reportService` → incident intake **+ a moderation/verification
    queue** (something has to move a report from "reported" to
    "verified" — a small internal admin tool, in scope here, not in the
    mobile app).
  - `chatService` (RAG, streaming) → confirm SSE vs NDJSON framing with
    whoever builds this and adjust `streamChatReply` if needed (mock
    currently assumes NDJSON).
  - `readinessService`, `profileService` → straightforward CRUD once auth
    exists.
- [ ] **Push notifications**: FCM project + server-side sends matching the
  four categories already defined in `alert-preferences.tsx`.
- [ ] **SMS/email provider** for family invites and OTP/reset delivery
  (Twilio works in India; a local aggregator may be cheaper at scale).
- [ ] **Photo storage** for incident-report images (S3-compatible, or
  Supabase/Firebase Storage).
- [ ] **Abuse prevention** on the report endpoint — rate limiting + the
  moderation queue above; today anyone could submit unlimited unverified
  reports.
- [ ] **RAG content pipeline**: source, ingest, and keep current a
  knowledge base of NDMA guidelines, IMD weather bulletins, and local-
  authority advisories; define the confidence-scoring logic that already
  has UI (`guidance-result.tsx`'s badge) but no real backing yet.

### Phase 4 — Cut over from mock to real data
- [ ] Split the single global `config.useMockData` flag into **per-domain**
  flags (e.g. `EXPO_PUBLIC_USE_MOCK_FAMILY`, `..._GUIDANCE`, ...) in
  `src/config/env.ts` — small change, no service/hook/screen changes
  needed — so features can go live one at a time.
- [ ] Stand up a staging API environment; point a staging build at it
  before touching production.
- [ ] Flip each domain's flag one at a time, re-testing that screen
  against real data — including empty states, error states, and slow-
  network states (the mock only simulates latency, never failure or
  empty data).
- [ ] Keep `src/data/mock*.ts` available behind the per-domain flags
  indefinitely for demos/QA/offline dev, even once everything is live
  (recommended — don't delete the mock layer).

### Phase 5 — Hardening for a real public release
- [ ] **Accessibility**: screen-reader label audit on every icon-only
  button, AA color-contrast check in both themes, support OS font
  scaling, and actually *use* the accessibility flags collected in
  onboarding (`mobilityAid`/`visualImpairment`/`hearingImpairment`)
  instead of collecting and discarding them — e.g. a high-contrast/
  larger-text toggle in Profile, and pass the flags along in the SOS
  payload once a backend exists.
- [ ] **Localization**: add `i18next` + `expo-localization`; ship
  English + Hindi at minimum for an India launch; route all copy through
  translation keys now rather than retrofitting later.
- [ ] **Offline-first**: detect connectivity (`@react-native-community/
  netinfo`), show a clear offline banner, cache last-successful Updates/
  Safe-Places/Guidance responses for offline reading, queue incident-
  report submissions to auto-send once back online. This matters more
  for a disaster app than almost any other category of app.
- [ ] **Security**: move auth tokens and `MedicalProfile` data from
  `AsyncStorage` to `expo-secure-store`; server-side input sanitization
  once the backend exists; consider an optional biometric app-lock given
  the sensitivity of medical/family data.
- [ ] **Crash reporting & analytics**: Sentry (or Firebase Crashlytics) +
  a privacy-respecting analytics tool — there is currently zero real-
  world crash/usage visibility.
- [ ] **Testing**: unit tests per hook/service (architecture is already
  test-friendly; flagged as an open gap in the archive below), integration
  tests for onboarding→home and report→guidance, E2E smoke tests (Maestro
  is the lower-friction pick for Expo) covering sign-up, onboarding, SOS
  trigger-and-cancel, and incident report — these four flows must never
  regress silently.
- [ ] **Device/QA matrix** before every release: iOS + Android, small +
  large phone + tablet, light + dark, screen reader on for the four
  critical flows above.

### Phase 6 — Post-launch / scale (tracked, not blocking v1)
- [ ] Expand beyond India-first assumptions: additional emergency numbers,
  languages, and GDPR/CCPA handling if/when expanding to other regions.
- [ ] Monetization decision, if any — currently assumed free; explicitly
  flagged as undecided rather than defaulted (§6).
- [ ] In-app "what's new" / staged rollout tooling once release cadence is
  real.
- [ ] Revisit the backend-stack decision from Phase 3 if RAG/scale needs
  outgrow the initial choice.

---

## 4. Pages & navigation — full map

### 4.1 Existing screens
| Route | Purpose | Status |
|---|---|---|
| `app/index.tsx` | Splash / startup router | Solid, keep as-is |
| `app/login.tsx` | Sign in | Needs: forgot-password real flow, honest Google button (Phase 0) |
| `app/register.tsx` | Sign up | Needs: real validation before backend exists (email format, password rules) |
| `app/onboarding/personal.tsx` | Name/phone/DOB/blood type | Needs: persistence (Phase 1) |
| `app/onboarding/medical.tsx` | Allergies/conditions/accessibility | Needs: persistence (Phase 1) |
| `app/onboarding/family.tsx` | Family members | Needs: persistence, remove fake pre-seed (Phase 1) |
| `app/onboarding/location.tsx` | Home address + device location | Needs: persistence (Phase 1) |
| `app/onboarding/emergency.tsx` | Emergency contacts | Needs: persistence, remove fake pre-seed (Phase 1) |
| `app/(tabs)/index.tsx` | Home | Needs: real greeting/date/counts (Phase 0), SOS entry point (Phase 1) |
| `app/(tabs)/updates.tsx` | Live updates | Needs: real area source (Phase 0) |
| `app/(tabs)/report.tsx` | Incident report | Needs: real location, camera, real name (Phase 0/1) |
| `app/(tabs)/family.tsx` | Family circle | Needs: real invite form (Phase 0), real add flow (Phase 1) |
| `app/(tabs)/safe.tsx` | Safe places | Needs: real map, real location (Phase 1) |
| `app/chat.tsx` | Ask ResQ assistant | Needs: sources UI, real history switching (Phase 0/1) |
| `app/readiness.tsx` | Readiness detail | Needs: tappable checklist (Phase 0), real completeness data (Phase 1) |
| `app/guidance-result.tsx` | Post-report guidance | Solid, keep as reference pattern for sources UI |
| `app/family-member.tsx` | Person detail | Needs: working Call/Message/Locate (Phase 0) |
| `app/place-detail.tsx` | Place detail | Needs: working Directions/Call (Phase 0) |
| `app/update-detail.tsx` | Update detail | Not yet audited in depth this pass — re-check for dead links/hardcoding when picked up |
| `app/profile.tsx` | Profile & settings | Needs: real name/stats (Phase 0), account deletion/export (Phase 0/2) |
| `app/alert-preferences.tsx` | Notification categories | Needs: persistence, actually gate real notifications (Phase 1) |
| `app/privacy-security.tsx` | Privacy settings | Needs: working data export/deletion (Phase 0/2) |

### 4.2 Missing screens to add
- [ ] SOS flow (new screen or Home-embedded control) — Phase 1
- [ ] `app/notifications.tsx` — Phase 1
- [ ] `app/privacy-policy.tsx`, `app/terms.tsx` — Phase 2
- [ ] `app/forgot-password.tsx` — Phase 0
- [ ] `app/help-support.tsx` (FAQ, contact support, report a bug) — Phase 1/5
- [ ] Internal moderation/verification tool for incident reports — not a
  mobile screen, but must exist somewhere before real reports go live —
  Phase 3

### 4.3 To remove or replace, not just leave as-is
- Pre-seeded fake contacts in `onboarding/emergency.tsx` /
  `onboarding/family.tsx` (§2.5)
- The "Continue with Google" button, unless/until real OAuth backs it
  (§2.2)
- The static fake-pin "map" illustration on `safe.tsx`/`place-detail.tsx`
  once a real map is added (§Phase 1) — don't leave both
- Placeholder app icon/splash before store submission (§2.7)
- The debug-APK-only CI workflow, once a real signed-AAB pipeline exists
  (§2.7/Phase 2) — replace, don't just add alongside indefinitely

---

## 5. Data model additions needed (`src/types/index.ts`)
- `EmergencyContact` — name, relation, phone, isPrimary
- `MedicalProfile` — bloodType, allergies[], conditions, mobilityAid,
  visualImpairment, hearingImpairment
- Extend `ProfileData` — dob, bloodType, structured address (not just a
  free-text `location` string)
- Extend `FamilyMember` — phone, lastKnownLocation, inviteStatus
  ('pending' | 'accepted'), so invites are real instead of instantly-
  accepted fakes
- Extend `SafePlace` — phone (for "Call ahead" to work)
- `SosEvent` — timestamp, cancelled boolean, contactsNotified[] — for the
  local SOS history log

---

## 6. Decisions log — flagged, not yet made

These are real product/engineering calls this plan deliberately did not
make silently. Whoever picks up each phase should decide and record the
answer here (with the date and reasoning) rather than the plan assuming one.

- [ ] **Backend stack** (Phase 3): Firebase vs Supabase vs custom Node/
  Postgres. Recommended default if no strong opinion exists: Supabase or
  Firebase, for speed with a small team — see the tradeoff writeup in
  Phase 3.
- [ ] **Minimum age / parental consent** for account creation, given
  India's DPDP Act treats under-18 as a "child." Options: (a) require
  18+ to create an account, with a lighter-weight guest/emergency-access
  mode for younger users; (b) support minors with verifiable parental
  consent flows; (c) something else. No default assumed — this affects
  registration copy and possibly the onboarding flow.
- [ ] **Maps**: `react-native-maps` (Google provider) for a real embedded
  map, vs staying with zero-SDK `Linking` deep-links to the native Maps
  app and never building an in-app map view. The plan defaults to "add a
  real embedded map" in Phase 1, but this is a real scope/cost call
  (Google Maps API billing) worth confirming.
- [ ] **Monetization**: currently assumed free/non-commercial (fits a
  public-safety app). Flagged as undecided, not defaulted, for Phase 6.
- [ ] **Guest/"Emergency App Access" mode's real scope**: today guests
  skip onboarding entirely, meaning they'd have zero emergency contacts
  and no medical info if SOS is built — should guest mode still prompt
  for at least one emergency contact, or be explicitly scoped as
  "guidance and safe-places only, no personalized SOS"? Needs a decision
  before/while building Phase 1's SOS flow.

---

## 7. Where to start next session

Smallest coherent first ticket: **Phase 0, the dead-UI fixes** — they're
small, independent, don't touch data models, and immediately stop the app
from visibly lying to a user. Good order within Phase 0:
1. Header bell + place-detail Directions/Call ahead + family-member Call/
   Message/Locate (all the same "wire a Linking call" pattern, low risk).
2. The hardcoded-name/date/count fixes on Home and Profile (pure
   read-real-state-instead-of-literal changes).
3. Everything else in Phase 0's list, in any order.

Then move to Phase 1 starting with **persisting onboarding data** — every
other Phase 1 item (SOS contacts, medical info display, real family list)
depends on onboarding output actually being saved somewhere first.

---
