import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockSafePlaces } from '@/data/mockSafePlaces';
import { SafePlace } from '@/types';

export type SafePlacesQuery = {
  latitude?: number;
  longitude?: number;
};

/**
 * Nearby safe places (shelters, medical centers, community halls). A real
 * implementation would pass the user's coordinates so the backend can query
 * a places index or a RAG-ranked shortlist of verified locations for the
 * current situation (e.g. "open shelters accepting people right now").
 */
export async function fetchSafePlaces(query: SafePlacesQuery = {}): Promise<SafePlace[]> {
  if (config.useMockData) {
    return mockDelay(mockSafePlaces);
  }
  const params = new URLSearchParams();
  if (query.latitude != null) params.set('lat', String(query.latitude));
  if (query.longitude != null) params.set('lng', String(query.longitude));
  const qs = params.toString();
  return apiRequest<SafePlace[]>(`${config.endpoints.safePlaces}${qs ? `?${qs}` : ''}`);
}
