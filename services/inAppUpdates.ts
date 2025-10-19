// React Native In-App Updates wrapper
// Gracefully handles cases where the module is not available
// Implements Google Play In-App Updates API (Android) and App Store checks (iOS)

import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from './analytics';

// Using 'any' type since sp-react-native-in-app-updates is optional and may not be installed
type InAppUpdatesInstance = any;

// Android update types
export enum AndroidUpdateType {
  FLEXIBLE = 0,   // User can continue using app during download
  IMMEDIATE = 1,  // User must update before continuing
}

interface UpdateConfig {
  checkOnAppStart?: boolean;           // Check for updates on app start (default: true)
  checkIntervalHours?: number;         // Hours between checks (default: 24)
  forceUpdateIfAvailable?: boolean;    // Force immediate update if available (default: false)
  defaultUpdateType?: AndroidUpdateType; // Default Android update type (default: FLEXIBLE)
}

interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion?: string;
  availableVersion?: string;
  immediateUpdateAllowed?: boolean;
  flexibleUpdateAllowed?: boolean;
  updatePriority?: number;           // Android: 0-5 (5 = highest priority)
  installStatus?: number;
}

interface UpdateStats {
  lastCheckDate: number | null;
  lastUpdatePromptDate: number | null;
  updateDismissedCount: number;
  updateCompletedDate: number | null;
}

export class InAppUpdatesService {
  private static instance: InAppUpdatesService;
  private inAppUpdates: InAppUpdatesInstance | null = null;
  private initialized = false;

  // Storage keys
  private readonly STORAGE_KEY = 'inAppUpdates_stats';

  // Default configuration
  private config: Required<UpdateConfig> = {
    checkOnAppStart: true,
    checkIntervalHours: 24,
    forceUpdateIfAvailable: false,
    defaultUpdateType: AndroidUpdateType.FLEXIBLE,
  };

  public static getInstance(): InAppUpdatesService {
    if (!InAppUpdatesService.instance) {
      InAppUpdatesService.instance = new InAppUpdatesService();
    }
    return InAppUpdatesService.instance;
  }

  private async loadModule(): Promise<boolean> {
    if (this.inAppUpdates) return true;
    try {
      const module = await import('sp-react-native-in-app-updates' as any);
      this.inAppUpdates = module.default || module;
      return true;
    } catch (e) {
      console.log('[IN_APP_UPDATES] Module not available:', (e as any)?.toString?.());
      this.inAppUpdates = null;
      return false;
    }
  }

  private isAvailable(): boolean {
    return this.inAppUpdates !== null;
  }

  /**
   * Initialize the service with optional custom configuration
   */
  async initialize(customConfig?: UpdateConfig): Promise<boolean> {
    if (this.initialized && this.inAppUpdates) {
      return true;
    }

    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      console.log('[IN_APP_UPDATES] Module not available, update checks disabled');
      return false;
    }

    // Merge custom config with defaults
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    this.initialized = true;
    console.log('[IN_APP_UPDATES] Initialized with config:', this.config);

    // Check for updates on app start if enabled
    if (this.config.checkOnAppStart) {
      setTimeout(() => {
        this.checkForUpdates().catch(err => {
          console.log('[IN_APP_UPDATES] Auto-check failed:', err);
        });
      }, 2000); // Delay 2 seconds to not block app startup
    }

