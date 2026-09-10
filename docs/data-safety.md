# Play Store Data Safety mapping

This maps ResQ's actual current behavior onto the categories Google
Play Console's **Data Safety** form asks about (Data collection,
sharing, and security practices). It's written to fill out that form
accurately when this app is actually submitted — not a legal document
itself, and not a substitute for reading the current form in Play
Console (its exact categories/wording can change).

**Re-check this against the live Play Console form before submitting** —
this was written from the form's structure as of this app's last
Phase 2 pass and may drift if Google changes the questionnaire.

## Headline answer: does the app collect or share user data?

- **Shares data with third parties:** No. There is no backend
  (see `PROGRESS.md`'s working assumptions) and no analytics/ads SDK in
  `package.json` — nothing is sent to ResQ's developers, Anthropic, or
  any other party.
- **Collects data:** Yes, but only *on-device* — see below. Play
  Console's form asks about collection regardless of where it's stored,
  so on-device-only storage still needs to be declared; it just means
  every "shared with third parties" answer is "No" and every "data is
  transmitted off device" follow-up is "No."
- **Data can be deleted:** Yes — Profile → Privacy & security →
  "Delete my account" wipes every key listed below and signs out. This
  is a real, complete, immediate deletion (there's no server-side copy
  to separately purge).
- **Encryption in transit:** Not applicable today — nothing is
  transmitted. Revisit once Phase 3's backend exists.

## Data types collected (on-device only)

Each row: the Play Console data-type category it maps to, what ResQ
actually stores under it, and where in the codebase to verify this if
it drifts.

| Play Console category | What ResQ stores | Source of truth |
|---|---|---|
| **Name** | Account name, entered at registration | `AuthContext` → `@resq_auth_state` |
| **Email address** | Account email, entered at registration | `AuthContext` → `@resq_auth_state` |
| **Phone number** | User's own phone (Profile); family/emergency contacts' phone numbers | `@resq_profile`, `@resq_family_members` |
| **User ID** | Locally-generated IDs only (e.g. `fam-…`, `sos-…`) — not tied to any account system, since there is no backend | `src/services/*.ts`'s id generation |
| **Physical address** | Free-text home area (city/state/landmark composed by onboarding), not a structured street address | `@resq_profile`'s `location` field, `@resq_onboarding_location` |
| **Precise location** | Device GPS coordinates, requested only when Safe places/Report/SOS actually need them; not persisted beyond the current screen session | `src/hooks/useDeviceLocation.ts` (no storage key — in-memory only) |
| **Health information** | Allergies, conditions, mobility/vision/hearing accessibility needs (onboarding's medical step); blood type (profile) | `@resq_medical_profile`, `@resq_profile`'s `bloodType` |
| **Photos** | An optional photo attached to an incident report, held in screen state only for the current submission | `app/(tabs)/report.tsx`, `src/services/reportService.ts` (see note below) |
| **App activity** | Chat message history (mock/local only), guides-read count, SOS activation history, notification read state | `@resq_sos_history`, `@resq_guides_read_count`, `@resq_notifications` |
| **App info and performance** | None collected — no crash reporting or analytics SDK is installed | `package.json` |
| **Device or other identifiers** | None collected | — |

**Note on incident-report photos:** checked directly —
`reportService.ts`'s mock branch does not persist the report or its
photo URI anywhere; `submitIncidentReport()` returns a result object
and discards the input. Nothing about a submitted report (photo
included) survives past that screen's own state, let alone an app
restart. Declare this as "collected but not retained" rather than
persistent storage. This will change the moment Phase 4 wires this
service to a real backend, or if a future session adds local
persistence for a "my past reports" feature — re-check this note
against the actual code at that point rather than assuming it still
holds.

## Purpose of collection

For every category above, the declared purpose in Play Console should
be **"App functionality"** — none of it is used for advertising,
analytics, fraud prevention, or personalization beyond showing the
user their own data back to them. There is no purpose that involves a
third party, because nothing leaves the device.

## Voluntary vs. required

Everything above is user-entered and mostly skippable:
- Name/email/password and date of birth: required to create an
  account (date of birth specifically gates the minimum-age check —
  see `src/utils/age.ts`).
- Every onboarding step (medical, family, location, emergency
  contacts): skippable — "Skip for now" is available on each step,
  confirmed in `app/onboarding/*.tsx`.
- Device location, camera/photo access: requested only at the moment a
  feature needs them, and the OS permission prompt can be declined —
  screens fall back to profile data or a disabled action rather than
  crashing.

## Security practices to declare

- **Data encrypted in transit:** N/A — nothing is transmitted.
- **Data encrypted at rest:** Relies on the OS's own at-rest protections
  for app storage (iOS/Android both encrypt app-private storage by
  default at the OS level) — ResQ does not add its own additional
  encryption layer on top of `AsyncStorage`. Worth a real decision once
  a backend exists and sensitive data (e.g. medical info) might sync
  off-device.
- **Users can request data deletion:** Yes, in-app, immediately — see
  "Delete my account" above. No separate request/wait process exists
  because none is needed yet.
- **Independent security review:** No — has not been performed. Flag as
  a pre-launch item once real backend infrastructure exists (Phase 3+).

## What changes this document

Any of the following should trigger a real re-edit of this file (not
just a comment update) before the next store submission:
- Phase 3's backend going live for any domain — at that point "shares
  data with third parties" and "encrypted in transit" both need
  re-answering for whichever domain switched over, not the whole app at
  once (services cut over one domain at a time by design — see
  `PROGRESS.md` §5).
- Adding any analytics, crash-reporting, or ads SDK.
- Any change to what `exportLocalData()`
  (`src/services/localDataService.ts`) actually reads — it walks
  `AsyncStorage.getAllKeys()` rather than a hardcoded list, so it
  already stays correct as new features add storage keys, but this
  document's table above is a hardcoded list and will drift if a new
  domain's storage key isn't added here too.
