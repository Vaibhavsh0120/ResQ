import { useCallback, useState } from 'react';
import { fetchReadiness, toggleReadinessItem } from '@/services/readinessService';
import { ReadinessSummary } from '@/data/mockReadiness';
import { useAsync } from './useAsync';

export function useReadiness() {
  const { data, loading, error, refresh } = useAsync(fetchReadiness, []);
  const [override, setOverride] = useState<ReadinessSummary | undefined>(undefined);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const current = override ?? data;

  const toggleItem = useCallback(
    async (itemId: string) => {
      if (!current) return;
      try {
        const updated = await toggleReadinessItem(current, itemId);
        setOverride(updated);
      } catch (err) {
        setToggleError(err instanceof Error ? err.message : 'Could not update your checklist right now.');
      }
    },
    [current]
  );

  return { data: current, loading, error: error ?? toggleError, refresh, toggleItem };
}
