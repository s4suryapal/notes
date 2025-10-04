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
    const key = await getEncryptionKey();
    const encrypted = xorEncryptDecrypt(text, key);
    // Convert to base64 for safe storage
    return Buffer.from(encrypted, 'binary').toString('base64');
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw error;
  }
}

/**
 * Decrypt text
 */
export async function decryptText(encryptedText: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    // Decode from base64
    const encrypted = Buffer.from(encryptedText, 'base64').toString('binary');
    return xorEncryptDecrypt(encrypted, key);
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw error;
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
