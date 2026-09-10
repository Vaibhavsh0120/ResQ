import * as secureStorage from './secureStorage';
import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockProfile } from '@/data/mockProfile';
import { ProfileData } from '@/types';

// ── Profile: local-only persistence until a backend exists ────────────────
// Previously `updateProfile` just echoed back whatever was passed in —
// nothing was written to storage, so an edit from profile.tsx (or, as of
// this session, onboarding's personal/location steps) was lost the moment
// the app restarted. Fixed with the same AsyncStorage-backed pattern used
// elsewhere (notificationsService.ts, familyService.ts).
//
// 2026-09-10: this is one of the most sensitive domains in the app —
// name, phone, blood type, home area — so storage now goes through
// secureStorage.ts (AES-256-GCM at rest, see that file) instead of plain
// AsyncStorage. migrateLegacyPlaintext handles an existing install's
// already-stored plaintext profile transparently on first read after
// this change ships.

const STORAGE_KEY = '@resq_profile';

async function readLocal(): Promise<ProfileData> {
  const raw = await secureStorage.migrateLegacyPlaintext(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as ProfileData;
    } catch {
      // Corrupted storage — fall through to reseeding.
    }
  }
  await secureStorage.setItem(STORAGE_KEY, JSON.stringify(mockProfile));
  return mockProfile;
}

export async function fetchProfile(): Promise<ProfileData> {
  if (config.useMockData) {
    return mockDelay(await readLocal());
  }
  return apiRequest<ProfileData>(config.endpoints.profile);
}

export async function updateProfile(profile: ProfileData): Promise<ProfileData> {
  if (config.useMockData) {
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return mockDelay(profile);
  }
  return apiRequest<ProfileData>(config.endpoints.profile, {
    method: 'PUT',
    body: profile,
  });
}

/**
 * Merges a partial update into whatever profile already exists, rather
 * than requiring the full ProfileData shape — used by onboarding's
 * personal/location steps, which each only know their own slice of the
 * profile (name/phone/dob/bloodType, or location) and shouldn't clobber
 * fields the other step owns.
 */
export async function mergeProfile(partial: Partial<ProfileData>): Promise<ProfileData> {
  const current = await readLocal();
  const merged = { ...current, ...partial };
  return updateProfile(merged);
}
