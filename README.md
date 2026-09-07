# ResQ

A disaster-preparedness and community-safety mobile app: live local updates,
incident reporting with AI-assisted guidance, a family safety circle, nearby
safe places, and a conversational safety assistant.

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
  profile.tsx               profile (stack screen, hides tab bar)
  chat.tsx                  Ask ResQ assistant (stack screen, hides tab bar)
  readiness.tsx              readiness detail (opened from the Home hero card)
  guidance-result.tsx        post-report RAG guidance results
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
  context/                  app-wide React context (tab bar visibility)
  types/                    shared TypeScript types, including RAG-shaped types
  data/                     mock data, one file per domain (mockFamily.ts, mockGuidance.ts, ...)
  services/                 data-fetching layer — see "Architecture" below
  hooks/                    React hooks screens actually call (useUpdates, useChat, ...)

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

## Known limitations / next steps

- **Auth is a stub.** `login.tsx` accepts any input and always succeeds;
  wire it to a real auth service and add the token-injection point noted
  in `src/services/apiClient.ts` (`Authorization` header comment).
- **Location is not yet wired to `expo-location`.** `safePlacesService.ts`
  accepts `latitude`/`longitude` but the Safe places screen doesn't request
  device location yet — add an `expo-location` permission request and pass
  the result into `useSafePlaces({ latitude, longitude })`.
- **No test suite yet.** The service/hook split makes services easy to unit
  test independent of React (mock `fetch`, assert on the mock/real switch)
  — a good first testing target.
