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
 * Handles Unicode/UTF-8 strings properly
 */
function base64Encode(str: string): string {
  try {
    // Convert string to UTF-8 bytes
    const encoder = encodeURIComponent(str);
    // Replace URL encoding with characters
    const utf8Str = encoder.replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });

    // Use btoa if available
    if (typeof btoa !== 'undefined') {
      return btoa(utf8Str);
    }

    // Fallback: manual base64 encoding
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < utf8Str.length) {
      const a = utf8Str.charCodeAt(i++);
      const b = i < utf8Str.length ? utf8Str.charCodeAt(i++) : 0;
      const c = i < utf8Str.length ? utf8Str.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars[(bitmap >> 18) & 63];
      result += chars[(bitmap >> 12) & 63];
      result += i > utf8Str.length + 1 ? '=' : chars[(bitmap >> 6) & 63];
      result += i > utf8Str.length ? '=' : chars[bitmap & 63];
    }
    return result;
  } catch (error) {
    console.error('Error in base64Encode:', error);
    throw new Error('Failed to encode to base64');
  }
}

/**
 * Base64 decode using atob (React Native compatible)
 * Handles Unicode/UTF-8 strings properly
 */
function base64Decode(str: string): string {
  try {
    let decoded: string;

    // Use atob if available
    if (typeof atob !== 'undefined') {
      decoded = atob(str);
    } else {
      // Fallback: manual base64 decoding
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      const cleanStr = str.replace(/[^A-Za-z0-9+/=]/g, '');

      for (let i = 0; i < cleanStr.length;) {
        const a = chars.indexOf(cleanStr.charAt(i++));
        const b = chars.indexOf(cleanStr.charAt(i++));
        const c = chars.indexOf(cleanStr.charAt(i++));
        const d = chars.indexOf(cleanStr.charAt(i++));

        const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

        result += String.fromCharCode((bitmap >> 16) & 255);
        if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
        if (d !== 64) result += String.fromCharCode(bitmap & 255);
      }
      decoded = result;
    }

    // Convert from UTF-8 bytes back to Unicode string
    // Convert each byte to percent encoding manually
    let percentEncoded = '';
    for (let i = 0; i < decoded.length; i++) {
      const byte = decoded.charCodeAt(i);
      percentEncoded += '%' + byte.toString(16).padStart(2, '0').toUpperCase();
    }

    return decodeURIComponent(percentEncoded);
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
    // Allow empty strings - they're valid content
    // Only reject null or undefined
    if (text === null || text === undefined) {
      throw new Error('Cannot encrypt null or undefined text');
    }

    // Handle empty string - just return a marker to indicate it was encrypted
    if (text === '') {
      return base64Encode('__EMPTY__');
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
    if (encryptedText === null || encryptedText === undefined) {
      throw new Error('Cannot decrypt null or undefined text');
    }

    // Handle empty encrypted text
    if (encryptedText === '') {
      return '';
    }

    const key = await getEncryptionKey();
    // Decode from base64
    const encrypted = base64Decode(encryptedText);

    // Check if this was an empty string marker
    if (encrypted === '__EMPTY__') {
      return '';
    }

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
