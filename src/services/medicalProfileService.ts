import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { MedicalProfile } from '@/types';

// ── Medical profile: local-only persistence until a backend exists ────────
// Onboarding's medical step (app/onboarding/medical.tsx) previously only
// wrote to onboardingService's MEDICAL_KEY draft — which is a *draft*,
// cleared by clearOnboardingDraft() on logout, same as the personal/family/
// emergency drafts. That's correct for "resume onboarding where I left
// off," but it meant medical info had no durable home the way
// profileService.ts/familyService.ts give name/phone/family circle — the
// exact same gap §2.5 found and fixed for those two. Fixed the same way
// here: a dedicated AsyncStorage-backed service medical.tsx merges into on
// every Continue/Skip (mirroring how onboarding/personal.tsx calls
// mergeProfile alongside saveOnboardingPersonal), so the data survives
// logout/restart and has somewhere real to be read back from (Profile's
// new "Medical ID" card).

const STORAGE_KEY = '@resq_medical_profile';

const emptyMedicalProfile: MedicalProfile = {
  allergies: [],
  conditions: '',
  usesMobilityAid: false,
  hasVisualImpairment: false,
  hasHearingImpairment: false,
};

async function readLocal(): Promise<MedicalProfile | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MedicalProfile;
  } catch {
    return null;
  }
}

/**
 * Returns the saved medical profile, or null if the user has never filled
 * one in (skipped onboarding's medical step entirely, or hasn't reached it
 * yet). Callers should treat null as "nothing to show" rather than seeding
 * mock content — unlike name/phone, there's no reasonable placeholder for
 * a person's actual medical info.
 */
export async function fetchMedicalProfile(): Promise<MedicalProfile | null> {
  if (config.useMockData) {
    return mockDelay(await readLocal());
  }
  return apiRequest<MedicalProfile>(config.endpoints.medicalProfile);
}

export async function updateMedicalProfile(profile: MedicalProfile): Promise<MedicalProfile> {
  if (config.useMockData) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return mockDelay(profile);
  }
  return apiRequest<MedicalProfile>(config.endpoints.medicalProfile, {
    method: 'PUT',
    body: profile,
  });
}

/**
 * Merges a partial update into whatever medical profile already exists.
 * Onboarding's medical step always has the full picture in one screen (no
 * cross-step slicing the way personal/location split across ProfileData),
 * so it could call updateMedicalProfile directly — this wrapper exists
 * anyway for the same reason profileService.mergeProfile does: a safe,
 * non-clobbering write if a future screen (e.g. a "medical ID" edit flow)
 * only ever owns part of the shape.
 */
export async function mergeMedicalProfile(partial: Partial<MedicalProfile>): Promise<MedicalProfile> {
  const current = (await readLocal()) ?? emptyMedicalProfile;
  const merged = { ...current, ...partial };
  return updateMedicalProfile(merged);
}
