import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY = 'notesai_encryption_key';

/**
 * Get or generate encryption key
 */
async function getEncryptionKey(): Promise<string> {
  try {
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY);

    if (existingKey) {
      return existingKey;
    }

    // Generate new key using crypto
    const key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`
    );
    await SecureStore.setItemAsync(ENCRYPTION_KEY, key);

    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw error;
  }
}

/**
 * Base64 encode using btoa (React Native compatible)
 */
function base64Encode(str: string): string {
  try {
    // Convert string to array of char codes, then to base64
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    // Use btoa if available, otherwise manual conversion
    if (typeof btoa !== 'undefined') {
      return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
    }
    // Fallback: manual base64 encoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const a = bytes[i++];
      const b = i < bytes.length ? bytes[i++] : 0;
      const c = i < bytes.length ? bytes[i++] : 0;
      const bitmap = (a << 16) | (b << 8) | c;
      result += chars[(bitmap >> 18) & 63];
      result += chars[(bitmap >> 12) & 63];
      result += i > bytes.length + 1 ? '=' : chars[(bitmap >> 6) & 63];
      result += i > bytes.length ? '=' : chars[bitmap & 63];
    }
    return result;
  } catch (error) {
    console.error('Error in base64Encode:', error);
    throw new Error('Failed to encode to base64');
  }
}

/**
 * Base64 decode using atob (React Native compatible)
 */
function base64Decode(str: string): string {
  try {
    // Use atob if available
    if (typeof atob !== 'undefined') {
      const decoded = atob(str);
      return decoded;
    }
    // Fallback: manual base64 decoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    str = str.replace(/[^A-Za-z0-9+/=]/g, '');
    for (let i = 0; i < str.length;) {
      const a = chars.indexOf(str.charAt(i++));
      const b = chars.indexOf(str.charAt(i++));
      const c = chars.indexOf(str.charAt(i++));
      const d = chars.indexOf(str.charAt(i++));
      const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (d !== 64) result += String.fromCharCode(bitmap & 255);
    }
    return result;
  } catch (error) {
    console.error('Error in base64Decode:', error);
    throw new Error('Failed to decode from base64');
  }
}

/**
 * Simple XOR encryption (for demo - use proper encryption in production)
 * Note: For production, consider using react-native-aes-crypto or similar
 */
function xorEncryptDecrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Encrypt text
 */
export async function encryptText(text: string): Promise<string> {
  try {
    if (!text) {
      throw new Error('Cannot encrypt empty text');
    }
    const key = await getEncryptionKey();
    const encrypted = xorEncryptDecrypt(text, key);
    // Convert to base64 for safe storage
    return base64Encode(encrypted);
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
    if (!encryptedText) {
      throw new Error('Cannot decrypt empty text');
    }
    const key = await getEncryptionKey();
    // Decode from base64
    const encrypted = base64Decode(encryptedText);
    return xorEncryptDecrypt(encrypted, key);
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
    await getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
