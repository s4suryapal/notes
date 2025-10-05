// React Native In-App Review wrapper
// Gracefully handles cases where the module is not available
// Implements Google Play and App Store in-app review APIs

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from './analytics';

// Using 'any' type since react-native-in-app-review is optional and may not be installed
type InAppReviewInstance = any;

interface ReviewPromptConfig {
  minLaunchCount?: number;          // Minimum app launches before showing (default: 5)
  minDaysSinceInstall?: number;     // Minimum days since install (default: 3)
  minDaysSinceLastPrompt?: number;  // Minimum days since last prompt (default: 90)
  minEventsCount?: number;           // Minimum significant events (default: 10)
}

interface ReviewStats {
  launchCount: number;
  installDate: number;
  lastPromptDate: number | null;
  eventsCount: number;
  reviewSubmitted: boolean;
}

export class InAppReviewService {
  private static instance: InAppReviewService;
  private inAppReview: InAppReviewInstance | null = null;
  private initialized = false;

  // Storage keys
  private readonly STORAGE_KEY = 'inAppReview_stats';

  // Default configuration following Google's best practices
  private config: Required<ReviewPromptConfig> = {
    minLaunchCount: 5,
    minDaysSinceInstall: 3,
    minDaysSinceLastPrompt: 90,
    minEventsCount: 10,
  };

  public static getInstance(): InAppReviewService {
    if (!InAppReviewService.instance) {
      InAppReviewService.instance = new InAppReviewService();
    }
    return InAppReviewService.instance;
  }

  private async loadModule(): Promise<boolean> {
    if (this.inAppReview) return true;
    try {
      const module = await import('react-native-in-app-review');
      this.inAppReview = module.default || module;
      return true;
    } catch (e) {
      console.log('[IN_APP_REVIEW] Module not available:', (e as any)?.toString?.());
      this.inAppReview = null;
      return false;
    }
  }

  private isAvailable(): boolean {
    return this.inAppReview !== null;
  }

  /**
   * Initialize the service with optional custom configuration
   */
  async initialize(customConfig?: ReviewPromptConfig): Promise<boolean> {
    if (this.initialized && this.inAppReview) {
      return true;
    }

    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      console.log('[IN_APP_REVIEW] Module not available, review prompts disabled');
      return false;
    }

    // Merge custom config with defaults
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    this.initialized = true;
    console.log('[IN_APP_REVIEW] Initialized with config:', this.config);

    // Track app launch
    await this.trackLaunch();

