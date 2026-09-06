import { useCallback, useState } from 'react';
import { fetchProfile, updateProfile } from '@/services/profileService';
import { ProfileData } from '@/types';
import { useAsync } from './useAsync';

export function useProfile() {
  const { data, loading, error, refresh } = useAsync(fetchProfile, []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<ProfileData | undefined>(undefined);

  const profile = saved ?? data;

  const save = useCallback(async (next: ProfileData) => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await updateProfile(next);
      setSaved(result);
      return result;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your profile.');
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, error: error ?? saveError, refresh, save, saving };
}
