/**
 * Regression test for the 2026-09-12 fix: privacy-security.tsx's "Share
 * live location" / "Visible to my circle" toggles were local useState
 * initialized to hardcoded `true` on every mount — nothing the user chose
 * ever persisted. Same failure mode as alert-preferences.tsx and
 * readinessService.ts (see AGENT.md); this confirms the fix the same way
 * __tests__/readinessPersistence.test.ts confirms that one: toggle, then
 * re-fetch as a fresh "session" would, and confirm it stuck.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPrivacySettings, getPrivacySettings, savePrivacySettings } from '@/services/privacySettingsService';

describe('privacySettingsService persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns the documented defaults (both on) when nothing has been saved yet', async () => {
    const settings = await getPrivacySettings();
    expect(settings).toEqual({ locationSharing: true, circleVisibility: true });
  });

  it('persists a toggle across a simulated restart (re-fetch)', async () => {
    const initial = await getPrivacySettings();
    await savePrivacySettings({ ...initial, locationSharing: false });

    const refetched = await getPrivacySettings();
    expect(refetched.locationSharing).toBe(false);
    expect(refetched.circleVisibility).toBe(true);
  });

  it('persists both toggles independently', async () => {
    await savePrivacySettings({ locationSharing: false, circleVisibility: false });
    const refetched = await getPrivacySettings();
    expect(refetched).toEqual({ locationSharing: false, circleVisibility: false });
  });

  it('fills in missing keys from defaults for a value saved before a new setting existed', async () => {
    // Simulates an old saved payload missing a key a later version added —
    // getPrivacySettings should merge over defaults, not read `undefined`.
    await AsyncStorage.setItem('@resq_privacy_settings', JSON.stringify({ locationSharing: false }));
    const settings = await getPrivacySettings();
    expect(settings).toEqual({ locationSharing: false, circleVisibility: true });
  });

  it('falls back to defaults on corrupted storage instead of throwing', async () => {
    await AsyncStorage.setItem('@resq_privacy_settings', 'not-json{{{');
    const settings = await getPrivacySettings();
    expect(settings).toEqual(defaultPrivacySettings);
  });
});
