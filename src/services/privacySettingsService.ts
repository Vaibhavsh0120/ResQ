import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Privacy & security toggle persistence ───────────────────────────────
// Backs privacy-security.tsx's "Share live location" / "Visible to my
// circle" toggles. Previously local useState initialized to hardcoded
// `true` on every mount — nothing the user chose ever persisted, the same
// "silently resets, never actually saves" pattern already found and fixed
// in alert-preferences.tsx and readinessService.ts during the 2026-09-12
// hardcoded-data audit (see AGENT.md). Plain AsyncStorage, not
// secureStorage — these are just two on/off flags, no personal/medical
// data worth encrypting at rest (same reasoning as
// alertPreferencesService.ts).
//
// Once a real backend exists, these become genuine per-user privacy
// settings synced server-side; this local copy would then just seed the
// UI until the first real fetch succeeds, same migration story as every
// other AsyncStorage-backed service here. Also covered by
// localDataService.ts's "delete my account" flow for free — that wipes
// every AsyncStorage key generically, not a hardcoded list.

const STORAGE_KEY = '@resq_privacy_settings';

export type PrivacySettings = {
  locationSharing: boolean;
  circleVisibility: boolean;
};

export const defaultPrivacySettings: PrivacySettings = {
  locationSharing: true,
  circleVisibility: true,
};

export async function getPrivacySettings(): Promise<PrivacySettings> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultPrivacySettings;
  try {
    const parsed = JSON.parse(raw);
    // Merge over the defaults rather than trusting the parsed object
    // outright, so a future new setting key added to this app still gets
    // a sane default for users who saved settings before that key
    // existed, instead of silently reading `undefined`.
    return { ...defaultPrivacySettings, ...parsed };
  } catch {
    return defaultPrivacySettings;
  }
}

export async function savePrivacySettings(settings: PrivacySettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
