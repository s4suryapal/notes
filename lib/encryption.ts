import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Storage key for AES-256-GCM
const AES_KEY_V1 = 'notesai_aes_key_v1';

/**
 * Get or generate encryption key
 */
/**
 * WebCrypto helpers (AES-256-GCM)
 */
function hasSubtleCrypto(): boolean {
  try {
    return typeof globalThis.crypto !== 'undefined' && !!globalThis.crypto.subtle && typeof globalThis.crypto.subtle.importKey === 'function';
  } catch {
    return false;
  }
}

async function getRandomBytes(len: number): Promise<Uint8Array> {
  const arr = new Uint8Array(len);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(arr);
    return arr;
  }
  // Fallback to expo-crypto
  const rnd = await Crypto.getRandomBytesAsync(len);
  return Uint8Array.from(rnd);
}

// Base64 helpers for raw bytes (no Unicode mangling)
const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const a = bytes[i++] ?? 0;
    const b = bytes[i++] ?? 0;
    const c = bytes[i++] ?? 0;
    const triplet = (a << 16) | (b << 8) | c;
    result += B64_ALPHABET[(triplet >> 18) & 0x3f];
    result += B64_ALPHABET[(triplet >> 12) & 0x3f];
    result += i - 1 > bytes.length ? '=' : B64_ALPHABET[(triplet >> 6) & 0x3f];
    result += i > bytes.length ? '=' : B64_ALPHABET[triplet & 0x3f];
  }
  return result;
}

function base64ToBytes(b64: string): Uint8Array {
  // Clean invalid chars
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const out: number[] = [];
  let i = 0;
  while (i < clean.length) {
    const a = B64_ALPHABET.indexOf(clean.charAt(i++));
    const b = B64_ALPHABET.indexOf(clean.charAt(i++));
    const c = B64_ALPHABET.indexOf(clean.charAt(i++));
    const d = B64_ALPHABET.indexOf(clean.charAt(i++));
    const triplet = (a << 18) | (b << 12) | ((c & 0x3f) << 6) | (d & 0x3f);
    out.push((triplet >> 16) & 0xff);
    if (c !== 64) out.push((triplet >> 8) & 0xff);
    if (d !== 64) out.push(triplet & 0xff);
  }
  return Uint8Array.from(out);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  return base64ToBytes(b64).buffer;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buf));
}

async function getOrCreateAesKey(): Promise<CryptoKey> {
  const subtle = globalThis.crypto!.subtle;
  // Try existing
  const stored = await SecureStore.getItemAsync(AES_KEY_V1);
  if (stored) {
    const raw = base64ToArrayBuffer(stored);
    return subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  // Generate 32-byte key
  const rawKey = getRandomBytes(32);
  const key = await subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  await SecureStore.setItemAsync(AES_KEY_V1, arrayBufferToBase64(rawKey.buffer));
  return key;
}


/**
 * Encrypt text
 */
export async function encryptText(text: string): Promise<string> {
  try {
    // Allow empty strings - they're valid content
    // Only reject null or undefined
    if (text === null || text === undefined) {
      throw new Error('Cannot encrypt null or undefined text');
    }

    // Prefer AES-256-GCM (WebCrypto) when available
    if (!hasSubtleCrypto()) throw new Error('AES-GCM not available on this device');
    const subtle = globalThis.crypto!.subtle;
    const key = await getOrCreateAesKey();
    const iv = await getRandomBytes(12); // 96-bit IV
    const enc = new TextEncoder().encode(text);
    const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
    const payload = `aesgcm:v1:${arrayBufferToBase64(iv.buffer)}:${arrayBufferToBase64(cipher)}`;
    return payload;
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt text
 */
export async function decryptText(encryptedText: string): Promise<string> {
  try {
    if (encryptedText === null || encryptedText === undefined) {
      throw new Error('Cannot decrypt null or undefined text');
    }

    // Handle empty encrypted text
    if (encryptedText === '') {
      return '';
    }

    // AES-256-GCM path: detect payload prefix
    if (!encryptedText.startsWith('aesgcm:v1:')) {
      // Backward compatibility removed per product decision
      throw new Error('Unsupported ciphertext format');
    }
    if (!hasSubtleCrypto()) throw new Error('AES-GCM not available on this device');
    const parts = encryptedText.split(':');
    if (parts.length !== 4) throw new Error('Invalid AES payload');
    const iv = base64ToArrayBuffer(parts[2]);
    const cipher = base64ToArrayBuffer(parts[3]);
    const subtle = globalThis.crypto!.subtle;
    const key = await getOrCreateAesKey();
    const plainBuf = await subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher);
    return new TextDecoder().decode(plainBuf);
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if encryption is available
 */
export async function isEncryptionAvailable(): Promise<boolean> {
  try {
    if (!hasSubtleCrypto()) return false;
    await getOrCreateAesKey();
    return true;
  } catch {
    return false;
  }
}
