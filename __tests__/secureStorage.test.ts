/**
 * Unit tests for src/services/secureStorage.ts (encrypted-at-rest
 * storage, added 2026-09-10 — see that file's doc comment for the full
 * design). These exist specifically to catch the failure mode discovered
 * while building this module: jest-expo's generic native-module
 * auto-mock leaves expo-crypto's AES functions as non-functions, and
 * secureStorage.ts's own error handling (a corrupted/undecryptable value
 * is treated as "key not found," not thrown) means a broken encryption
 * path fails *silently* — every read/write appears to succeed in a
 * smoke test while secretly no-op'ing. __tests__/smoke.test.tsx mounting
 * profile.tsx/medical.tsx/family.tsx without these tests would not have
 * caught that.
 *
 * See __tests__/__mocks__/expoCryptoMock.ts for what's actually mocked —
 * real AES-256-GCM via Node's own `crypto` module standing in for the
 * native implementation, not a fake pass-through, so these tests
 * genuinely exercise secureStorage.ts's real encrypt/decrypt/migrate
 * logic.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-crypto', () => require('./__mocks__/expoCryptoMock').mockExpoCrypto());
jest.mock('expo-secure-store', () => require('./__mocks__/expoCryptoMock').mockExpoSecureStore());

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as secureStorage from '../src/services/secureStorage';

describe('secureStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await secureStorage.destroyEncryptionKey();
  });

  it('round-trips a value through real AES-256-GCM encrypt/decrypt', async () => {
    const payload = JSON.stringify({ allergies: ['peanuts'], conditions: 'asthma' });
    await secureStorage.setItem('@resq_medical_profile', payload);
    expect(await secureStorage.getItem('@resq_medical_profile')).toBe(payload);
  });

  it('stores ciphertext in AsyncStorage, not the readable payload', async () => {
    const payload = JSON.stringify({ name: 'Priya Sharma', phone: '+91 98765 43210' });
    await secureStorage.setItem('@resq_profile', payload);
    const raw = await AsyncStorage.getItem('@resq_profile');
    expect(raw).not.toBe(payload);
    expect(raw).not.toContain('Priya');
    expect(raw).not.toContain('98765');
  });

  it('returns null, not a throw, for a key that was never written', async () => {
    expect(await secureStorage.getItem('@resq_nonexistent')).toBeNull();
  });

  it('reuses the same encryption key across separate getItem/setItem calls', async () => {
    // Regression check for the in-memory key cache: writing then reading
    // in two separate calls must use the same underlying key, not
    // silently regenerate a new one that can't decrypt the old value.
    await secureStorage.setItem('@resq_profile', JSON.stringify({ a: 1 }));
    await secureStorage.setItem('@resq_medical_profile', JSON.stringify({ b: 2 }));
    expect(await secureStorage.getItem('@resq_profile')).toBe(JSON.stringify({ a: 1 }));
    expect(await secureStorage.getItem('@resq_medical_profile')).toBe(JSON.stringify({ b: 2 }));
  });

  describe('migrateLegacyPlaintext', () => {
    it('encrypts an existing plaintext value in place and returns it unchanged', async () => {
      const payload = JSON.stringify({ name: 'Test User' });
      await AsyncStorage.setItem('@resq_profile', payload); // simulates a pre-upgrade install

      const migrated = await secureStorage.migrateLegacyPlaintext('@resq_profile');
      expect(migrated).toBe(payload);

      const rawAfter = await AsyncStorage.getItem('@resq_profile');
      expect(rawAfter).not.toBe(payload); // now ciphertext

      // And a normal getItem now decrypts it correctly.
      expect(await secureStorage.getItem('@resq_profile')).toBe(payload);
    });

    it('is a no-op (idempotent) on a value that is already ciphertext', async () => {
      const payload = JSON.stringify({ name: 'Test User' });
      await secureStorage.setItem('@resq_profile', payload); // already-encrypted, this module's own format
      const rawBefore = await AsyncStorage.getItem('@resq_profile');

      const migrated = await secureStorage.migrateLegacyPlaintext('@resq_profile');
      expect(migrated).toBe(payload);

      const rawAfter = await AsyncStorage.getItem('@resq_profile');
      expect(rawAfter).toBe(rawBefore); // untouched — re-encrypting would be wrong, not just wasteful
    });

    it('returns null for a key that was never written', async () => {
      expect(await secureStorage.migrateLegacyPlaintext('@resq_nonexistent')).toBeNull();
    });
  });

  describe('destroyEncryptionKey', () => {
    it('makes previously-written ciphertext permanently unreadable', async () => {
      await secureStorage.setItem('@resq_family_members', JSON.stringify([{ name: 'Alex' }]));
      await secureStorage.destroyEncryptionKey();
      // The ciphertext bytes are still sitting in AsyncStorage (this
      // simulates "delete my account" wiping the key but not necessarily
      // AsyncStorage itself, e.g. a stale backup) — without the key they
      // must be unreadable, not silently return the old value from cache.
      expect(await secureStorage.getItem('@resq_family_members')).toBeNull();
    });

    it('lets a fresh key be generated and used after destruction', async () => {
      await secureStorage.setItem('@resq_profile', JSON.stringify({ a: 1 }));
      await secureStorage.destroyEncryptionKey();
      // Simulates a new account being created in the same app session.
      await secureStorage.setItem('@resq_profile', JSON.stringify({ a: 2 }));
      expect(await secureStorage.getItem('@resq_profile')).toBe(JSON.stringify({ a: 2 }));
    });
  });

  describe('decryptForExport', () => {
    it('decrypts a ciphertext value written by this module', async () => {
      const payload = JSON.stringify({ conditions: 'asthma' });
      await secureStorage.setItem('@resq_medical_profile', payload);
      const raw = await AsyncStorage.getItem('@resq_medical_profile');
      expect(await secureStorage.decryptForExport(raw as string)).toBe(payload);
    });

    it('returns a plaintext value unchanged rather than failing', async () => {
      // e.g. the plain-text SEEDED_KEY boolean flag, or any other
      // never-encrypted key — a data export should degrade to "show what
      // we have" for one key, not throw for the whole export.
      expect(await secureStorage.decryptForExport('true')).toBe('true');
    });
  });

  describe('isEncryptionActive', () => {
    it('is true on native platforms (the only platform these mocks simulate)', () => {
      expect(secureStorage.isEncryptionActive()).toBe(true);
    });
  });
});
