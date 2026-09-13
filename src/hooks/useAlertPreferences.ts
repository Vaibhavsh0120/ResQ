import { useCallback, useState } from 'react';
import { AlertPreferenceKey, AlertPreferences, getAlertPreferences, saveAlertPreferences } from '@/services/alertPreferencesService';
import { useAsync } from './useAsync';

/**
 * Backs alert-preferences.tsx. Same optimistic-override pattern as
 * useReadiness.ts's toggleItem: the toggle updates local state
 * immediately (so the switch feels instant) and persists in the
 * background, rather than waiting on a round trip before the UI
 * reflects the tap.
 */
export function useAlertPreferences() {
  const { data, loading, error, refresh } = useAsync(getAlertPreferences, []);
  const [override, setOverride] = useState<AlertPreferences | undefined>(undefined);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const current = override ?? data;

  const toggle = useCallback(
    async (key: AlertPreferenceKey) => {
      if (!current) return;
      const updated = { ...current, [key]: !current[key] };
      setOverride(updated);
      try {
        await saveAlertPreferences(updated);
      } catch (err) {
        // Roll back the optimistic update if the save genuinely failed,
        // so the switch doesn't show a state that was never actually
        // persisted.
        setOverride(current);
        setToggleError(err instanceof Error ? err.message : 'Could not save that preference right now.');
      }
    },
    [current]
  );

  return { preferences: current, loading, error: error ?? toggleError, refresh, toggle };
}
