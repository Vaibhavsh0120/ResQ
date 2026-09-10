/**
 * Real jest mock for expo-crypto's AES API, used by both
 * __tests__/smoke.test.tsx and __tests__/secureStorage.test.ts.
 *
 * Why this exists at all: jest-expo's generic native-module auto-mock
 * leaves AESEncryptionKey.generate() (and friends) as non-functions —
 * confirmed directly (`TypeError: _expoCrypto.AESEncryptionKey.generate is
 * not a function`) before this mock was added. src/services/secureStorage.ts
 * catches decrypt errors and treats them as "key not found," so without a
 * real mock every read/write silently no-ops instead of failing loudly —
 * a smoke test would pass while the actual encryption path never ran.
 *
 * Uses Node's real `crypto` module (available under Jest, not React
 * Native's JS runtime) to do real AES-256-GCM — so tests using this mock
 * genuinely exercise an encrypt-then-decrypt round trip, not a fake
 * pass-through that would pass even if secureStorage.ts's own logic were
 * broken. Only implements the exact surface secureStorage.ts actually
 * calls (AESEncryptionKey.generate/import, key.encoded(), aesEncryptAsync,
 * sealed.combined(), AESSealedData.fromCombined, aesDecryptAsync) — not a
 * full expo-crypto mock.
 *
 * Untyped (`any`) rather than adding `@types/node`: this project's
 * tsconfig deliberately scopes global types to `["jest"]` only, so app
 * code doesn't get Node globals leaking into a React Native project.
 * `nodeCrypto`/`NodeBuffer` below are real Node built-ins at runtime
 * (this file only ever runs under Jest, never bundled into the app) —
 * `any` is the honest way to say "used here on purpose, not meant to be
 * globally available," rather than pulling in @types/node project-wide
 * to type one test-only file.
 *
 * Not a Jest `jest.mock()` factory itself (Jest requires those to be
 * inline in the file that calls jest.mock, factories can't be imported —
 * see https://jestjs.io/docs/es6-class-mocks#calling-jestmock-with-the-module-factory-parameter).
 * Each call site does `jest.mock('expo-crypto', () => require('./__mocks__/expoCryptoMock').mockExpoCrypto())`.
 */
type Encoding = 'hex' | 'base64';

export function mockExpoCrypto() {
  const nodeCrypto: any = require('crypto');
  const NodeBuffer: any = require('buffer').Buffer;

  function makeKey(raw: any) {
    return {
      raw,
      encoded: async (encoding: Encoding) => raw.toString(encoding),
    };
  }

  function makeSealed(iv: any, tag: any, ciphertext: any) {
    return {
      iv,
      tag,
      ciphertext,
      combined: async (encoding: Encoding) => NodeBuffer.concat([iv, tag, ciphertext]).toString(encoding),
    };
  }

  const AESEncryptionKey = {
    generate: async () => makeKey(nodeCrypto.randomBytes(32)),
    import: async (data: string, encoding: Encoding) => makeKey(NodeBuffer.from(data, encoding)),
  };

  const AESSealedData = {
    fromCombined: (combinedBase64: string) => {
      const combined = NodeBuffer.from(combinedBase64, 'base64');
      return makeSealed(combined.subarray(0, 12), combined.subarray(12, 28), combined.subarray(28));
    },
  };

  async function aesEncryptAsync(plaintextBase64: string, key: ReturnType<typeof makeKey>) {
    const iv = nodeCrypto.randomBytes(12);
    const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key.raw, iv);
    const plaintext = NodeBuffer.from(plaintextBase64, 'base64');
    const ciphertext = NodeBuffer.concat([cipher.update(plaintext), cipher.final()]);
    return makeSealed(iv, cipher.getAuthTag(), ciphertext);
  }

  async function aesDecryptAsync(
    sealed: ReturnType<typeof makeSealed>,
    key: ReturnType<typeof makeKey>,
    opts: { output: Encoding }
  ) {
    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key.raw, sealed.iv);
    decipher.setAuthTag(sealed.tag);
    const plaintext = NodeBuffer.concat([decipher.update(sealed.ciphertext), decipher.final()]);
    return plaintext.toString(opts.output);
  }

  return { AESEncryptionKey, AESSealedData, aesEncryptAsync, aesDecryptAsync };
}

/**
 * Real jest mock for expo-secure-store: an in-memory Map standing in for
 * the OS Keychain/Keystore. Same per-call-site jest.mock() requirement as
 * mockExpoCrypto above — each test file wraps this in its own inline
 * jest.mock('expo-secure-store', () => require('./__mocks__/expoCryptoMock').mockExpoSecureStore()).
 */
export function mockExpoSecureStore() {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
}
