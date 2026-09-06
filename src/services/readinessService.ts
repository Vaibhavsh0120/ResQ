import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockReadiness, ReadinessSummary } from '@/data/mockReadiness';

/**
 * A user's preparedness score and checklist. A real backend would compute
 * this from the user's profile, saved plan, and check-in history rather
 * than a static score — the shape here is designed to hold that as-is.
 */
export async function fetchReadiness(): Promise<ReadinessSummary> {
  if (config.useMockData) {
    return mockDelay(mockReadiness);
  }
  return apiRequest<ReadinessSummary>('/v1/readiness');
}
