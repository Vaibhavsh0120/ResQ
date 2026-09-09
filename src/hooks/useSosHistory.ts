import { useCallback } from 'react';
import { fetchSosHistory, logSosEvent } from '@/services/sosService';
import { SosEvent } from '@/types';
import { useAsync } from './useAsync';

export function useSosHistory() {
  const { data, loading, error, refresh } = useAsync(fetchSosHistory, []);

  const logEvent = useCallback(
    async (input: Omit<SosEvent, 'id' | 'triggeredAt'>) => {
      const event = await logSosEvent(input);
      refresh();
      return event;
    },
    [refresh]
  );

  return { events: data, loading, error, refresh, logEvent };
}
