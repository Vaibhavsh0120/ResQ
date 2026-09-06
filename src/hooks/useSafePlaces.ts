import { fetchSafePlaces, SafePlacesQuery } from '@/services/safePlacesService';
import { useAsync } from './useAsync';

export function useSafePlaces(query: SafePlacesQuery = {}) {
  return useAsync(() => fetchSafePlaces(query), [query.latitude, query.longitude]);
}
