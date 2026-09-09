// ── Domain types ─────────────────────────────────────────────────────────
// Shared between mock and real service implementations. Every entity has an
// `id` (even in mock data) because a real backend will key on it — adding
// that now avoids reshaping components later.

// ---- Family -----------------------------------------------------------

export type FamilyStatusTone = 'success' | 'warning';

export type FamilyMember = {
  id: string;
  name: string;
  relation: string;
  initials: string;
  status: string;
  tone: FamilyStatusTone;
  lastUpdatedAt?: string; // ISO timestamp, set by a real backend
  phone?: string; // enables Call/Message from family-member.tsx
  lastKnownLocation?: string; // free-text for now; becomes lat/long once a backend can receive live updates
  /**
   * Marked during onboarding's emergency-contacts step (or later from the
   * Family tab) as someone who should be message-first during an SOS.
   * SOS itself (app/sos.tsx) still messages everyone with a phone number —
   * this flag is surfaced as a priority indicator rather than a hard
   * filter, since in a real emergency reaching more people is strictly
   * better than reaching fewer.
   */
  isPrimaryEmergencyContact?: boolean;
};

// ---- Profile ------------------------------------------------------------

export type ProfileData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  note: string;
  dob?: string; // free-text as entered during onboarding (DD / MM / YYYY) — not parsed/validated yet
  bloodType?: string;
};

// ---- Medical profile (onboarding) ----------------------------------------

/**
 * Collected during onboarding's medical step and shown to first responders
 * in an emergency. Local-only today (see onboardingService.ts) — there's no
 * backend yet to sync this against, and no screen currently displays it
 * back to the user post-onboarding (a natural Phase 1/5 follow-up: surface
 * this on a "medical ID" card reachable from Profile or directly from the
 * SOS confirmed screen, similar to iOS/Android's own Medical ID feature).
 */
export type MedicalProfile = {
  allergies: string[];
  conditions: string; // free-text, as entered
  usesMobilityAid: boolean;
  hasVisualImpairment: boolean;
  hasHearingImpairment: boolean;
};

// ---- Safe places ----------------------------------------------------------

export type SafePlace = {
  id: string;
  name: string;
  detail: string;
  status: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  phone?: string; // enables "Call ahead" from place-detail.tsx
};

// ---- Live updates -----------------------------------------------------------

export type UpdateTone = 'warning' | 'success' | 'danger';

export type UpdateAlert = {
  id: string;
  title: string;
  detail: string;
  tone: UpdateTone;
  iconName: 'CloudRain' | 'Home' | 'CarFront';
  publishedAt?: string; // ISO timestamp
  source?: RagSource; // where this update came from, once backed by RAG/feeds
};

// ---- RAG: shared source/citation shape -----------------------------------

/**
 * A single retrieved source backing a piece of guidance or a chat answer.
 * Mirrors what most RAG backends return alongside generated text, so the UI
 * can render "why should I trust this" without changes once real retrieval
 * is wired in.
 */
export type RagSource = {
  id: string;
  title: string;
  url?: string;
  publisher?: string; // e.g. "NDMA", "National Weather Service"
  snippet?: string; // short excerpt used to justify the citation
};

// ---- Incident reporting + post-report guidance ---------------------------

export type IncidentReportInput = {
  types: string[]; // selected hazard types, e.g. ['Flood']
  location: string;
  description: string;
  photoUri?: string | null;
};

export type IncidentReportResult = {
  id: string;
  status: 'reported' | 'verified' | 'resolved';
  submittedAt: string;
};

export type GuidanceItem = {
  title: string;
  detail: string;
  iconName: 'Bell' | 'Users' | 'LifeBuoy';
};

/**
 * Guidance content for a disaster type. In mock mode this comes from static
 * copy; in RAG mode `sources` holds the retrieved documents that justify
 * `doThisNow` / `avoid` / `why`, and `confidence` reflects retrieval quality
 * so the UI can show a fallback notice for low-confidence answers.
 */
export type DisasterGuidance = {
  disasterType: string;
  doThisNow: string[];
  avoid: string[];
  why: string;
  sources: RagSource[];
  confidence?: 'high' | 'medium' | 'low';
  generatedAt?: string;
};

// ---- Chat / conversational RAG assistant ---------------------------------

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  sources?: RagSource[]; // present on assistant messages once backed by RAG
  pending?: boolean; // true while a streaming response is still arriving
};

export type ChatThreadSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

/** A previous thread's full message list, keyed by ChatThreadSummary.id. Mock-only until chat history has a real backend. */
export type ChatThread = ChatThreadSummary & {
  messages: ChatMessage[];
};

/** One chunk of a streamed chat response, as a real RAG backend would emit over SSE/WebSocket. */
export type ChatStreamEvent =
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: RagSource[] }
  | { type: 'done' }
  | { type: 'error'; message: string };

// ---- Notifications ---------------------------------------------------------

export type NotificationKind = 'alert' | 'family' | 'readiness' | 'system';

/**
 * A single item behind the Header bell. Local-only today (no push server —
 * see PROGRESS.md Phase 1); read state is persisted on-device so it survives
 * app restarts even before a backend exists.
 */
export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string; // ISO timestamp
  read: boolean;
};

// ---- SOS -------------------------------------------------------------

/**
 * One SOS activation, logged locally on-device (no backend yet — see
 * PROGRESS.md Phase 1/3). `contactsNotified` records who an SMS share-sheet
 * was opened for at the time, not delivery confirmation — there's no way to
 * confirm an SMS actually sent from a share sheet, so the log is honest
 * about intent ("we opened a message to these people") rather than claiming
 * a guarantee it can't back up.
 */
export type SosEvent = {
  id: string;
  triggeredAt: string; // ISO timestamp
  calledEmergencyNumber: boolean; // whether tel:112 was opened
  contactsNotified: { id: string; name: string }[]; // family members an SMS was opened for
  location?: string; // free-text area/address at time of trigger, if known
};
