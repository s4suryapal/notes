import { MMKV } from 'react-native-mmkv';

// Create MMKV instance
export const storage = new MMKV({
  id: 'notesai-storage',
  encryptionKey: 'notesai-encryption-key', // For basic encryption
});

/**
 * MMKV wrapper that mimics AsyncStorage API for easy migration
 */
export const MMKVStorage = {
  getItem: (key: string): string | null => {
    try {
      return storage.getString(key) ?? null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error('MMKV setItem error:', error);
      throw error;
    }
  },

  removeItem: (key: string): void => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('MMKV removeItem error:', error);
      throw error;
    }
  },

  clear: (): void => {
    try {
      storage.clearAll();
    } catch (error) {
      console.error('MMKV clear error:', error);
      throw error;
    }
  },

  getAllKeys: (): string[] => {
    try {
      return storage.getAllKeys();
    } catch (error) {
      console.error('MMKV getAllKeys error:', error);
      return [];
    }
  },
};
