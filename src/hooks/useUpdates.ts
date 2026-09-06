import { fetchUpdates } from '@/services/updatesService';
import { useAsync } from './useAsync';

export function useUpdates() {
  return useAsync(fetchUpdates, []);
}