    return true;
  }

  /**
   * Configure update behavior
   */
  configure(config: UpdateConfig): void {
    this.config = { ...this.config, ...config };
    console.log('[IN_APP_UPDATES] Configuration updated:', this.config);
  }

  /**
   * Get update statistics
   */
  private async getStats(): Promise<UpdateStats> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error reading stats:', error);
    }

    return {
      lastCheckDate: null,
      lastUpdatePromptDate: null,
      updateDismissedCount: 0,
      updateCompletedDate: null,
    };
  }

  /**
   * Save update statistics
   */
  private async saveStats(stats: UpdateStats): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error saving stats:', error);
    }
  }

  /**
   * Check if we should check for updates based on interval
   */
  private async shouldCheckForUpdates(): Promise<boolean> {
    const stats = await this.getStats();
    const now = Date.now();

    // Never checked before
    if (!stats.lastCheckDate) {
      return true;
    }

    // Check if enough time has passed
    const hoursSinceLastCheck = (now - stats.lastCheckDate) / (1000 * 60 * 60);
    if (hoursSinceLastCheck >= this.config.checkIntervalHours) {
      console.log(`[IN_APP_UPDATES] ${hoursSinceLastCheck.toFixed(1)} hours since last check, checking again`);
      return true;
    }

    console.log(`[IN_APP_UPDATES] Only ${hoursSinceLastCheck.toFixed(1)} hours since last check, skipping (interval: ${this.config.checkIntervalHours}h)`);
    return false;
  }

  /**
   * Check for available updates
   * Returns update information if available
   */
  async checkForUpdates(force: boolean = false): Promise<UpdateInfo | null> {
    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      console.log('[IN_APP_UPDATES] Module not available');
      return null;
    }

    // Check if we should check based on interval
    if (!force) {
      const shouldCheck = await this.shouldCheckForUpdates();
      if (!shouldCheck) {
        return null;
      }
    }

    try {
      console.log('[IN_APP_UPDATES] Checking for updates...');

      // Check for updates
      const updateInfo = await this.inAppUpdates.checkNeedsUpdate();

      // Update stats
      const stats = await this.getStats();
      stats.lastCheckDate = Date.now();
      await this.saveStats(stats);

      if (updateInfo.shouldUpdate) {
        console.log('[IN_APP_UPDATES] Update available:', updateInfo);

        // Log analytics event
        await analytics.logScreenView('update_available');

        return {
          updateAvailable: true,
          currentVersion: updateInfo.currentVersion,
          availableVersion: updateInfo.storeVersion,
          immediateUpdateAllowed: updateInfo.immediateUpdateAllowed,
          flexibleUpdateAllowed: updateInfo.flexibleUpdateAllowed,
          updatePriority: updateInfo.updatePriority,
          installStatus: updateInfo.installStatus,
        };
      }

      console.log('[IN_APP_UPDATES] No update available');
      return {
        updateAvailable: false,
        currentVersion: updateInfo.currentVersion,
      };
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Start an update flow (Android)
   * @param updateType - Type of update (FLEXIBLE or IMMEDIATE)
   */
  async startUpdate(updateType?: AndroidUpdateType): Promise<boolean> {
    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      console.log('[IN_APP_UPDATES] Module not available');
      return false;
    }

    if (Platform.OS !== 'android') {
      console.log('[IN_APP_UPDATES] In-app updates only supported on Android');
      return false;
    }

    const type = updateType ?? this.config.defaultUpdateType;

    try {
      console.log(`[IN_APP_UPDATES] Starting ${type === AndroidUpdateType.FLEXIBLE ? 'FLEXIBLE' : 'IMMEDIATE'} update...`);

      const result = await this.inAppUpdates.startUpdate({
        updateType: type,
      });

      // Update stats
      const stats = await this.getStats();
      stats.lastUpdatePromptDate = Date.now();
      await this.saveStats(stats);

      // Log analytics event
      await analytics.logScreenView('update_started');

      console.log('[IN_APP_UPDATES] Update flow started:', result);
      return true;
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error starting update:', error);

      // User cancelled or error
      const stats = await this.getStats();
      stats.updateDismissedCount += 1;
      await this.saveStats(stats);

      await analytics.logScreenView('update_dismissed');

      return false;
    }
  }

  /**
   * Install a pending flexible update (Android)
   * Call this after a flexible update has been downloaded
   */
  async installUpdate(): Promise<boolean> {
    const loaded = await this.loadModule();
    if (!loaded || !this.isAvailable()) {
      console.log('[IN_APP_UPDATES] Module not available');
      return false;
    }

    if (Platform.OS !== 'android') {
      console.log('[IN_APP_UPDATES] In-app updates only supported on Android');
      return false;
    }

    try {
      console.log('[IN_APP_UPDATES] Installing update...');
      await this.inAppUpdates.installUpdate();

      // Update stats
      const stats = await this.getStats();
      stats.updateCompletedDate = Date.now();
      await this.saveStats(stats);

      await analytics.logScreenView('update_installed');

      return true;
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error installing update:', error);
      return false;
    }
  }

  /**
   * Check and prompt for updates with smart logic
   * This is the main method to call for automatic update prompts
   *
   * @param force - Skip interval checks (use for testing)
   */
  async checkAndPrompt(force: boolean = false): Promise<boolean> {
    const updateInfo = await this.checkForUpdates(force);

    if (!updateInfo || !updateInfo.updateAvailable) {
      return false;
    }

    // Force immediate update if configured or high priority
    const shouldForceImmediate =
      this.config.forceUpdateIfAvailable ||
      (updateInfo.updatePriority && updateInfo.updatePriority >= 4);

    if (Platform.OS === 'android') {
      // Android: Use in-app updates
      const updateType = shouldForceImmediate
        ? AndroidUpdateType.IMMEDIATE
        : this.config.defaultUpdateType;

      return await this.startUpdate(updateType);
    } else if (Platform.OS === 'ios') {
      // iOS: Show alert with App Store link
      return await this.showIOSUpdateAlert(updateInfo, !!shouldForceImmediate);
    }

    return false;
  }

  /**
   * Show iOS update alert (opens App Store)
   */
  private async showIOSUpdateAlert(updateInfo: UpdateInfo, force: boolean): Promise<boolean> {
    return new Promise((resolve) => {
      const title = force ? 'Update Required' : 'Update Available';
      const message = updateInfo.availableVersion
        ? `Version ${updateInfo.availableVersion} is now available. You are currently on version ${updateInfo.currentVersion}.`
        : 'A new version of the app is available.';

      const buttons = force
        ? [
            {
              text: 'Update Now',
              onPress: () => {
                this.openAppStore();
                resolve(true);
              },
            },
          ]
        : [
            {
              text: 'Later',
              style: 'cancel' as const,
              onPress: () => {
                this.trackUpdateDismissed();
                resolve(false);
              },
            },
            {
              text: 'Update',
              onPress: () => {
                this.openAppStore();
                resolve(true);
              },
            },
          ];

      Alert.alert(title, message, buttons, { cancelable: !force });
    });
  }

  /**
   * Open App Store (iOS) or Play Store (Android)
   */
  async openAppStore(): Promise<void> {
    try {
      // You should replace these with your actual app store IDs
      const appStoreId = 'YOUR_IOS_APP_ID'; // e.g., '123456789'
      const androidPackageName = 'com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes';

      const url = Platform.select({
        ios: `https://apps.apple.com/app/id${appStoreId}`,
        android: `market://details?id=${androidPackageName}`,
      });

      if (url) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);

          await analytics.logScreenView('app_store_opened');
        } else {
          // Fallback to web URL
          const webUrl = Platform.select({
            ios: `https://apps.apple.com/app/id${appStoreId}`,
            android: `https://play.google.com/store/apps/details?id=${androidPackageName}`,
          });
          if (webUrl) {
            await Linking.openURL(webUrl);
          }
        }
      }
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error opening store:', error);
    }
  }

  /**
   * Track update dismissed
   */
  private async trackUpdateDismissed(): Promise<void> {
    const stats = await this.getStats();
    stats.updateDismissedCount += 1;
    await this.saveStats(stats);

    await analytics.logScreenView('update_dismissed');
  }

  /**
   * Add listener for flexible update download progress (Android)
   */
  addUpdateDownloadListener(callback: (bytesDownloaded: number, totalBytes: number) => void): (() => void) | null {
    if (!this.inAppUpdates || Platform.OS !== 'android') {
      return null;
    }

    try {
      const listener = this.inAppUpdates.addStatusUpdateListener((status: any) => {
        if (status.bytesDownloaded !== undefined && status.totalBytesToDownload !== undefined) {
          callback(status.bytesDownloaded, status.totalBytesToDownload);
        }
      });

      // Return cleanup function
      return () => {
        if (listener && typeof listener.remove === 'function') {
          listener.remove();
        }
      };
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error adding listener:', error);
      return null;
    }
  }

  /**
   * Reset all stats (use for testing only)
   */
  async resetStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('[IN_APP_UPDATES] Stats reset');
    } catch (error) {
      console.log('[IN_APP_UPDATES] Error resetting stats:', error);
    }
  }

  /**
   * Get debug information about updates
   */
  async getDebugInfo(): Promise<string> {
    const stats = await this.getStats();
    const now = Date.now();

    const hoursSinceLastCheck = stats.lastCheckDate
      ? (now - stats.lastCheckDate) / (1000 * 60 * 60)
      : null;

    const updateInfo = await this.checkForUpdates(true);

    return `
In-App Updates Debug Info:
==========================
Module Available: ${this.isAvailable()}
Platform: ${Platform.OS}

Stats:
------
Last Check: ${stats.lastCheckDate ? new Date(stats.lastCheckDate).toLocaleString() : 'Never'}
Hours Since Last Check: ${hoursSinceLastCheck?.toFixed(1) ?? 'N/A'}
Last Update Prompt: ${stats.lastUpdatePromptDate ? new Date(stats.lastUpdatePromptDate).toLocaleString() : 'Never'}
Update Dismissed Count: ${stats.updateDismissedCount}
Last Update Completed: ${stats.updateCompletedDate ? new Date(stats.updateCompletedDate).toLocaleString() : 'Never'}

Update Info:
------------
Update Available: ${updateInfo?.updateAvailable ?? 'Unknown'}
Current Version: ${updateInfo?.currentVersion ?? 'Unknown'}
Available Version: ${updateInfo?.availableVersion ?? 'N/A'}
${Platform.OS === 'android' ? `Update Priority: ${updateInfo?.updatePriority ?? 'N/A'}` : ''}

Config:
-------
${JSON.stringify(this.config, null, 2)}
    `.trim();
  }
}

export default InAppUpdatesService.getInstance();
