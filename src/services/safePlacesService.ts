import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockSafePlaces } from '@/data/mockSafePlaces';
import { SafePlace } from '@/types';

export type SafePlacesQuery = {
  latitude?: number;
  longitude?: number;
};

const EARTH_RADIUS_MILES = 3958.8;

/** Great-circle distance between two coordinates, in miles. */
function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Nearby safe places (shelters, medical centers, community halls). A real
 * implementation would pass the user's coordinates so the backend can query
 * a places index or a RAG-ranked shortlist of verified locations for the
 * current situation (e.g. "open shelters accepting people right now").
 *
 * **2026-09-09**: when real coordinates are available (see
 * useDeviceLocation.ts), the mock branch now actually uses them — sorting
 * mockSafePlaces.ts's fixed list by real great-circle distance from the
 * user and rewriting each place's leading "X mi ·" detail to match, instead
 * of silently ignoring the query and always returning the same static
 * order. This is still mock data (the three places themselves don't
 * change), but "nearby" now means something real rather than being wired
 * through and then dropped on the floor. Without coordinates (permission
 * denied, still loading), falls back to the original static order/detail
 * exactly as before.
 */
export async function fetchSafePlaces(query: SafePlacesQuery = {}): Promise<SafePlace[]> {
  if (config.useMockData) {
    if (query.latitude == null || query.longitude == null) {
      return mockDelay(mockSafePlaces);
    }
    const { latitude, longitude } = query;
    const withDistance = mockSafePlaces
      .map((place) => {
        if (place.latitude == null || place.longitude == null) return place;
        const miles = distanceMiles(latitude, longitude, place.latitude, place.longitude);
        // Preserve whatever came after the "X mi · " prefix in the original
        // mock detail (open hours / status text) rather than overwriting it.
        const rest = place.detail.replace(/^[\d.]+\s*mi\s*·\s*/i, '');
        return { ...place, distanceMiles: miles, detail: `${miles < 0.1 ? '<0.1' : miles.toFixed(1)} mi · ${rest}` };
      })
      .sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
    return mockDelay(withDistance);
  }
  const params = new URLSearchParams();
  if (query.latitude != null) params.set('lat', String(query.latitude));
  if (query.longitude != null) params.set('lng', String(query.longitude));
  const qs = params.toString();
  return apiRequest<SafePlace[]>(`${config.endpoints.safePlaces}${qs ? `?${qs}` : ''}`);
}
