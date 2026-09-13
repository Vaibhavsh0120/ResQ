import AsyncStorage from '@react-native-async-storage/async-storage';
import * as secureStorage from './secureStorage';
import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockFamily } from '@/data/mockFamily';
import { FamilyMember } from '@/types';

// ── Family circle: local-only persistence until a backend exists ─────────
// Previously this service read straight from the static `mockFamily`
// array — `inviteFamilyMember`/`checkInFamilyMember` only ever mutated the
// in-memory React state inside useFamily(), never storage, so any member
// added from the Family tab (or, as of this session, onboarding) vanished
// on the next app restart. This was a pre-existing gap, not something
// specific to onboarding — fixed here with the same AsyncStorage-backed,
// seed-once-from-mock pattern already used by notificationsService.ts.
//
// 2026-09-10: family member records (names, relationships, phone numbers)
// are personal data about people who never consented to using this app
// themselves, so the actual member list is now encrypted at rest via
// secureStorage.ts (see that file for the design). SEEDED_KEY stays on
// plain AsyncStorage deliberately — it's a bare boolean bookkeeping flag
// ("has real data ever been seeded"), not personal data, so encrypting it
// would add overhead for no real protection.

const STORAGE_KEY = '@resq_family_members';
// Tracks whether the circle currently held in storage is real user data
// (from onboarding or the Family tab) rather than the untouched
// mockFamily.ts seed. Lets seedFamilyMembers below replace demo data on a
// user's first-ever onboarding completion, while still only ever adding
// to a circle that's already real (e.g. onboarding re-run after logout).
const SEEDED_KEY = '@resq_family_members_seeded';

async function readLocal(): Promise<FamilyMember[]> {
  const raw = await secureStorage.migrateLegacyPlaintext(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as FamilyMember[];
    } catch {
      // Corrupted storage — fall through to reseeding.
    }
  }
  await secureStorage.setItem(STORAGE_KEY, JSON.stringify(mockFamily));
  return mockFamily;
}

async function writeLocal(members: FamilyMember[]): Promise<void> {
  await secureStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export async function fetchFamily(): Promise<FamilyMember[]> {
  if (config.useMockData) {
    return mockDelay(await readLocal());
  }
  return apiRequest<FamilyMember[]>(config.endpoints.familyStatus);
}

export async function checkInFamilyMember(memberId: string): Promise<FamilyMember> {
  if (config.useMockData) {
    const current = await readLocal();
    const member = current.find((m) => m.id === memberId);
    if (!member) throw new Error(`Unknown family member: ${memberId}`);
    // A check-in is a strong signal the person has actually joined the
    // circle, so a still-pending invite is upgraded to accepted here too —
    // not just the display status/tone.
    const updated: FamilyMember = { ...member, status: 'Safe', tone: 'success' as const, inviteStatus: 'accepted' };
    await writeLocal(current.map((m) => (m.id === memberId ? updated : m)));
    return mockDelay(updated);
  }
  return apiRequest<FamilyMember>(`${config.endpoints.familyStatus}/${memberId}/check-in`, {
    method: 'POST',
  });
}

export async function inviteFamilyMember(name: string, relation: string, phone?: string): Promise<FamilyMember> {
  if (config.useMockData) {
    const current = await readLocal();
    const created: FamilyMember = {
      id: `fam-${Date.now()}`,
      name,
      relation,
      initials: name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      status: 'Invite sent',
      tone: 'warning',
      phone: phone || undefined,
      lastKnownLocation: 'Location not shared yet',
      inviteStatus: 'pending',
    };
    await writeLocal([...current, created]);
    await AsyncStorage.setItem(SEEDED_KEY, 'true');
    return mockDelay(created);
  }
  return apiRequest<FamilyMember>(config.endpoints.familyStatus, {
    method: 'POST',
    body: { name, relation, phone },
  });
}

/**
 * Writes the family circle implied by onboarding's family + emergency-
 * contacts steps (see onboardingService.mergeOnboardingContacts), called
 * once from onboarding/emergency.tsx's handleFinish. The very first call
 * (fresh install, nothing real added yet) replaces the untouched
 * mockFamily.ts demo data outright — a user finishing onboarding should
 * see their own circle, not their circle mixed in with three people they
 * never added (see AGENT.md). Any later call (onboarding re-run
 * after a logout, for instance) is additive instead, since by then the
 * stored circle is the user's real data and shouldn't be silently
 * replaced.
 */
export async function seedFamilyMembers(members: Omit<FamilyMember, 'id'>[]): Promise<FamilyMember[]> {
  const withIds: FamilyMember[] = members.map((m, i) => ({ ...m, id: `fam-onboard-${Date.now()}-${i}` }));
  if (config.useMockData) {
    const alreadySeeded = (await AsyncStorage.getItem(SEEDED_KEY)) === 'true';
    const base = alreadySeeded ? await readLocal() : [];
    await writeLocal([...base, ...withIds]);
    await AsyncStorage.setItem(SEEDED_KEY, 'true');
    return mockDelay(withIds);
  }
  return apiRequest<FamilyMember[]>(config.endpoints.familyStatus, {
    method: 'POST',
    body: { members },
  });
}
