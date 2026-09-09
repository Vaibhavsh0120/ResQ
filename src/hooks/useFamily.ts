import { useCallback, useState } from 'react';
import { checkInFamilyMember, fetchFamily, inviteFamilyMember } from '@/services/familyService';
import { FamilyMember } from '@/types';
import { useAsync } from './useAsync';

export function useFamily() {
  const { data, loading, error, refresh } = useAsync(fetchFamily, []);
  const [members, setMembers] = useState<FamilyMember[] | undefined>(undefined);
  const [actionError, setActionError] = useState<string | null>(null);

  const list = members ?? data;

  const checkIn = useCallback(
    async (memberId: string) => {
      try {
        const updated = await checkInFamilyMember(memberId);
        setMembers((current) => (current ?? data ?? []).map((m) => (m.id === memberId ? updated : m)));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not check in right now.');
      }
    },
    [data]
  );

  const invite = useCallback(
    async (name: string, relation: string, phone?: string) => {
      try {
        const created = await inviteFamilyMember(name, relation, phone);
        setMembers((current) => [...(current ?? data ?? []), created]);
        return created;
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Could not send the invite.');
        return null;
      }
    },
    [data]
  );

  return { members: list, loading, error: error ?? actionError, refresh, checkIn, invite };
}
