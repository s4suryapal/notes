import type { FirebaseCrashlyticsTypes } from '@react-native-firebase/crashlytics';
import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
  setUserId,
  setAttributes,
  log,
  recordError,
} from '@react-native-firebase/crashlytics';

type CrashlyticsInstance = FirebaseCrashlyticsTypes.Module;

export class CrashlyticsService {
  private static instance: CrashlyticsService;
  private crashlytics: CrashlyticsInstance | null = null;
  private initialized = false;

  public static getInstance(): CrashlyticsService {
    if (!CrashlyticsService.instance) {
      CrashlyticsService.instance = new CrashlyticsService();
    }
    return CrashlyticsService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized && this.crashlytics) {
      return true; // Already initialized, skip
    }

    try {
      // Get crashlytics instance using modular API
      this.crashlytics = getCrashlytics();
      await setCrashlyticsCollectionEnabled(this.crashlytics, true);
      this.initialized = true;
      console.log('[CRASHLYTICS] Initialized successfully');
      return true;
    } catch (error) {
      console.log('[CRASHLYTICS] Initialization error:', error);
      this.crashlytics = null;
      this.initialized = false;
      return false;
    }
  }

  private isAvailable(): boolean {
    return this.initialized && this.crashlytics !== null;
  }

  isCrashlyticsEnabled(): boolean {
    if (!this.isAvailable()) return false;
    return this.crashlytics!.isCrashlyticsCollectionEnabled;
  }

  async setUserId(userId: string): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping setUserId');
      return;
    }

    try {
      await setUserId(this.crashlytics!, userId);
    } catch (error) {
      console.log('[CRASHLYTICS] Set user ID error:', error);
    }
  }

  async setUserAttributes(attributes: Record<string, string>): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping setUserAttributes');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, attributes);
    } catch (error) {
      console.log('[CRASHLYTICS] Set attributes error:', error);
    }
  }

  logError(error: Error, context?: string): void {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping logError');
      return;
    }

    try {
      if (context) {
        log(this.crashlytics!, context);
      }
      recordError(this.crashlytics!, error);
    } catch (e) {
      console.log('[CRASHLYTICS] Log error failed:', e);
    }
  }

  logMessage(message: string, priority: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping logMessage');
      return;
    }

    try {
      log(this.crashlytics!, `[${priority.toUpperCase()}] ${message}`);
    } catch (error) {
      console.log('[CRASHLYTICS] Log message error:', error);
    }
  }

  crash(): void {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, cannot crash');
      return;
    }
    // For testing purposes only - DO NOT use in production
    this.crashlytics!.crash();
  }

  // Custom crash reporting methods specific to NotesAI

  async reportNoteOperationError(operation: string, noteId: string, error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportNoteOperationError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        operation_type: operation,
        note_id: noteId,
        error_type: 'note_operation_error',
      });
      this.logError(error, `Note operation error: ${operation} - ${noteId}`);
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report note operation error:', e);
    }
  }

  async reportNetworkError(url: string, statusCode: number, error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportNetworkError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        network_url: url,
        status_code: statusCode.toString(),
        error_type: 'network_error',
      });
      this.logError(error, `Network error: ${url} - Status: ${statusCode}`);
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report network error:', e);
    }
  }

  async reportPermissionError(permission: string, error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportPermissionError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        permission_type: permission,
        error_type: 'permission_error',
      });
      this.logError(error, `Permission error: ${permission}`);
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report permission error:', e);
    }
  }

  async reportStorageError(operation: string, error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportStorageError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        storage_operation: operation,
        error_type: 'storage_error',
      });
      this.logError(error, `Storage error: ${operation}`);
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report storage error:', e);
    }
  }

  async reportNavigationError(route: string, error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportNavigationError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        navigation_route: route,
        error_type: 'navigation_error',
      });
      this.logError(error, `Navigation error: ${route}`);
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report navigation error:', e);
    }
  }

  async reportOCRError(error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportOCRError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        error_type: 'ocr_error',
      });
      this.logError(error, 'OCR processing error');
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report OCR error:', e);
    }
  }

  async reportAudioRecordingError(error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportAudioRecordingError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        error_type: 'audio_recording_error',
      });
      this.logError(error, 'Audio recording error');
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report audio recording error:', e);
    }
  }

  async reportCameraError(error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportCameraError');
      return;
    }

    try {
      await setAttributes(this.crashlytics!, {
        error_type: 'camera_error',
      });
      this.logError(error, 'Camera access error');
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report camera error:', e);
    }
  }
}

export default CrashlyticsService.getInstance();
