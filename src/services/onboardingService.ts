import AsyncStorage from '@react-native-async-storage/async-storage';
import { FamilyMember, MedicalProfile } from '@/types';

// ── Onboarding persistence ─────────────────────────────────────────────
// Every onboarding screen previously held everything typed in local
// useState only — finishing onboarding just flipped one boolean
// (AuthContext.completeOnboarding) and every field was lost (see
// PROGRESS.md §2.5/§7). This service is the fix: each step's data is
// written to AsyncStorage as the user completes that step (not only at
// the very end), so quitting partway through doesn't lose earlier steps,
// and returning to a step pre-fills whatever was already entered.
//
// There's no backend yet, so this is local-only, same as
// notificationsService.ts/sosService.ts. `exportLocalData`/`wipeLocalData`
// (src/services/localDataService.ts) already cover these keys for free —
// they read via AsyncStorage.getAllKeys() rather than a hardcoded list.

const PERSONAL_KEY = '@resq_onboarding_personal';
const MEDICAL_KEY = '@resq_onboarding_medical';
const LOCATION_KEY = '@resq_onboarding_location';
const FAMILY_DRAFT_KEY = '@resq_onboarding_family_draft';
const EMERGENCY_DRAFT_KEY = '@resq_onboarding_emergency_draft';

export type OnboardingPersonal = {
  fullName: string;
  phone: string;
  dob: string;
  bloodType: string;
};

export type OnboardingLocation = {
  address: string;
  city: string;
  stateRegion: string;
  landmark: string;
};

export type OnboardingFamilyDraftMember = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

export type OnboardingEmergencyDraftContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
};

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function getOnboardingPersonal(): Promise<OnboardingPersonal | null> {
  return readJson<OnboardingPersonal>(PERSONAL_KEY);
}

export async function saveOnboardingPersonal(data: OnboardingPersonal): Promise<void> {
  await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(data));
}

export async function getOnboardingMedical(): Promise<MedicalProfile | null> {
  return readJson<MedicalProfile>(MEDICAL_KEY);
}

export async function saveOnboardingMedical(data: MedicalProfile): Promise<void> {
  await AsyncStorage.setItem(MEDICAL_KEY, JSON.stringify(data));
}

export async function getOnboardingLocation(): Promise<OnboardingLocation | null> {
  return readJson<OnboardingLocation>(LOCATION_KEY);
}

export async function saveOnboardingLocation(data: OnboardingLocation): Promise<void> {
  await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(data));
}

export async function getOnboardingFamilyDraft(): Promise<OnboardingFamilyDraftMember[] | null> {
  return readJson<OnboardingFamilyDraftMember[]>(FAMILY_DRAFT_KEY);
}

export async function saveOnboardingFamilyDraft(members: OnboardingFamilyDraftMember[]): Promise<void> {
  await AsyncStorage.setItem(FAMILY_DRAFT_KEY, JSON.stringify(members));
}

export async function getOnboardingEmergencyDraft(): Promise<OnboardingEmergencyDraftContact[] | null> {
  return readJson<OnboardingEmergencyDraftContact[]>(EMERGENCY_DRAFT_KEY);
}

export async function saveOnboardingEmergencyDraft(contacts: OnboardingEmergencyDraftContact[]): Promise<void> {
  await AsyncStorage.setItem(EMERGENCY_DRAFT_KEY, JSON.stringify(contacts));
}

/**
 * Clears every onboarding-draft key. Called on logout (AuthContext) so a
 * new session — or a different guest pass-through — doesn't inherit a
 * previous user's half-finished draft. Does NOT clear the family circle
 * or profile that onboarding writes into on completion (familyService.ts/
 * profileService.ts own that lifecycle themselves, same as any other
 * app data) — only the draft state this service tracks while onboarding
 * is in progress.
 */
export async function clearOnboardingDraft(): Promise<void> {
  await AsyncStorage.multiRemove([PERSONAL_KEY, MEDICAL_KEY, LOCATION_KEY, FAMILY_DRAFT_KEY, EMERGENCY_DRAFT_KEY]);
}

/**
 * Builds the family-circle members implied by onboarding's family + emergency
 * steps, merged into one list. onboarding/family.tsx and onboarding/
 * emergency.tsx used to keep two separate, overlapping contact lists (with
 * their own pre-seeded fake people) — merged here into the single list
 * `useFamily()`/SOS actually reads, with `isPrimaryEmergencyContact` marking
 * who was flagged during the emergency step. This intentionally does not
 * write to storage itself — onboarding/emergency.tsx's handleFinish calls
 * familyService's own persistence (seedFamilyMembers) once, on completion,
 * so family.tsx's per-step "Continue" doesn't create members twice.
 */
export function mergeOnboardingContacts(
  familyStepMembers: OnboardingFamilyDraftMember[],
  emergencyStepContacts: OnboardingEmergencyDraftContact[]
): Omit<FamilyMember, 'id'>[] {
  const byPhone = new Map<string, Omit<FamilyMember, 'id'>>();
  const keyFor = (name: string, phone: string) => (phone.trim() ? phone.trim() : `name:${name.trim().toLowerCase()}`);

  const toMember = (name: string, relation: string, phone: string, isPrimary: boolean): Omit<FamilyMember, 'id'> => ({
    name,
    relation: relation || 'Contact',
    initials: name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    status: 'Invite sent',
    tone: 'warning',
    phone: phone.trim() || undefined,
    lastKnownLocation: 'Location not shared yet',
    isPrimaryEmergencyContact: isPrimary,
    inviteStatus: 'pending',
  });

  for (const m of familyStepMembers) {
    if (!m.name.trim()) continue;
    byPhone.set(keyFor(m.name, m.phone), toMember(m.name, m.relation, m.phone, false));
  }
  for (const c of emergencyStepContacts) {
    if (!c.name.trim()) continue;
    const key = keyFor(c.name, c.phone);
    const existing = byPhone.get(key);
    // A contact entered in both steps (matched by phone, or by name when no
    // phone was given) is one person — keep the merged record, upgraded to
    // primary if either step marked it so.
    byPhone.set(key, {
      ...toMember(c.name, c.relation || existing?.relation || 'Contact', c.phone || existing?.phone || '', c.isPrimary || !!existing?.isPrimaryEmergencyContact),
      lastKnownLocation: existing?.lastKnownLocation ?? 'Location not shared yet',
    });
  }

  return Array.from(byPhone.values());
}
