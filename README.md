# ResQ

A disaster-preparedness and community-safety mobile app: an on-device SOS
alert, live local updates, incident reporting with AI-assisted guidance, a
family safety circle, nearby safe places, and a conversational safety
assistant.

Built with **Expo (React Native) + expo-router**, TypeScript throughout.

## Getting started

```bash
npm install
npx expo start
```

Then press `i` for iOS simulator, `a` for Android emulator, or scan the QR
code with Expo Go on a physical device.

The app runs entirely on local mock data out of the box — no backend
required to explore every screen. See **Connecting a real backend** below
for how to point it at a live API.

**One real limitation with plain Expo Go:** the map screens (Safe places,
a place's detail view, a family member with a saved location) use
MapLibre, a native module that isn't part of Expo Go's fixed set of
bundled libraries. In Expo Go you'll see a `TurboModuleRegistry.getEnforcing(...):
'MLRNCameraModule' could not be found` error on those specific screens —
every other screen works fine, since this is a MapLibre-only limitation,
not a general app issue. See **Running with maps (dev-client build)**
below to fix it.

## Project structure

```
app/                      expo-router routes (file-based navigation)
  _layout.tsx              root stack: providers + navigator
  index.tsx                splash screen
  login.tsx                auth screen
  register.tsx              sign up (real DOB + minimum-age gate, see Legal & compliance below)
  forgot-password.tsx       locally-simulated password reset
  privacy-policy.tsx         in-app Privacy Policy (see Legal & compliance below)
  terms.tsx                   in-app Terms of Service (see Legal & compliance below)
  onboarding/                five-step first-run flow, real per-step persistence (see below)
    _layout.tsx
    personal.tsx              name / phone / DOB / blood type
    medical.tsx                allergies / conditions / accessibility
    location.tsx               home address, device-location-assisted
    family.tsx                 family circle members
    emergency.tsx              emergency contacts — merges into the same circle as family.tsx (see Notable UX decisions)
  profile.tsx               profile (stack screen, hides tab bar)
  chat.tsx                  Ask ResQ assistant (stack screen, hides tab bar)
  readiness.tsx              readiness detail (opened from the Home hero card)
  guidance-result.tsx        post-report RAG guidance results
  notifications.tsx          Header bell destination — local read/unread list
  alert-preferences.tsx      notification category toggles
  privacy-security.tsx       data export / account deletion (Play Store compliance)
  family-member.tsx          person detail: Call / Message / Locate
  place-detail.tsx           safe-place detail: Directions / Call ahead
  update-detail.tsx          live-update detail
  sos.tsx                    emergency SOS: press-and-hold trigger, tel:112 + SMS to contacts
  sos-history.tsx            local log of past SOS activations (opened from Profile)
  (tabs)/                    primary tab navigator
    _layout.tsx
    index.tsx                 Home
    updates.tsx                Live updates
    report.tsx                 Report & guidance
    family.tsx                 Family / safety circle
    safe.tsx                   Safe places

src/
  components/               shared UI building blocks (Header, buttons, icons.ts, MiniMap.tsx, ...)
  theme/                    design tokens + ThemeContext (light/dark mode)
  context/                  app-wide React context (auth, tab bar visibility)
  types/                    shared TypeScript types, including RAG-shaped types
  data/                     mock data, one file per domain (mockFamily.ts, mockGuidance.ts, ...)
  services/                 data-fetching layer — see "Architecture" below
                              (includes medicalProfileService.ts — durable medical-ID
                              storage, separate from onboarding's draft-only storage —
                              and localNotificationsService.ts — on-device reminder
                              scheduling via expo-notifications)
  hooks/                    React hooks screens actually call (useUpdates, useChat, ...)
  utils/                    small pure helpers (format.ts: greetings/dates/initials; age.ts: DOB parsing + minimum-age check)

docs/
  data-safety.md            Play Store Data Safety form mapping (see Legal & compliance below)

assets/images/              app icon, splash, favicon — real brand mark, light/dark variants, no colored background
assets/videos/               startup animation videos (light/dark mode)
```

## Architecture: how data flows

Screens never fetch data or import mock data directly. Every screen calls a
**hook** (`src/hooks/`), every hook calls a **service** (`src/services/`),
and every service decides — based on one config flag — whether to return
local mock data or call a real API:

```
Screen  →  hook (loading/error state)  →  service (mock vs. real switch)  →  mock data | real API
```

This means:

- Screens are written once and never change when the backend goes live.
- Every domain (updates, family, safe places, guidance, chat, reports,
  readiness, profile) follows the exact same pattern, so a new backend
  engineer only needs to learn it once.
- UI/UX work (this session's task) and backend work can proceed in
  parallel — the seam between them is `src/services/`.

Within the mock branch, "mock data" now means two different things
depending on the domain: some services (guidance, chat's canned replies)
return a static constant every time, while others that need to survive an
app restart (family, profile, notifications, SOS history, onboarding
drafts) read/write AsyncStorage, seeded from the static mock constant on
first use. Either way the hook/screen layer sees the exact same shape —
this is purely an implementation detail of the mock branch, not a change
to the architecture above.

### Onboarding persistence

Every onboarding screen (`app/onboarding/*.tsx`) used to hold what the
user typed in local `useState` only — finishing onboarding just flipped
one boolean and every field was lost on the next launch. Each step now
writes its own draft to AsyncStorage as the user continues (or skips —
skipping means "don't require finishing this step," not "discard what's
already there"), via `src/services/onboardingService.ts`, and reloads
that draft on mount so returning to an earlier step pre-fills it.

On completion, the collected drafts merge into the app's real,
already-existing stores rather than a separate onboarding-only store:

- `personal`/`medical`/`location` merge into `ProfileData`/`MedicalProfile`
  (`profileService.mergeProfile()`).
- `family` and `emergency` merge into one family circle
  (`onboardingService.mergeOnboardingContacts()`, de-duplicated by phone)
  and are written via `familyService.seedFamilyMembers()` — see "Notable
  UX decisions" below for why there's one merged list instead of two.

Building this also surfaced a pre-existing bug unrelated to onboarding
itself: `familyService.ts` and `profileService.ts` only mutated in-memory
React state, so adding a family member from the Family tab, or editing
your profile, was silently lost on app restart. Both are now
AsyncStorage-backed, seeded from their mock data once, matching the
pattern already used by `notificationsService.ts`/`sosService.ts`.
`AuthContext.logout()` clears the onboarding draft (not the profile or
family circle themselves) so a different user on the same device doesn't
inherit a half-finished draft.

### The switch: mock data vs. real backend

`src/config/env.ts` exports `config.useMockData`, computed from environment
variables:

| Env var | Effect |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` unset | Uses mock data (default — works with zero setup) |
| `EXPO_PUBLIC_API_BASE_URL=https://...` | Calls the real backend at that URL |
| `EXPO_PUBLIC_USE_MOCK_DATA=true` | Forces mock data even if a base URL is set (handy for UI dev against an unfinished backend) |

Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_API_BASE_URL` once a
backend exists. **No screen, hook, or component needs to change.**

### Where RAG plugs in

Three domains are explicitly designed around retrieval-augmented generation:

1. **`src/services/guidanceService.ts`** — `fetchGuidance(types)`. Given the
   hazard types a user selected (Report tab) or an incident they just
   submitted, this is where a real backend would retrieve relevant chunks
   from a knowledge base of emergency-response documents (NDMA, WHO, local
   authority guidelines, etc.) and generate grounded `doThisNow` / `avoid` /
   `why` copy. The response type (`DisasterGuidance` in `src/types/index.ts`)
   already includes `sources: RagSource[]` (title/publisher/url/snippet) and
   a `confidence` level, and `app/guidance-result.tsx` already renders both
   — citations and a "well-supported / good match / limited match" badge —
   so no UI work is needed once real retrieval exists.

2. **`src/services/chatService.ts`** — `streamChatReply(...)`. Built around
   streaming from day one: it takes an `onEvent` callback and emits
   `{ type: 'token' }`, `{ type: 'sources' }`, `{ type: 'done' }`, or
   `{ type: 'error' }` events (see `ChatStreamEvent` in `src/types/index.ts`).
   The mock implementation fakes this by chunking a canned reply
   word-by-word; the real implementation reads a fetch `ReadableStream` of
   newline-delimited JSON (adjust the framing in the function if the real
   backend uses SSE instead). `src/hooks/useChat.ts` and `app/chat.tsx`
   already consume it token-by-token, so switching to a live model requires
   changing only the body of `streamChatReply`.

3. **`src/services/updatesService.ts`** — `fetchUpdates()`. Each
   `UpdateAlert` already carries an optional `source: RagSource`, so a
   backend that retrieves and ranks local documents (weather bulletins,
   municipal notices, community reports) can attach provenance without a
   type change.

`RagSource` (in `src/types/index.ts`) is the one shared citation shape used
across all three, so a single "Sources" UI pattern works everywhere.

### Adding a new backend-connected feature

1. Add/extend a type in `src/types/index.ts`.
2. Add mock data in `src/data/mock<Domain>.ts` matching that type exactly.
3. Add a service in `src/services/<domain>Service.ts` with the
   `if (config.useMockData) { ... } return apiRequest(...)` pattern (see
   any existing service for the template).
4. Add a hook in `src/hooks/use<Domain>.ts` (usually a thin
   `useAsync(fetchThing, [])` wrapper — see `useUpdates.ts` for the
   simplest example, or `useGuidance.ts` for an on-demand/lazy variant).
5. Call the hook from the screen. Never import the service or mock data
   directly from a screen.

## Theming — no hardcoded colors

Every color in the app comes from `src/theme/colors.ts` (`lightColors` /
`darkColors`) via `useAppTheme().colors`. There should be **zero** literal
hex/rgba values in any screen or component — if you need a new color,
add a named token to both palettes in `colors.ts` first.

This is what makes dark mode correct: every "on a colored background" token
(`onBrand`, `onDanger`, `featuredIconFg`, etc.) is pre-computed for
contrast in each palette, so a component never has to guess whether white
or black text belongs on top of a given fill.

Toggle dark mode from Profile → appearance row, or it follows the system
setting by default (`src/theme/ThemeContext.tsx`).

## Legal & compliance

- **Privacy Policy / Terms of Service** (`app/privacy-policy.tsx`,
  `app/terms.tsx`) are real, app-specific content — not filler text —
  describing exactly what this no-backend build actually does (see each
  file's own header comment). Reachable from `login`/`register`'s footer
  links (works pre-login — both screens are registered outside every
  `Stack.Protected` group in `app/_layout.tsx` for exactly that reason)
  and from Profile → Privacy & security.
- **Minimum age: 18**, enforced at registration (`app/register.tsx`,
  `src/utils/age.ts`) via a required date-of-birth field. Rationale:
  India's DPDP Act 2023 (this app's first launch market) requires
  verifiable parental/guardian consent to process a child's data, and
  there's no backend to run a real consent flow against — see
  `src/utils/age.ts`'s doc comment and the Privacy Policy's "Minimum
  age" section for the full reasoning. Onboarding's own `dob` field
  (collected later, for the profile) is unaffected and unchanged.
- **Play Store Data Safety mapping**: `docs/data-safety.md` maps this
  app's actual data collection onto Play Console's Data Safety
  questionnaire categories — written to be filled into that form
  directly at submission time, with source-of-truth file references so
  it can be re-verified rather than trusted blindly as it ages.
- **CI build signing**: `.github/workflows/README.md` documents that
  the existing `build-release.yml` produces genuinely unsigned
  artifacts (fine for Android sideloading/testing; the iOS IPA cannot
  install on a real device at all without signing) and what a real
  signed pipeline would need — deliberately not built yet, since it
  needs an actual Apple Developer Program membership and signing
  credentials, which is a real-world/paid decision, not a code change.

## Notable UX decisions

- **Safe places** shows the profile icon in its header (not a back arrow),
  because it's a primary tab destination like Home/Updates/Family, not a
  drill-down screen.
- **Profile** and **Chat** hide the bottom tab bar while open
  (`src/context/NavVisibilityContext.tsx` + `useHideTabBar()` hook) since
  they're full-screen contexts, not tab destinations.
- Tapping the readiness card on Home opens **`/readiness`**, a dedicated
  page with a checklist and "what to do next" guidance — it's not just a
  progress number.
- Submitting an incident report leads to **`/guidance-result`**, which
  fetches and displays disaster-specific guidance (with sources) for the
  hazards just reported, so reporting something also gets the user help.
- **SOS requires a deliberate hold**, not a tap — a 2.5s press-and-hold with
  live progress feedback, so a pocket-press can't fire it. It calls `tel:112`
  (the user still has to confirm the call — no platform lets an app dial
  without that) and opens one SMS share sheet per family member with a
  phone number on file. `/sos-history` (linked from Profile) is a local-only
  log of past activations, since there's no backend yet to sync it against.
- **Onboarding's family circle and emergency-contacts steps write into one
  shared list, not two.** There's no separate `EmergencyContact` type —
  a contact entered in either step becomes a `FamilyMember` (optionally
  flagged `isPrimaryEmergencyContact`), de-duplicated by phone if the same
  person was entered in both steps. This keeps SOS's contact list and the
  Family tab in sync by construction rather than needing to reconcile two
  separate stores.
- **Incident reports support both camera capture and a library picker**
  (`app/(tabs)/report.tsx`), not gallery-only. "Take photo" and "Choose
  from library" are two explicit buttons rather than one combined picker,
  since a real incident report often means capturing what's happening
  right now rather than something already on the device.
- **Medical info has a read-only display surface on Profile** — a
  "Medical ID" card (allergies, conditions, accessibility needs) shown
  only when the user actually filled in onboarding's medical step. It's
  read-only from Profile; editing still happens by re-running that
  onboarding step, same as other onboarding-collected fields with no
  dedicated edit screen yet.
- **The family check-in reminder is a real, one-off local notification,
  not a repeating daily alarm.** Toggling "Remind me" on `family.tsx`'s
  check-in card schedules a single `expo-notifications` reminder 24 hours
  out via `src/services/localNotificationsService.ts` — deliberately not
  a recurring 9am trigger, since nothing in the app actually configures a
  fixed daily check-in time and a repeating notification would imply
  otherwise. This is on-device only; there's no push/remote notification
  server.

## Known limitations / next steps

- **Auth is a stub.** `login.tsx` accepts any input and always succeeds;
  wire it to a real auth service and add the token-injection point noted
  in `src/services/apiClient.ts` (`Authorization` header comment).
- **`FamilyMember.latitude`/`.longitude` are static snapshots, not live
  tracking.** Real for the members who have a location "on file" (mirrors
  `lastKnownLocation`'s own "not shared yet" case), but there's no
  backend yet for a member's own device to report a live position — see
  "Maps" below.
- **No formal test suite for services/hooks in isolation** — there is a
  render-smoke suite (`npm run test:smoke`, `__tests__/smoke.test.tsx`)
  that mounts every screen and waits out its mock data fetch, but the
  service/hook split (easy to unit test independent of React — mock
  `fetch`/`AsyncStorage`, assert on the mock/real switch) is still a good
  first target for real unit tests.

### Device location

`src/hooks/useDeviceLocation.ts` wraps `expo-location` to get the user's
live coordinates (`getCurrentPositionAsync`, with a best-effort reverse
geocode). It's request-based rather than a continuous watcher — nothing in
the app currently needs a live-moving position, just "where am I right
now" at the moment a screen opens — with a `refresh()` function for
re-fetching on demand.

`useCurrentArea()` (used by Home, Family, Safe, Updates, Report, and SOS)
now prefers this live location over the profile's static home address,
falling back automatically while a fix is loading or if permission was
denied — every screen that already called `useCurrentArea()` picked this
up with no code changes. Two screens use the real coordinates directly:

- **Safe places** queries `safePlacesService.ts` with live coordinates;
  the mock branch sorts the fixed place list by real distance from the
  user and updates each place's displayed distance to match.
- **SOS** (`app/sos.tsx`) includes a real Google Maps link in the SMS sent
  to family contacts and in the local SOS history log, when a fix is
  available — falling back to the free-text area otherwise.

### Maps

The shared map surface used by `safe.tsx`, `place-detail.tsx`, and
`family-member.tsx` — deliberately just those three (not every screen
with a coordinate) to keep maps to places they add real value, not
decoration. Split by platform: `src/components/MiniMap.shared.tsx` (types
+ the static-pin fallback, used by both), `src/components/MiniMap.tsx`
(native), `src/components/MiniMap.web.tsx` (web) — Metro/Expo Router picks
the right one automatically per platform.

- **Native**: a real MapLibre (`@maplibre/maplibre-react-native`) map
  over [OpenFreeMap](https://openfreemap.org) vector tiles — no API key,
  no request/view limits by the operator's own policy. Requires a
  dev-client rebuild (`expo prebuild`); **does not work in plain Expo
  Go**, since it's native code, not part of the Expo SDK.
- **Web**: also a real interactive map — `maplibre-gl` (the JS SDK,
  pinned to the v5 line; v6 is ESM-only and needs bundler-specific Web
  Worker wiring Metro doesn't support) over the same OpenFreeMap tiles.
  Works in a plain browser, no dev-client build needed. `MiniMap` only
  falls back to the stylized static-pin illustration when there are no
  valid coordinates to show at all (e.g. a family member with no
  location on file yet) — same fallback on both platforms in that case.
- `family-member.tsx`'s map only renders when that person actually has
  `latitude`/`longitude` on file (added alongside the existing free-text
  `lastKnownLocation`, not replacing it) — there's no backend yet for a
  family member's own device to report a live position, so these are
  static snapshots seeded in `mockFamily.ts`, not live tracking.
- See `PROGRESS.md` §3.1 for the full SDK-choice rationale and the
  per-screen review of where a map was and wasn't worth adding.

### Running with maps (dev-client build)

`expo-dev-client` is already installed and configured (`app.json`'s
`plugins` array includes both `@maplibre/maplibre-react-native` and
`expo-dev-client`) — a dev-client build is a real, installable native
app with those native modules built in, unlike Expo Go's fixed,
pre-built app. You only need to build it once per device/emulator; after
that, `npx expo start` reconnects to it the same way it does to Expo Go.

**Local build (needs the platform's native toolchain installed):**

```bash
# Android — needs Android Studio / the Android SDK installed
npx expo run:android

# iOS — needs a Mac with Xcode installed; not possible on Windows/Linux
npx expo run:ios
```

Each command does a one-time native build (`expo prebuild` generates the
`android/`/`ios/` folders, then the platform's own build tool compiles
them) and installs the result on a connected device or running
emulator/simulator. Expect the first build to take several minutes —
subsequent `npx expo start` sessions reuse this same installed build and
reload instantly, the same fast-refresh workflow as Expo Go.

**If you already have a dev-client build installed and still see
`TurboModuleRegistry.getEnforcing(...): 'MLRNCameraModule' could not be
found` (or any other native-module-not-found error):** the terminal
banner will say `Using development build`, which confirms Metro found a
dev client and is not falling back to Expo Go — but that dev client's
*native binary* was built before MapLibre (or any other native module)
was added to `app.json`'s `plugins` array, so the module genuinely isn't
compiled into it. `npx expo start` alone never rebuilds the native
binary — it only reloads JS into whatever native app is already
installed. **Re-run `npx expo run:android` (or `run:ios`, or a fresh EAS
build)** to actually rebuild and reinstall; this is required any time
`app.json`'s `plugins` array changes, not just the first time.

**No local toolchain (e.g. building an iOS dev client from Windows):**
[EAS Build](https://docs.expo.dev/build/introduction/) builds in the
cloud instead of locally — needs a free Expo account, no Mac required
even for iOS:

```bash
npx eas-cli build --profile development --platform android
# or: --platform ios
```

This project doesn't have an `eas.json` yet since no EAS build has been
set up — `eas build` on first run offers to generate one interactively
(select the "development" build profile, which is what bundles
`expo-dev-client`). Once the cloud build finishes, EAS gives you a
QR-code/link to install it directly on your device.

**Note for this project specifically:** `expo-secure-store` and
`expo-crypto` (used by `src/services/secureStorage.ts` for at-rest
encryption — see `docs/data-safety.md`) are both included in Expo Go
already, unlike MapLibre — so a dev-client build is only actually
required for the map screens, not for encryption to work. If you only
need to test screens without a map, plain Expo Go still works fine.

