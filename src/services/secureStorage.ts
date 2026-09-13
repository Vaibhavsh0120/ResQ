import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// ── Encrypted-at-rest storage: drop-in replacement for AsyncStorage ───────
// Added 2026-09-10 to close a real gap flagged in docs/data-safety.md and
// AGENT.md: at-rest protection previously relied entirely on
// the OS's own app-storage encryption, with nothing ResQ-side on top. This
// adds a real app-level layer for the genuinely sensitive domains (medical
// info, profile/PII, family circle) without changing every call site's
// shape — same getItem/setItem/removeItem interface as AsyncStorage, so
// existing services swap their import and nothing else.
//
// Design (standard "envelope encryption", not a custom cipher):
//   - Payload: AES-256-GCM (authenticated — tampering is detected, not just
//     unreadable) via expo-crypto's native aesEncryptAsync/aesDecryptAsync.
//   - Key: a single random AES-256 key, generated once, held in
//     expo-secure-store (iOS Keychain / Android Keystore-backed encrypted
//     prefs) — never in AsyncStorage, never in JS-reachable plain storage.
//     SecureStore itself has a real per-value size ceiling (historically
//     ~2KB on iOS) — that's why only the *key* lives there and the
//     (much larger) actual JSON payload stays in AsyncStorage, encrypted.
//   - AsyncStorage holds only ciphertext (IV + tag + encrypted bytes,
//     base64) under the same keys services already use — inspecting the
//     raw storage (e.g. via a rooted device or a debug bridge) no longer
//     yields readable medical/profile data the way plain AsyncStorage did.
//
// Web has no Keychain/Keystore-equivalent — expo-secure-store's own docs
// list its supported platforms as Android/iOS/tvOS only, and calling it on
// web throws. Rather than silently degrading (encrypting with a key that
// itself sits in insecure web storage would be theater, not real
// protection), this module honestly falls back to plain AsyncStorage on
// web and says so via `isEncryptionActive()` — see that function's doc
// comment for what to do with it. This mirrors the existing, deliberate
// MiniMap.tsx precedent (native MapLibre vs. an honest static fallback on
// web) rather than introducing a new pattern.

const ENCRYPTION_KEY_STORE_ID = 'resq_secure_storage_key_v1';
const NATIVE_ENCRYPTION_AVAILABLE = Platform.OS !== 'web';

let cachedKey: AESEncryptionKey | null = null;
let keyPromise: Promise<AESEncryptionKey> | null = null;

/**
 * Loads the app's single AES-256 storage key from SecureStore, generating
 * and persisting a new one on first run. Cached in memory for the life of
 * the app session so every read/write after the first doesn't re-hit
 * SecureStore. Native platforms only — callers must check
 * NATIVE_ENCRYPTION_AVAILABLE (or call the exported getItem/setItem below,
 * which already do) before calling this.
 */
async function getOrCreateEncryptionKey(): Promise<AESEncryptionKey> {
  if (cachedKey) return cachedKey;
  if (keyPromise) return keyPromise;

  keyPromise = (async () => {
    const existingHex = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORE_ID);
    if (existingHex) {
      const key = await AESEncryptionKey.import(existingHex, 'hex');
      cachedKey = key;
      return key;
    }
    const newKey = await AESEncryptionKey.generate();
    const newKeyHex = await newKey.encoded('hex');
    await SecureStore.setItemAsync(ENCRYPTION_KEY_STORE_ID, newKeyHex);
    cachedKey = newKey;
    return newKey;
  })();

  return keyPromise;
}

async function encryptString(plaintext: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const plaintextBase64 = btoa(unescape(encodeURIComponent(plaintext)));
  const sealed = await aesEncryptAsync(plaintextBase64, key);
  // combined('base64') resolves to a string (not Uint8Array) per the
  // 'base64' encoding argument — see expo-crypto's AESSealedData.combined docs.
  const combined = await sealed.combined('base64');
  return combined as string;
}

async function decryptString(combinedBase64: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const sealed = AESSealedData.fromCombined(combinedBase64);
  const decryptedBase64 = await aesDecryptAsync(sealed, key, { output: 'base64' });
  const decryptedBase64Str =
    typeof decryptedBase64 === 'string' ? decryptedBase64 : new TextDecoder().decode(decryptedBase64);
  return decodeURIComponent(escape(atob(decryptedBase64Str)));
}

/**
 * True when reads/writes through this module are actually encrypted
 * (native platforms). False on web, where this module transparently
 * behaves like plain AsyncStorage instead. Exposed so a caller that's
 * about to write something especially sensitive can decide to warn or
 * branch — no current call site does, but this is here rather than
 * hidden so that choice stays available instead of silently absent.
 */
