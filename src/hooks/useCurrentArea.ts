import { useProfile } from './useProfile';

/**
 * Single source of truth for "what area is the user in" — previously
 * hardcoded independently as "Riverside district" / "Near Riverside Park"
 * across updates.tsx, safe.tsx, family.tsx, family-member.tsx, and
 * report.tsx (see PROGRESS.md Phase 0). Reads from the same profile data
 * every screen already uses for the user's home area.
 *
 * Once real device location exists (PROGRESS.md Phase 1's
 * useDeviceLocation), this is the natural place to prefer a live GPS-derived
 * area over the profile's home address when one is available.
 */
export function useCurrentArea() {
  const { profile, loading } = useProfile();
  return { area: profile?.location, loading };
}
