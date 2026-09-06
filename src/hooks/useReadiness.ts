import { fetchReadiness } from '@/services/readinessService';
import { useAsync } from './useAsync';

export function useReadiness() {
  return useAsync(fetchReadiness, []);
}
