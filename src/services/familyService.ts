import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockFamily } from '@/data/mockFamily';
import { FamilyMember } from '@/types';

export async function fetchFamily(): Promise<FamilyMember[]> {
  if (config.useMockData) {
    return mockDelay(mockFamily);
  }
  return apiRequest<FamilyMember[]>(config.endpoints.familyStatus);
}

export async function checkInFamilyMember(memberId: string): Promise<FamilyMember> {
  if (config.useMockData) {
    const member = mockFamily.find((m) => m.id === memberId);
    if (!member) throw new Error(`Unknown family member: ${memberId}`);
    return mockDelay({ ...member, status: 'Safe', tone: 'success' as const });
  }
  return apiRequest<FamilyMember>(`${config.endpoints.familyStatus}/${memberId}/check-in`, {
    method: 'POST',
  });
}

export async function inviteFamilyMember(name: string, relation: string): Promise<FamilyMember> {
  if (config.useMockData) {
    return mockDelay({
      id: `fam-${Date.now()}`,
      name,
      relation,
      initials: name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      status: 'Invite sent',
      tone: 'warning',
    });
  }
  return apiRequest<FamilyMember>(config.endpoints.familyStatus, {
    method: 'POST',
    body: { name, relation },
  });
}
