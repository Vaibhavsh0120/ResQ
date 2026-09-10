// ── App configuration ───────────────────────────────────────────────────
// Single place that decides where data comes from. Every service in
// src/services/ checks `USE_MOCK_DATA` before deciding whether to return
// local demo data or call the real backend/RAG API.
//
// Swapping to a live backend later means:
//   1. Set EXPO_PUBLIC_API_BASE_URL (see .env.example)
//   2. Flip USE_MOCK_DATA to false (or just leave the env var set — see below)
// No screen or component needs to change.

export const config = {
  /**
   * Base URL for the ResQ backend / RAG API. Read from an Expo public env
   * var so it can differ per build (dev/staging/prod) without code changes.
   * See https://docs.expo.dev/guides/environment-variables/
   */
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',

  /**
   * When true (default until a backend exists), every service function
   * returns local demo data instead of calling the network. This is
   * automatically false once EXPO_PUBLIC_API_BASE_URL is set, but can be
   * force-enabled for UI development via EXPO_PUBLIC_USE_MOCK_DATA=true.
   */
  useMockData:
    process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true' || !process.env.EXPO_PUBLIC_API_BASE_URL,

  /** Simulated network latency for mock responses, so loading states are visible during UI dev. */
  mockLatencyMs: 450,

  /** Default request timeout for real API calls. */
  requestTimeoutMs: 15000,

  endpoints: {
    updates: '/v1/updates',
    familyStatus: '/v1/family',
    safePlaces: '/v1/safe-places',
    reportIncident: '/v1/reports',
    guidance: '/v1/guidance', // RAG: retrieve safety guidance for a disaster type
    chat: '/v1/chat', // RAG: conversational assistant, streaming-capable
    profile: '/v1/profile',
    medicalProfile: '/v1/medical-profile',
  },
} as const;
