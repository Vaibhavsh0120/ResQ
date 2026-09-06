import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockGuidanceByType } from '@/data/mockGuidance';
import { DisasterGuidance } from '@/types';

/**
 * Retrieves safety guidance for one or more disaster types.
 *
 * This is the primary RAG touchpoint in the app: given the hazards a user
 * selected, a real backend would retrieve the most relevant chunks from a
 * knowledge base of verified emergency-response documents (NDMA, WHO, local
 * authority guidelines, etc.), then generate the `doThisNow` / `avoid` /
 * `why` copy grounded in those chunks, returning the source list in
 * `sources` so the UI can show citations.
 *
 * Mock mode returns static copy for the first matching type, falling back
 * to a general guidance entry — this mirrors how a real retrieval fallback
 * would behave when no strong match is found.
 */
export async function fetchGuidance(types: string[]): Promise<DisasterGuidance> {
  if (config.useMockData) {
    const match = types.find((type) => mockGuidanceByType[type]);
    return mockDelay(mockGuidanceByType[match ?? 'general']);
  }

  return apiRequest<DisasterGuidance>(config.endpoints.guidance, {
    method: 'POST',
    body: { types },
  });
}

export async function fetchAvailableDisasterTypes(): Promise<string[]> {
  if (config.useMockData) {
    const { disasterTypes } = await import('@/data/mockGuidance');
    return mockDelay(disasterTypes);
  }
  return apiRequest<string[]>(`${config.endpoints.guidance}/types`);
}
