import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config/env';
import { apiRequest, mockDelay } from './apiClient';
import { mockReadiness, ReadinessSummary } from '@/data/mockReadiness';

// ── Checklist completion persistence ────────────────────────────────────
// toggleReadinessItem previously computed the updated checklist/score
// correctly but never wrote it anywhere — useReadiness.ts only held the
// result in an in-memory `override` state, so every checked-off item
// reverted to mockReadiness's hardcoded `done: true` defaults on the next
// app restart or even just navigating away and back (found 2026-09-12
// during the same full-app pass that found alert-preferences.tsx's
// identical issue — see AGENT.md's Verified Findings). Fixed the same
// way: plain AsyncStorage (not secureStorage — which item's checked off
// carries no personal/medical information worth encrypting at rest),
// local-only until a real backend computes readiness server-side.

const STORAGE_KEY = '@resq_readiness_checklist';

/** Reads which checklist item ids are marked done, or null if nothing has been saved yet (first run). */
async function readSavedDoneIds(): Promise<Set<string> | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const ids: string[] = JSON.parse(raw);
    return new Set(ids);
  } catch {
    return null;
  }
}

async function saveDoneIds(checklist: ReadinessSummary['checklist']): Promise<void> {
  const doneIds = checklist.filter((item) => item.done).map((item) => item.id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(doneIds));
}

/**
 * A user's preparedness score and checklist. A real backend would compute
 * this from the user's profile, saved plan, and check-in history rather
 * than a static score — the shape here is designed to hold that as-is.
 */
export async function fetchReadiness(): Promise<ReadinessSummary> {
  if (config.useMockData) {
    const savedDoneIds = await readSavedDoneIds();
    if (!savedDoneIds) return mockDelay(mockReadiness);
    // Overlay the user's actual saved completion state onto the mock
    // checklist's labels/order, and recompute the score to match —
    // same recomputation toggleReadinessItem already does below, kept
    // in sync so a fresh load and a toggle always agree on the score.
    const checklist = mockReadiness.checklist.map((item) => ({ ...item, done: savedDoneIds.has(item.id) }));
    const score = checklist.length ? Math.round((checklist.filter((i) => i.done).length / checklist.length) * 100) : 0;
    return mockDelay({ ...mockReadiness, checklist, score });
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
    await saveDoneIds(checklist);
    return mockDelay({ ...current, checklist, score });
  }
  return apiRequest<ReadinessSummary>(`/v1/readiness/checklist/${itemId}/toggle`, { method: 'POST' });
}
