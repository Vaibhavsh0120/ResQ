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

## Project structure

```
app/                      expo-router routes (file-based navigation)
  _layout.tsx              root stack: providers + navigator
  index.tsx                splash screen
  login.tsx                auth screen
  register.tsx              sign up
  forgot-password.tsx       locally-simulated password reset
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
  components/               shared UI building blocks (Header, buttons, icons.ts, ...)
  theme/                    design tokens + ThemeContext (light/dark mode)
  context/                  app-wide React context (auth, tab bar visibility)
  types/                    shared TypeScript types, including RAG-shaped types
  data/                     mock data, one file per domain (mockFamily.ts, mockGuidance.ts, ...)
  services/                 data-fetching layer — see "Architecture" below
  hooks/                    React hooks screens actually call (useUpdates, useChat, ...)
  utils/                    small pure helpers (format.ts: greetings, dates, initials)

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

## Known limitations / next steps

- **Auth is a stub.** `login.tsx` accepts any input and always succeeds;
  wire it to a real auth service and add the token-injection point noted
  in `src/services/apiClient.ts` (`Authorization` header comment).
- **No real map view yet.** `useDeviceLocation()` and real coordinates
  exist end-to-end now (see "Device location" below), but Safe places and
  place-detail still show a static pin illustration rather than an actual
  map — the next natural step, now that there's something real to render.
- **`FamilyMember.lastKnownLocation` is free text only** (no lat/long), so
  "Locate" on `family-member.tsx` opens a name-based Maps search rather
  than a coordinate-based one. This only matters once family members can
  share live coordinates, which needs a backend to receive them (no such
  backend exists yet).
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

