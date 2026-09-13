import { useCallback, useState } from 'react';
import { PrivacySettings, getPrivacySettings, savePrivacySettings } from '@/services/privacySettingsService';
import { useAsync } from './useAsync';

/**
 * Backs privacy-security.tsx's "Share live location" / "Visible to my
 * circle" toggles. Same optimistic-override pattern as
 * useAlertPreferences.ts/useReadiness.ts: the toggle updates local state
 * immediately (so the switch feels instant) and persists in the
 * background, rolling back if the save genuinely fails.
 */
export function usePrivacySettings() {
  const { data, loading, error, refresh } = useAsync(getPrivacySettings, []);
  const [override, setOverride] = useState<PrivacySettings | undefined>(undefined);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const current = override ?? data;

  const toggle = useCallback(
    async (key: keyof PrivacySettings) => {
      if (!current) return;
      const updated = { ...current, [key]: !current[key] };
      setOverride(updated);
      try {
        await savePrivacySettings(updated);
      } catch (err) {
        // Roll back the optimistic update if the save genuinely failed,
        // so the switch doesn't show a state that was never actually
        // persisted.
        setOverride(current);
        setToggleError(err instanceof Error ? err.message : 'Could not save that setting right now.');
      }
    },
    [current]
  );

  return { settings: current, loading, error: error ?? toggleError, refresh, toggle };
}
