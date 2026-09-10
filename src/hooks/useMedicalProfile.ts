import { fetchMedicalProfile } from '@/services/medicalProfileService';
import { useAsync } from './useAsync';

/**
 * Read-only: the medical-ID display surface (Profile, sos.tsx's confirmed
 * screen) only ever shows this data, it doesn't edit it here — editing
 * medical info happens through onboarding's medical step being re-run, same
 * as this app's existing pattern for other onboarding-collected data with
 * no dedicated edit screen yet. `data` is `null` (not an error) when the
 * user has never filled in a medical profile.
 */
export function useMedicalProfile() {
  const { data, loading, error, refresh } = useAsync(fetchMedicalProfile, []);
  return { medicalProfile: data ?? null, loading, error, refresh };
}
