import AsyncStorage from '@react-native-async-storage/async-storage';

// ── "Guides read" counter ──────────────────────────────────────────────
// Backs Profile's "Guides read" stat honestly (previously hardcoded to
// "4" — see PROGRESS.md Phase 0/1). Local-only: increments whenever
// guidance-result.tsx successfully loads a piece of guidance the user
// actually opened. A real backend can later replace this with a proper
// per-user "guides read" count computed server-side; this key would then
// just seed the local badge until the first real fetch succeeds.

const STORAGE_KEY = '@resq_guides_read_count';

export async function getGuidesReadCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function incrementGuidesReadCount(): Promise<number> {
  const current = await getGuidesReadCount();
  const next = current + 1;
  await AsyncStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
