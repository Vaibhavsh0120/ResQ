import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Local data export & account deletion ───────────────────────────────
// Backs privacy-security.tsx's "Download my data" / "Delete my account"
// rows (previously dead — see PROGRESS.md Phase 0). There's no backend
// yet, so both operations work entirely against this device's own
// AsyncStorage — which today holds everything the app knows about the
// user (auth/session, onboarding status, notifications, guides-read
// count, theme preference).
//
// Deliberately reads `getAllKeys()` rather than a hardcoded key list, so
// this stays correct as new features add their own storage keys — see
// PROGRESS.md for the full list as of this writing.
//
// Once real accounts exist (Phase 3), these become genuine GDPR/DPDP
// data-export and account-erasure requests to the backend; the export
// should then also include whatever server-side data exists (profile,
// family circle, incident reports, etc.), and deletion should be a real
// server-side erasure, not just a local wipe. The screen and its
// confirm-then-act flow don't need to change — only what these two
// functions call.

/**
 * Reads every key this app has written to AsyncStorage and returns it as
 * a single JSON object, e.g. `{ "@resq_auth_state": "...", ... }`. This is
 * the full "download my data" export.
 */
export async function exportLocalData(): Promise<Record<string, string | null>> {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  return Object.fromEntries(entries);
}

/**
 * Wipes every key this app has written to AsyncStorage. Does not itself
 * navigate or update any in-memory auth state — callers should follow
 * this with `logout()` so React state and storage stay in sync.
 */
export async function wipeLocalData(): Promise<void> {
  await AsyncStorage.clear();
}
