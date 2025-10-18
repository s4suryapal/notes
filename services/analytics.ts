// React Native Firebase Analytics wrapper - modular API (v23+)
// Gracefully handles cases where Firebase is not available

// Using 'any' type since @react-native-firebase/analytics is optional and may not be installed
// At runtime, dynamic imports will handle the module availability gracefully
type AnalyticsInstance = any;

export class AnalyticsService {
  private static instance: AnalyticsService;
  private analytics: AnalyticsInstance | null = null;
  private initialized = false;

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private async loadFirebase(): Promise<boolean> {
    if (this.analytics) return true;
    try {
      // Import modular API functions
      const { getAnalytics } = await import('@react-native-firebase/analytics');
      this.analytics = getAnalytics();
      return true;
    } catch (e) {
      console.log('[ANALYTICS] Firebase modules not available:', (e as any)?.toString?.());
      this.analytics = null;
      return false;
    }
  }

  private isAvailable(): boolean {
    return this.analytics !== null;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized && this.analytics) {
      return true;
    }

    const loaded = await this.loadFirebase();
    if (!loaded || !this.isAvailable()) {
      return false;
    }

    try {
      const { setAnalyticsCollectionEnabled } = await import('@react-native-firebase/analytics');
      await setAnalyticsCollectionEnabled(this.analytics, true);
      this.initialized = true;
      console.log('[ANALYTICS] Initialized');
      return true;
    } catch (error) {
      console.log('[ANALYTICS] initialization error:', error);
      this.initialized = false;
      return false;
    }
  }

  async logEvent(eventName: string, parameters?: { [key: string]: any }): Promise<void> {
    const loaded = await this.loadFirebase();
    if (!loaded || !this.isAvailable()) {
      return;
    }

    try {
      const { logEvent } = await import('@react-native-firebase/analytics');
      await logEvent(this.analytics, eventName as any, parameters);
    } catch (error) {
      console.log('[ANALYTICS] logEvent error:', error);
    }
  }

  async setUserId(userId: string): Promise<void> {
    const loaded = await this.loadFirebase();
    if (!loaded || !this.isAvailable()) {
      return;
    }

    try {
      const { setUserId } = await import('@react-native-firebase/analytics');
      await setUserId(this.analytics, userId);
    } catch (error) {
      console.log('[ANALYTICS] setUserId error:', error);
    }
  }

  async setUserProperty(name: string, value: string): Promise<void> {
    const loaded = await this.loadFirebase();
    if (!loaded || !this.isAvailable()) {
      return;
    }

    try {
      const { setUserProperty } = await import('@react-native-firebase/analytics');
      await setUserProperty(this.analytics, name, value);
    } catch (error) {
      console.log('[ANALYTICS] setUserProperty error:', error);
    }
  }

  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    const loaded = await this.loadFirebase();
    if (!loaded || !this.isAvailable()) {
      return;
    }

    try {
      // Use logEvent with screen_view event name (standard Firebase Analytics pattern)
      const { logEvent } = await import('@react-native-firebase/analytics');
      await logEvent(this.analytics, 'screen_view' as any, {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.log('[ANALYTICS] logScreenView error:', error);
    }
  }

  // Common app events
  async logAppOpen(): Promise<void> {
    await this.logEvent('app_open');
  }

  async logPermissionRequest(permission: string, granted: boolean): Promise<void> {
    await this.logEvent('permission_request', {
      permission_type: permission,
      granted: granted,
    });
  }

  async logLanguageSelection(language: string): Promise<void> {
    await this.logEvent('language_selection', {
      selected_language: language,
    });
  }

  // Note-specific events
  async logNoteCreated(type: 'text' | 'checklist' | 'audio' | 'photo' | 'scan' | 'drawing'): Promise<void> {
    await this.logEvent('note_created', {
      note_type: type,
    });
  }

  async logNoteEdited(noteId: string): Promise<void> {
    await this.logEvent('note_edited', {
      note_id: noteId,
    });
  }

  async logNoteDeleted(noteId: string): Promise<void> {
    await this.logEvent('note_deleted', {
      note_id: noteId,
    });
  }

  async logNoteFavorited(noteId: string): Promise<void> {
    await this.logEvent('note_favorited', {
      note_id: noteId,
    });
  }

  async logNoteArchived(noteId: string): Promise<void> {
    await this.logEvent('note_archived', {
      note_id: noteId,
    });
  }

  async logNoteShared(noteId: string, method: string): Promise<void> {
    await this.logEvent('note_shared', {
      note_id: noteId,
      share_method: method,
    });
  }

  // Category events
  async logCategoryCreated(categoryName: string): Promise<void> {
    await this.logEvent('category_created', {
      category_name: categoryName,
    });
  }

  async logCategoryDeleted(categoryName: string): Promise<void> {
    await this.logEvent('category_deleted', {
      category_name: categoryName,
    });
  }

  // Search events
  async logSearch(query: string, resultsCount: number): Promise<void> {
    await this.logEvent('search', {
      search_term: query,
      results_count: resultsCount,
    });
  }

  // OCR/Scanner events
  async logDocumentScanned(): Promise<void> {
    await this.logEvent('document_scanned');
  }

  async logOCRPerformed(success: boolean): Promise<void> {
    await this.logEvent('ocr_performed', {
      success: success,
    });
  }

  // AI events
  async logAIFeatureUsed(feature: string): Promise<void> {
    await this.logEvent('ai_feature_used', {
      feature_name: feature,
    });
  }

  // Call end screen events
  async logCallEnd(duration?: number): Promise<void> {
    await this.logEvent('call_ended', {
      call_duration: duration,
    });
  }

  async logCallEndAction(action: string): Promise<void> {
    await this.logEvent('call_end_action', {
      action_type: action,
    });
  }

  // Export/Print events
  async logNoteExported(format: string): Promise<void> {
    await this.logEvent('note_exported', {
      export_format: format,
    });
  }

  async logNotePrinted(): Promise<void> {
    await this.logEvent('note_printed');
  }

  // Security events
  async logBiometricAuth(success: boolean): Promise<void> {
    await this.logEvent('biometric_auth', {
      success: success,
    });
  }

  // Settings events
  async logThemeChanged(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.logEvent('theme_changed', {
      theme_mode: theme,
    });
  }

  // Engagement events
  async logFeatureTourStarted(tourName: string): Promise<void> {
    await this.logEvent('feature_tour_started', {
      tour_name: tourName,
    });
  }

  async logFeatureTourCompleted(tourName: string): Promise<void> {
    await this.logEvent('feature_tour_completed', {
      tour_name: tourName,
    });
  }

  async logFeatureTourSkipped(tourName: string, stepIndex: number): Promise<void> {
    await this.logEvent('feature_tour_skipped', {
      tour_name: tourName,
      step_index: stepIndex,
    });
  }

  // View mode events
  async logViewModeChanged(viewMode: 'grid' | 'list'): Promise<void> {
    await this.logEvent('view_mode_changed', {
      view_mode: viewMode,
    });
  }

  async logSortModeChanged(sortBy: string): Promise<void> {
    await this.logEvent('sort_mode_changed', {
      sort_by: sortBy,
    });
  }

  // Bulk operations
  async logBulkOperation(operation: 'delete' | 'archive' | 'move', count: number): Promise<void> {
    await this.logEvent('bulk_operation', {
      operation_type: operation,
      items_count: count,
    });
  }

  // User retention milestones
  async logMilestone(milestone: string, value?: number): Promise<void> {
    await this.logEvent('milestone_reached', {
      milestone_type: milestone,
      milestone_value: value,
    });
  }

  // Session tracking
  async logSessionStart(): Promise<void> {
    await this.logEvent('session_start');
  }

  async logSessionEnd(duration: number): Promise<void> {
    await this.logEvent('session_end', {
      session_duration: duration,
    });
  }

  // Error tracking (non-crash errors)
  async logUserError(errorType: string, context?: string): Promise<void> {
    await this.logEvent('user_error', {
      error_type: errorType,
      error_context: context,
    });
  }
}

export default AnalyticsService.getInstance();
