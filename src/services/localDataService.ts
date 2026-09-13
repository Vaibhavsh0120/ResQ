import AsyncStorage from '@react-native-async-storage/async-storage';
import * as secureStorage from './secureStorage';

// ── Local data export & account deletion ───────────────────────────────
// Backs privacy-security.tsx's "Download my data" / "Delete my account"
// rows (previously dead — see AGENT.md). There's no backend
// yet, so both operations work entirely against this device's own
// AsyncStorage — which today holds everything the app knows about the
// user (auth/session, onboarding status, notifications, guides-read
// count, theme preference).
//
// Deliberately reads `getAllKeys()` rather than a hardcoded key list, so
// this stays correct as new features add their own storage keys — see
// AGENT.md for the full list as of this writing.
//
// 2026-09-10: profile/medical/family data is now encrypted at rest (see
// secureStorage.ts) — both functions below were updated so that change
// stays invisible to the user, exactly as promised in the Privacy Policy:
//   - exportLocalData decrypts each value before returning it, so
//     "download my data" still hands back real, readable JSON rather than
//     opaque ciphertext for whichever keys happen to be encrypted.
//   - wipeLocalData also destroys the SecureStore-held encryption key, not
//     just the AsyncStorage ciphertext — otherwise "delete my account"
//     would leave a real secret sitting in the OS keychain/keystore after
//     telling the user everything was erased.
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
 * the full "download my data" export. Values under an encrypted domain
 * (profile, medical profile, family circle) are decrypted first so the
 * export is genuinely readable, not raw ciphertext.
 */
export async function exportLocalData(): Promise<Record<string, string | null>> {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  const decrypted = await Promise.all(
    entries.map(async ([key, value]) => [key, value === null ? null : await secureStorage.decryptForExport(value)] as const)
  );
  return Object.fromEntries(decrypted);
}

/**
 * Wipes every key this app has written to AsyncStorage, and destroys the
 * SecureStore-held AES encryption key so any ciphertext that somehow
 * survives (e.g. a backup taken before this ran) is permanently
 * unreadable too — a real, complete erasure rather than a partial one.
 * Does not itself navigate or update any in-memory auth state — callers
 * should follow this with `logout()` so React state and storage stay in
 * sync.
 */
export async function wipeLocalData(): Promise<void> {
  await AsyncStorage.clear();
  await secureStorage.destroyEncryptionKey();
}
