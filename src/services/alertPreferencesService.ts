import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Alert category preferences ──────────────────────────────────────────
// Backs alert-preferences.tsx's weather/community/traffic/family toggles.
// Previously local useState only, initialized to hardcoded defaults every
// time the screen mounted — meaning nothing the user actually chose ever
// survived leaving the screen (found 2026-09-12 during a full pass over
// every screen specifically looking for this exact failure mode; see
// AGENT.md's Verified Findings for the rest of what that pass covered).
// No backend yet, so this is local-only, same as
// onboardingService.ts/notificationsService.ts — plain AsyncStorage
// rather than secureStorage, since "is the weather category on" carries
// no personal/medical information worth encrypting at rest.
//
// Once a real backend exists, these become a genuine per-user settings
// endpoint; this local copy would then just seed the UI until the first
// real fetch succeeds, same migration story as every other
// AsyncStorage-backed service in this app.

const STORAGE_KEY = '@resq_alert_preferences';

export type AlertPreferenceKey = 'weather' | 'community' | 'traffic' | 'family';
export type AlertPreferences = Record<AlertPreferenceKey, boolean>;

export const defaultAlertPreferences: AlertPreferences = {
  weather: true,
  community: true,
  traffic: false,
  family: true,
};

export async function getAlertPreferences(): Promise<AlertPreferences> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultAlertPreferences;
  try {
    const parsed = JSON.parse(raw);
    // Merge over the defaults rather than trusting the parsed object
    // outright, so a future new preference key added to this app still
    // gets a sane default for users who saved preferences before that
    // key existed, instead of silently reading `undefined`.
    return { ...defaultAlertPreferences, ...parsed };
  } catch {
    return defaultAlertPreferences;
  }
}

export async function saveAlertPreferences(preferences: AlertPreferences): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