    return true;
  }

  /**
   * Configure review prompt behavior
   */
  configure(config: ReviewPromptConfig): void {
    this.config = { ...this.config, ...config };
    console.log('[IN_APP_REVIEW] Configuration updated:', this.config);
  }

  /**
   * Get current review statistics
   */
  private async getStats(): Promise<ReviewStats> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error reading stats:', error);
    }

    // Default stats
    return {
      launchCount: 0,
      installDate: Date.now(),
      lastPromptDate: null,
      eventsCount: 0,
      reviewSubmitted: false,
    };
  }

  /**
   * Save review statistics
   */
  private async saveStats(stats: ReviewStats): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error saving stats:', error);
    }
  }

  /**
   * Track app launch (call this in App.tsx or _layout.tsx)
   */
  async trackLaunch(): Promise<void> {
    const stats = await this.getStats();
    stats.launchCount += 1;
    await this.saveStats(stats);
    console.log('[IN_APP_REVIEW] Launch tracked:', stats.launchCount);
  }

  /**
   * Track significant events (e.g., note created, task completed, feature used)
   */
  async trackEvent(eventName: string): Promise<void> {
    const stats = await this.getStats();
    stats.eventsCount += 1;
    await this.saveStats(stats);
    console.log(`[IN_APP_REVIEW] Event tracked: ${eventName}, total events: ${stats.eventsCount}`);
  }

  /**
   * Track note creation return
   * Special method for tracking when user returns after creating a note
   * Shows review dialog on 4th return
   *
   * @returns true if review dialog was shown
   */
  async trackNoteCreationReturn(): Promise<boolean> {
    try {
      // Get current note creation count
      const NOTE_COUNT_KEY = 'inAppReview_noteCreations';
      const countStr = await AsyncStorage.getItem(NOTE_COUNT_KEY);
      const currentCount = countStr ? parseInt(countStr, 10) : 0;
      const newCount = currentCount + 1;

      console.log(`[IN_APP_REVIEW] Note creation tracked: ${newCount}/4`);

      // Save new count
      await AsyncStorage.setItem(NOTE_COUNT_KEY, newCount.toString());

      // Also track as event for general stats
      await this.trackEvent('note_creation');

      // Show review on 4th note creation
      if (newCount === 4) {
        console.log('[IN_APP_REVIEW] 4th note created, requesting review...');

        // Log to analytics
        await analytics.logNoteCreated('text');

        // Request review
        const shown = await this.requestReview();

        if (shown) {
          // Reset counter after showing review
          await AsyncStorage.setItem(NOTE_COUNT_KEY, '0');
          console.log('[IN_APP_REVIEW] Review shown, counter reset');
        }

        return shown;
      }

      return false;
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error tracking note creation:', error);
      return false;
    }
  }

  /**
   * Get note creation count
   */
  async getNoteCreationCount(): Promise<number> {
    try {
      const NOTE_COUNT_KEY = 'inAppReview_noteCreations';
      const countStr = await AsyncStorage.getItem(NOTE_COUNT_KEY);
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error getting note creation count:', error);
      return 0;
    }
  }

  /**
   * Reset note creation count (for testing)
   */
  async resetNoteCreationCount(): Promise<void> {
    try {
      const NOTE_COUNT_KEY = 'inAppReview_noteCreations';
      await AsyncStorage.removeItem(NOTE_COUNT_KEY);
      console.log('[IN_APP_REVIEW] Note creation count reset');
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error resetting note creation count:', error);
    }
  }

  /**
   * Check if review prompt should be shown based on criteria
   */
  async shouldPromptForReview(): Promise<boolean> {
    const stats = await this.getStats();
    const now = Date.now();

    // Already submitted review
    if (stats.reviewSubmitted) {
      console.log('[IN_APP_REVIEW] Review already submitted');
      return false;
    }

    // Check launch count
    if (stats.launchCount < this.config.minLaunchCount) {
      console.log(`[IN_APP_REVIEW] Not enough launches: ${stats.launchCount}/${this.config.minLaunchCount}`);
      return false;
    }

    // Check days since install
    const daysSinceInstall = (now - stats.installDate) / (1000 * 60 * 60 * 24);
    if (daysSinceInstall < this.config.minDaysSinceInstall) {
      console.log(`[IN_APP_REVIEW] Not enough days since install: ${daysSinceInstall.toFixed(1)}/${this.config.minDaysSinceInstall}`);
      return false;
    }

    // Check days since last prompt
    if (stats.lastPromptDate) {
      const daysSinceLastPrompt = (now - stats.lastPromptDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < this.config.minDaysSinceLastPrompt) {
        console.log(`[IN_APP_REVIEW] Too soon since last prompt: ${daysSinceLastPrompt.toFixed(1)}/${this.config.minDaysSinceLastPrompt}`);
        return false;
      }
    }

    // Check events count
    if (stats.eventsCount < this.config.minEventsCount) {
      console.log(`[IN_APP_REVIEW] Not enough events: ${stats.eventsCount}/${this.config.minEventsCount}`);
      return false;
    }

    console.log('[IN_APP_REVIEW] All criteria met, ready to prompt');
    return true;
  }

  /**
   * Check if in-app review is available on this device
   */
  async isInAppReviewAvailable(): Promise<boolean> {
    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      return false;
    }

    try {
      const available = await this.inAppReview.isAvailable();
      console.log('[IN_APP_REVIEW] Native API available:', available);
      return available;
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Request in-app review (shows the native review dialog)
   * This is the main method to call when you want to prompt for review
   *
   * Following Google's best practices:
   * - Don't call this in response to a user action (button press)
   * - Call it at natural transition points (after completing a task, etc.)
   * - Don't show more than once per 3 months
   *
   * @param force - Skip criteria checks (use only for testing)
   */
  async requestReview(force: boolean = false): Promise<boolean> {
    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      console.log('[IN_APP_REVIEW] Module not available');
      return false;
    }

    // Check if we should prompt
    if (!force) {
      const shouldPrompt = await this.shouldPromptForReview();
      if (!shouldPrompt) {
        console.log('[IN_APP_REVIEW] Criteria not met, skipping prompt');
        return false;
      }

      // Check if API is available on this device
      const available = await this.isInAppReviewAvailable();
      if (!available) {
        console.log('[IN_APP_REVIEW] Native API not available on this device');
        return false;
      }
    }

    try {
      console.log('[IN_APP_REVIEW] Requesting review...');

      // Request review
      await this.inAppReview.RequestInAppReview();

      // Update stats
      const stats = await this.getStats();
      stats.lastPromptDate = Date.now();
      await this.saveStats(stats);

      // Log analytics event
      await analytics.logScreenView('in_app_review_requested');

      console.log('[IN_APP_REVIEW] Review requested successfully');
      return true;
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error requesting review:', error);
      return false;
    }
  }

  /**
   * Mark review as submitted (call this if you know user submitted a review)
   */
  async markReviewSubmitted(): Promise<void> {
    const stats = await this.getStats();
    stats.reviewSubmitted = true;
    await this.saveStats(stats);

    await analytics.logScreenView('in_app_review_submitted');

    console.log('[IN_APP_REVIEW] Review marked as submitted');
  }

  /**
   * Reset all stats (use for testing only)
   */
  async resetStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('[IN_APP_REVIEW] Stats reset');
    } catch (error) {
      console.log('[IN_APP_REVIEW] Error resetting stats:', error);
    }
  }

  /**
   * Get debug information about review eligibility
   */
  async getDebugInfo(): Promise<string> {
    const stats = await this.getStats();
    const now = Date.now();
    const daysSinceInstall = (now - stats.installDate) / (1000 * 60 * 60 * 24);
    const daysSinceLastPrompt = stats.lastPromptDate
      ? (now - stats.lastPromptDate) / (1000 * 60 * 60 * 24)
      : null;

    const available = await this.isInAppReviewAvailable();
    const shouldPrompt = await this.shouldPromptForReview();
    const noteCreationCount = await this.getNoteCreationCount();

    return `
In-App Review Debug Info:
========================
Module Available: ${this.isAvailable()}
Native API Available: ${available}
Should Prompt: ${shouldPrompt}

Stats:
------
Launch Count: ${stats.launchCount} / ${this.config.minLaunchCount}
Days Since Install: ${daysSinceInstall.toFixed(1)} / ${this.config.minDaysSinceInstall}
Days Since Last Prompt: ${daysSinceLastPrompt?.toFixed(1) ?? 'Never'} / ${this.config.minDaysSinceLastPrompt}
Events Count: ${stats.eventsCount} / ${this.config.minEventsCount}
Note Creations: ${noteCreationCount} / 4 (auto-prompt at 4)
Review Submitted: ${stats.reviewSubmitted}

Config:
-------
${JSON.stringify(this.config, null, 2)}
    `.trim();
  }
}

export default InAppReviewService.getInstance();
