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

/**
 * Toggles one checklist item done/undone and recomputes `score` as the
 * percentage of checklist items completed, so the readiness ring stays
 * honest instead of drifting from what the checklist actually shows.
 * Mock-only for now — a real backend will compute readiness from more than
 * just the checklist (profile completeness, check-in history, etc.), so
 * this recomputation is a placeholder until that logic exists server-side.
 */
export async function toggleReadinessItem(current: ReadinessSummary, itemId: string): Promise<ReadinessSummary> {
  const checklist = current.checklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item));
  const score = checklist.length ? Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100) : 0;

  if (config.useMockData) {
    return mockDelay({ ...current, checklist, score });
  }
  return apiRequest<ReadinessSummary>(`/v1/readiness/checklist/${itemId}/toggle`, { method: 'POST' });
}
