type CrashlyticsInstance = any;

export class CrashlyticsService {
  private static instance: CrashlyticsService;
  private crashlytics: CrashlyticsInstance | null = null;
  private initialized = false;
  private loader?: Promise<boolean>;

  private async loadFirebase(): Promise<boolean> {
    if (this.crashlytics && this.initialized) return true;
    if (this.loader) return this.loader;
    this.loader = (async () => {
      try {
        const mod = await import('@react-native-firebase/crashlytics');
        this.crashlytics = mod.getCrashlytics();
        await mod.setCrashlyticsCollectionEnabled(this.crashlytics, true);
        this.initialized = true;
        console.log('[CRASHLYTICS] Initialized successfully');
        return true;
      } catch (error) {
        console.log('[CRASHLYTICS] Initialization error:', error);
        this.crashlytics = null;
        this.initialized = false;
        return false;
      }
    })();
    return this.loader;
  }

  public static getInstance(): CrashlyticsService {
    if (!CrashlyticsService.instance) {
      CrashlyticsService.instance = new CrashlyticsService();
    }
    return CrashlyticsService.instance;
  }

  async initialize(): Promise<boolean> {
    return this.loadFirebase();
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setUserId(this.crashlytics!, userId);
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, attributes);
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
      import('@react-native-firebase/crashlytics')
        .then((mod) => {
          try {
            if (context) {
              mod.log(this.crashlytics!, context);
            }
            mod.recordError(this.crashlytics!, error);
          } catch (inner) {
            console.log('[CRASHLYTICS] Log error failed (inner):', inner);
          }
        })
        .catch((e) => {
          console.log('[CRASHLYTICS] Log error failed:', e);
        });
    } catch (e) {
      console.log('[CRASHLYTICS] Log error failed (import):', e);
    }
  }

  logMessage(message: string, priority: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping logMessage');
      return;
    }

    try {
      import('@react-native-firebase/crashlytics')
        .then((mod) => {
          try {
            mod.log(this.crashlytics!, `[${priority.toUpperCase()}] ${message}`);
          } catch (inner) {
            console.log('[CRASHLYTICS] Log message error (inner):', inner);
          }
        })
        .catch((error) => {
          console.log('[CRASHLYTICS] Log message error:', error);
        });
    } catch (error) {
      console.log('[CRASHLYTICS] Log message error (import):', error);
    }
  }

  crash(): void {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, cannot crash');
      return;
    }
    // For testing purposes only - DO NOT use in production
    try {
      this.crashlytics!.crash();
    } catch {}
  }

  // Custom crash reporting methods specific to NotesAI

  async reportNoteOperationError(operation: string, noteId: string, error: Error): Promise<void> {
    if (!this.isAvailable()) {
      console.log('[CRASHLYTICS] Not available, skipping reportNoteOperationError');
      return;
    }

    try {
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
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
      const mod = await import('@react-native-firebase/crashlytics');
      await mod.setAttributes(this.crashlytics!, {
        error_type: 'camera_error',
      });
      this.logError(error, 'Camera access error');
    } catch (e) {
      console.log('[CRASHLYTICS] Failed to report camera error:', e);
    }
  }
}

export default CrashlyticsService.getInstance();