export function isEncryptionActive(): boolean {
  return NATIVE_ENCRYPTION_AVAILABLE;
}

/**
 * Permanently deletes the app's AES encryption key from SecureStore.
 * Ciphertext left behind in AsyncStorage after this becomes permanently
 * unreadable — this is the deliberate mechanism behind a real "delete my
 * account" for the encrypted domains: see localDataService.wipeLocalData,
 * which calls this alongside AsyncStorage.clear(). Also clears the
 * in-memory cache so a later getOrCreateEncryptionKey() call (e.g. the
 * user creates a new account in the same app session) generates a fresh
 * key rather than reusing a cached reference to the deleted one.
 */
export async function destroyEncryptionKey(): Promise<void> {
  if (!NATIVE_ENCRYPTION_AVAILABLE) return;
  await SecureStore.deleteItemAsync(ENCRYPTION_KEY_STORE_ID);
  cachedKey = null;
  keyPromise = null;
}

/**
 * Decrypts a raw AsyncStorage value if it looks like ciphertext from this
 * module, otherwise returns it unchanged. Used by
 * localDataService.exportLocalData so a "download my data" export hands
 * the user their actual readable data, not opaque base64 ciphertext, for
 * whichever keys happen to be encrypted. Safe to call on every key in the
 * store, encrypted or not — a value that fails to decrypt (not this
 * module's ciphertext at all, e.g. the plain-text SEEDED_KEY flag) is
 * assumed to already be plaintext and returned as-is rather than reported
 * as an error, since a data export should degrade to "show what we have"
 * rather than fail outright over one key.
 */
export async function decryptForExport(rawValue: string): Promise<string> {
  if (!NATIVE_ENCRYPTION_AVAILABLE) return rawValue;
  try {
    return await decryptString(rawValue);
  } catch {
    return rawValue;
  }
}

/**
 * Reads and decrypts a value previously written with setItem. Returns null
 * if the key doesn't exist. On web (no native encryption available), reads
 * the plain AsyncStorage value directly — see the module doc comment above.
 */
export async function getItem(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  if (!NATIVE_ENCRYPTION_AVAILABLE) return raw;
  try {
    return await decryptString(raw);
  } catch {
    // Ciphertext that fails to decrypt (corrupted, or written before this
    // module existed — see migrateLegacyKey below for the normal upgrade
    // path) is treated as absent rather than thrown, matching
    // AsyncStorage's own "missing key" shape so callers don't need a new
    // error-handling branch just because this module sits in front of it.
    return null;
  }
}

/** Encrypts and writes a value under `key`. On web, writes plaintext (see module doc comment). */
export async function setItem(key: string, value: string): Promise<void> {
  if (!NATIVE_ENCRYPTION_AVAILABLE) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  const ciphertext = await encryptString(value);
  await AsyncStorage.setItem(key, ciphertext);
}

/** Removes a value. Same key space as AsyncStorage — no encryption-specific cleanup needed. */
export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

/**
 * One-time migration for a key that may still hold data written before
 * this module existed (plain JSON, not ciphertext). Reads the raw stored
 * value; if it parses as valid JSON already, it's legacy plaintext — encrypt
 * it in place and return the parsed value. If it's not valid JSON, it's
 * assumed to already be ciphertext from this module and is read normally
 * via getItem. Safe to call on every read (idempotent: a value already
 * migrated will fail the JSON.parse branch and fall through to the normal
 * decrypt path) — see each service's call site for exactly where this
 * replaces a bare AsyncStorage.getItem.
 *
 * Not safe against two concurrent calls for the same key racing each
 * other mid-migration — acceptable here since no service in this app
 * issues concurrent reads/writes to the same storage key (each hook's
 * fetch/update cycle is sequential), but worth knowing if that ever
 * changes.
 */
export async function migrateLegacyPlaintext(key: string): Promise<string | null> {
  if (!NATIVE_ENCRYPTION_AVAILABLE) {
    return AsyncStorage.getItem(key);
  }
  const raw = await AsyncStorage.getItem(key);
  if (raw === null) return null;
  try {
    JSON.parse(raw);
    // Parsed cleanly as JSON while NATIVE_ENCRYPTION_AVAILABLE is true —
    // ciphertext is base64 of binary GCM output and will not parse as JSON
    // except by an astronomically unlikely coincidence, so this is legacy
    // plaintext from before this module shipped. Encrypt it in place.
    await setItem(key, raw);
    return raw;
  } catch {
    // Not valid JSON as raw text — already ciphertext. Decrypt normally.
    return getItem(key);
  }
}
