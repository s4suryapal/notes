/**
 * Storage Service
 *
 * Centralized storage management using MMKV for high-performance key-value storage.
 * Provides a singleton interface for all storage operations across the app.
 *
 * Benefits:
 * - Single source of truth for storage operations
 * - Centralized error handling and logging
 * - Type-safe storage keys
 * - Easy to mock for testing
 */

import { MMKVStorage, storage } from '@/lib/mmkvStorage';

// Storage key constants
export const STORAGE_KEYS = {
  // Theme
  THEME_MODE: 'app:theme',

  // Language
  LANGUAGE: 'app_language',
  FIRST_LAUNCH_COMPLETE: 'first_launch_complete',

  // Onboarding
  ONBOARDING_COMPLETED: '@notesai_onboarding_completed',
  HOME_TOUR_COMPLETED: '@notesai_home_tour_completed',
  EDITOR_TOUR_COMPLETED: '@notesai_editor_tour_completed',

  // Biometric
  BIOMETRIC_ENABLED: 'biometric_enabled',
  BIOMETRIC_MASTER_KEY: 'biometric_master_key',

  // Notes & Categories
  NOTES: 'notes',
  CATEGORIES: 'categories',
  NEXT_NOTE_ID: 'nextNoteId',
  NEXT_CATEGORY_ID: 'nextCategoryId',

  // App State
  LAST_LAUNCH_COUNT: 'last_launch_count',
  INSTALL_DATE: 'install_date',
  LAST_REVIEW_PROMPT: 'last_review_prompt',
  REVIEW_PROMPT_COUNT: 'review_prompt_count',
} as const;

class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Get a string value from storage
   */
  getString(key: string): string | null {
    try {
      return storage.getString(key) || null;
    } catch (error) {
      console.error(`[StorageService] Error getting string for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set a string value in storage
   */
  setString(key: string, value: string): void {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error(`[StorageService] Error setting string for key: ${key}`, error);
    }
  }

  /**
   * Get a boolean value from storage
   */
  getBoolean(key: string): boolean {
    try {
      return storage.getBoolean(key) || false;
    } catch (error) {
      console.error(`[StorageService] Error getting boolean for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Set a boolean value in storage
   */
  setBoolean(key: string, value: boolean): void {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error(`[StorageService] Error setting boolean for key: ${key}`, error);
    }
  }

  /**
   * Get a number value from storage
   */
  getNumber(key: string): number | null {
    try {
      const value = storage.getNumber(key);
      return value !== undefined ? value : null;
    } catch (error) {
      console.error(`[StorageService] Error getting number for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set a number value in storage
   */
  setNumber(key: string, value: number): void {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error(`[StorageService] Error setting number for key: ${key}`, error);
    }
  }

  /**
   * Get a JSON object from storage
   */
  getObject<T>(key: string): T | null {
    try {
      const value = storage.getString(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[StorageService] Error getting object for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set a JSON object in storage
   */
  setObject<T>(key: string, value: T): void {
    try {
      storage.set(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[StorageService] Error setting object for key: ${key}`, error);
    }
  }

  /**
   * Delete a key from storage
   */
  delete(key: string): void {
    try {
      storage.delete(key);
    } catch (error) {
      console.error(`[StorageService] Error deleting key: ${key}`, error);
    }
  }

  /**
   * Check if a key exists in storage
   */
  contains(key: string): boolean {
    try {
      return storage.contains(key);
    } catch (error) {
      console.error(`[StorageService] Error checking if key exists: ${key}`, error);
      return false;
    }
  }

  /**
   * Get all keys in storage
   */
  getAllKeys(): string[] {
    try {
      return storage.getAllKeys();
    } catch (error) {
      console.error('[StorageService] Error getting all keys', error);
      return [];
    }
  }

  /**
   * Clear all data from storage
   * Use with caution!
   */
  clearAll(): void {
    try {
      storage.clearAll();
      console.log('[StorageService] All storage cleared');
    } catch (error) {
      console.error('[StorageService] Error clearing storage', error);
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
export default storageService;
