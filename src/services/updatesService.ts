import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockUpdates } from '@/data/mockUpdates';
import { UpdateAlert } from '@/types';

/**
 * Live/community updates for the user's area. Backing this with RAG later
 * means the endpoint retrieves recent local documents (weather bulletins,
 * municipal notices, community reports) and ranks/summarizes them — the
 * response shape (`UpdateAlert[]`, each with an optional `source`) already
 * supports that; only the fetch below needs to change.
 */
export async function fetchUpdates(): Promise<UpdateAlert[]> {
  if (config.useMockData) {
    return mockDelay(mockUpdates);
  }
  return apiRequest<UpdateAlert[]>(config.endpoints.updates);
}
