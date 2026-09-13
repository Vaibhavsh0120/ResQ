/**
 * Regression test for the 2026-09-12 checkpoint fix: toggleReadinessItem
 * previously computed an updated checklist/score correctly but never
 * persisted it, so every checked-off item reverted to mockReadiness's
 * hardcoded defaults on the next fetch (e.g. app restart, or navigating
 * away and back). This test simulates exactly that: toggle an item, then
 * call fetchReadiness again as a *fresh* module import would (a new
 * "session"), and confirm the change survived.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchReadiness, toggleReadinessItem } from '@/services/readinessService';
import { mockReadiness } from '@/data/mockReadiness';

describe('readinessService persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('starts from the mock defaults when nothing has been saved yet', async () => {
    const first = await fetchReadiness();
    expect(first.checklist).toEqual(mockReadiness.checklist);
    expect(first.score).toBe(mockReadiness.score);
  });

  it('persists a toggled item across a simulated restart (re-fetch)', async () => {
    const initial = await fetchReadiness();
    const goBag = initial.checklist.find((i) => i.id === 'chk-5');
    expect(goBag?.done).toBe(false); // sanity check on the fixture

    const afterToggle = await toggleReadinessItem(initial, 'chk-5');
    expect(afterToggle.checklist.find((i) => i.id === 'chk-5')?.done).toBe(true);

    // Simulate the app restarting / navigating away and back: a brand new
    // fetchReadiness() call with no in-memory state carried over at all.
    const refetched = await fetchReadiness();
    expect(refetched.checklist.find((i) => i.id === 'chk-5')?.done).toBe(true);
  });

  it('recomputes the score to match the persisted checklist state', async () => {
    const initial = await fetchReadiness();
    // Toggle every currently-incomplete item on.
    let current = initial;
    for (const item of initial.checklist.filter((i) => !i.done)) {
      current = await toggleReadinessItem(current, item.id);
    }
    expect(current.score).toBe(100);

    const refetched = await fetchReadiness();
    expect(refetched.score).toBe(100);
    expect(refetched.checklist.every((i) => i.done)).toBe(true);
  });

  it('un-checking an item persists too, not just checking one on', async () => {
    const initial = await fetchReadiness();
    const already = initial.checklist.find((i) => i.id === 'chk-1');
    expect(already?.done).toBe(true); // sanity check on the fixture

    await toggleReadinessItem(initial, 'chk-1');
    const refetched = await fetchReadiness();
    expect(refetched.checklist.find((i) => i.id === 'chk-1')?.done).toBe(false);
  });
});
