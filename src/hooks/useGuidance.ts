import { useCallback, useState } from 'react';
import { fetchGuidance } from '@/services/guidanceService';
import { DisasterGuidance } from '@/types';

/**
 * Guidance is fetched on demand (once the user picks hazard types or a
 * report is submitted) rather than on mount, so this hook exposes a `load`
 * function instead of auto-fetching like useAsync-based hooks.
 */
export function useGuidance() {
  const [data, setData] = useState<DisasterGuidance | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (types: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGuidance(types);
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load guidance right now.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, load };
}
