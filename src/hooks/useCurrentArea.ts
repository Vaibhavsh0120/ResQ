import { useProfile } from './useProfile';
import { useDeviceLocation } from './useDeviceLocation';

/**
 * Single source of truth for "what area is the user in" — previously
 * hardcoded independently as "Riverside district" / "Near Riverside Park"
 * across updates.tsx, safe.tsx, family.tsx, family-member.tsx, and
 * report.tsx (see AGENT.md).
 *
 * **2026-09-09 (Phase 1): now prefers live device location over the
 * profile's static home address**, exactly as this hook's own comment
 * previously promised once `useDeviceLocation()` existed. Precedence:
 * 1. Live GPS reverse-geocoded area (`useDeviceLocation().area`), when
 *    permission is granted and a fix has been obtained.
 * 2. The profile's saved home address/city, while live location is still
 *    loading or permission was denied — this keeps every screen that
 *    already calls `useCurrentArea()` (Home, Family, Safe, Updates,
 *    Report, SOS) working exactly as before with zero code changes on
 *    their end, and avoids a blank field while the first GPS fix is still
 *    in flight.
 * `source` tells a screen which one it got, in case that distinction ever
 * matters (e.g. showing "using your current location" vs "using your home
 * address" — not used anywhere yet, but cheap to expose now rather than
 * threading it through later).
 */
export function useCurrentArea() {
  const { profile, loading: profileLoading } = useProfile();
  const device = useDeviceLocation();

  const area = device.area ?? profile?.location;
  const source: 'device' | 'profile' | undefined = device.area ? 'device' : profile?.location ? 'profile' : undefined;

  // Only genuinely "loading" while neither source has anything to show yet
  // — once the profile's static area is available, don't keep showing a
  // loading state just because the (best-effort, permission-gated) GPS fix
  // hasn't resolved.
  const loading = area == null && (profileLoading || device.loading);

  return { area, source, loading, latitude: device.latitude, longitude: device.longitude };
}
