import { getRemoteConfig, fetchAndActivate, getValue, setDefaults } from '@react-native-firebase/remote-config';

/**
 * RemoteConfigService - Manages Firebase Remote Config
 *
 * Remote Config Parameters for AppOpen Ads:
 * - settings_screen_show_appopen: boolean - Show AppOpen ads on settings screen
 * - settings_screen_appopen_id: string - Ad unit ID for settings screen
 * - appopen_enabled_screens: string - Comma-separated list of screens (e.g., "settings,premium,sync")
 * - appopen_ads_enabled: boolean - Global AppOpen ads toggle
 * - appopen_min_launches: number - Minimum app launches before showing ads
 */
class RemoteConfigService {
  private static instance: RemoteConfigService;
  private isInitialized = false;

  // Default values for AppOpen Ads
  private readonly defaults = {
    // Screen-specific AppOpen ad controls
    settings_screen_show_appopen: false,
    settings_screen_appopen_id: '',
    premium_screen_show_appopen: false,
    premium_screen_appopen_id: '',

    // General AppOpen ad controls
    appopen_enabled_screens: '', // Empty = show on all screens
    appopen_ads_enabled: true,
    appopen_min_launches: 3,

    // Default ad unit IDs (fallback)
    appopen_ad_unit_id_test: 'ca-app-pub-3940256099942544/9257395921',
    appopen_ad_unit_id_prod: '',
  };

  private constructor() {
    console.log('[REMOTE_CONFIG] Service created');
  }

  public static getInstance(): RemoteConfigService {
    if (!RemoteConfigService.instance) {
      RemoteConfigService.instance = new RemoteConfigService();
    }
    return RemoteConfigService.instance;
  }

  /**
   * Initialize Remote Config
   * @param minimumFetchIntervalMillis Minimum fetch interval (default: 12 hours in production, 0 in dev)
   * @returns boolean - true if initialized successfully, false if using defaults
   */
  async initialize(minimumFetchIntervalMillis?: number): Promise<boolean> {
    if (this.isInitialized) {
      console.log('[REMOTE_CONFIG] Already initialized');
      return true;
    }

    try {
      console.log('[REMOTE_CONFIG] Initializing...');

      // Get Remote Config instance using modular API
      const config = getRemoteConfig();

      // Set default values
      await setDefaults(config, this.defaults);

      // Set minimum fetch interval
      // Development: 0 = fetch on every call (for testing)
      // Production: 43200000 = 12 hours (recommended)
      const fetchInterval = minimumFetchIntervalMillis ?? (__DEV__ ? 0 : 43200000);
      config.settings.minimumFetchIntervalMillis = fetchInterval;

      console.log(`[REMOTE_CONFIG] Fetch interval set to: ${fetchInterval}ms`);

      // Fetch and activate
      await this.fetchAndActivate();

      this.isInitialized = true;
      console.log('[REMOTE_CONFIG] ✅ Initialized successfully');
      return true;
    } catch (error) {
      console.error('[REMOTE_CONFIG] ❌ Initialization failed:', error);

      // Don't throw - use defaults instead
      this.isInitialized = false;
      console.log('[REMOTE_CONFIG] ⚠️  Using default configuration');
      return false;
    }
  }

  /**
   * Fetch and activate Remote Config values
   * @param timeoutMs Timeout in milliseconds (default: 10000ms)
   */
  async fetchAndActivate(timeoutMs: number = 10000): Promise<boolean> {
    try {
      console.log('[REMOTE_CONFIG] Fetching latest config...');

      const config = getRemoteConfig();

      // Add timeout wrapper to prevent hanging
      const fetchWithTimeout = Promise.race([
        fetchAndActivate(config),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Remote Config fetch timeout')), timeoutMs)
        ),
      ]);

      const activated = await fetchWithTimeout;

      if (activated) {
        console.log('[REMOTE_CONFIG] ✅ New config fetched and activated');
      } else {
        console.log('[REMOTE_CONFIG] ℹ️ Using cached config (no changes)');
      }

      // Log current AppOpen ad configuration
      this.logAppOpenAdConfig();

      return activated;
    } catch (error) {
      console.error('[REMOTE_CONFIG] ❌ Fetch failed:', error);
      // Use cached/default values
      this.logAppOpenAdConfig();
      return false;
    }
  }

  /**
   * Log current AppOpen ad configuration
   */
  private logAppOpenAdConfig(): void {
    console.log('[REMOTE_CONFIG] 📺 AppOpen Ad Configuration:', {
      settings_screen_show_appopen: this.getBoolean('settings_screen_show_appopen'),
      settings_screen_appopen_id: this.getString('settings_screen_appopen_id'),
      appopen_enabled_screens: this.getString('appopen_enabled_screens'),
      appopen_ads_enabled: this.getBoolean('appopen_ads_enabled'),
      appopen_min_launches: this.getNumber('appopen_min_launches'),
    });
  }

  /**
   * Get string value
   */
  getString(key: string): string {
    const config = getRemoteConfig();
    return getValue(config, key).asString();
  }

  /**
   * Get boolean value
   */
  getBoolean(key: string): boolean {
    const config = getRemoteConfig();
    return getValue(config, key).asBoolean();
  }

  /**
   * Get number value
   */
  getNumber(key: string): number {
    const config = getRemoteConfig();
    return getValue(config, key).asNumber();
  }

  /**
   * Get all values as object
   */
  getAll(): Record<string, any> {
    const config = getRemoteConfig();
    const all = config.getAll();
    const result: Record<string, any> = {};

    Object.keys(all).forEach((key) => {
      const value = all[key];
      result[key] = value.asString(); // Get as string first, can be parsed later
    });

    return result;
  }

  // ===== AppOpen Ads Specific Methods =====

  /**
   * Get enabled screens for AppOpen ads
   * @returns Array of screen names that should show AppOpen ads
   */
  getAppOpenEnabledScreens(): string[] {
    const screensString = this.getString('appopen_enabled_screens');

    if (!screensString || screensString.trim() === '') {
      // Empty = show on all screens
      return [];
    }

    // Parse comma-separated list
    return screensString
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Check if AppOpen ads are enabled for a specific screen
   * @param screenName Name of the screen (e.g., 'settings')
   */
  shouldShowAppOpenOnScreen(screenName: string): boolean {
    // Check global toggle
    if (!this.getBoolean('appopen_ads_enabled')) {
      return false;
    }

    // Check screen-specific toggle (e.g., settings_screen_show_appopen)
    const screenKey = `${screenName}_screen_show_appopen`;
    const screenSpecificEnabled = this.getBoolean(screenKey);

    if (screenSpecificEnabled) {
      console.log(`[REMOTE_CONFIG] ✅ ${screenName} screen: AppOpen ads ENABLED (via ${screenKey})`);
      return true;
    }

    // Check if screen is in enabled screens list
    const enabledScreens = this.getAppOpenEnabledScreens();

    if (enabledScreens.length === 0) {
      // Empty list = show on all screens
      return true;
    }

    const isEnabled = enabledScreens.includes(screenName);
    console.log(
      `[REMOTE_CONFIG] ${isEnabled ? '✅' : '❌'} ${screenName} screen in enabled list:`,
      enabledScreens
    );

    return isEnabled;
  }

  /**
   * Get AppOpen ad unit ID for a specific screen
   * Falls back to default if not configured
   *
   * @param screenName Name of the screen (e.g., 'settings')
   * @param isProduction Whether to use production or test ad unit ID
   */
  getAppOpenAdUnitId(screenName?: string, isProduction: boolean = !__DEV__): string {
    // Try to get screen-specific ad unit ID (e.g., settings_screen_appopen_id)
    if (screenName) {
      const screenKey = `${screenName}_screen_appopen_id`;
      const screenAdUnitId = this.getString(screenKey);

      if (screenAdUnitId && screenAdUnitId.trim() !== '') {
        console.log(`[REMOTE_CONFIG] Using ad unit ID for ${screenName}: ${screenAdUnitId}`);
        return screenAdUnitId;
      }
    }

    // Fall back to default ad unit ID
    const defaultKey = isProduction ? 'appopen_ad_unit_id_prod' : 'appopen_ad_unit_id_test';
    const defaultAdUnitId = this.getString(defaultKey);

    if (defaultAdUnitId && defaultAdUnitId.trim() !== '') {
      console.log(`[REMOTE_CONFIG] Using default ${isProduction ? 'production' : 'test'} ad unit ID`);
      return defaultAdUnitId;
    }

    // Final fallback to hardcoded test ID
    const hardcodedTestId = 'ca-app-pub-3940256099942544/9257395921';
    console.log(`[REMOTE_CONFIG] Using hardcoded test ad unit ID: ${hardcodedTestId}`);
    return hardcodedTestId;
  }

  /**
   * Get minimum launches before showing AppOpen ads
   */
  getAppOpenMinLaunches(): number {
    return this.getNumber('appopen_min_launches');
  }

  /**
   * Check if AppOpen ads are globally enabled
   */
  isAppOpenAdsEnabled(): boolean {
    return this.getBoolean('appopen_ads_enabled');
  }

  /**
   * Get complete AppOpen ad configuration
   */
  getAppOpenAdConfig() {
    return {
      enabled: this.isAppOpenAdsEnabled(),
      enabledScreens: this.getAppOpenEnabledScreens(),
      minLaunches: this.getAppOpenMinLaunches(),
      settingsScreen: {
        enabled: this.getBoolean('settings_screen_show_appopen'),
        adUnitId: this.getString('settings_screen_appopen_id'),
      },
      premiumScreen: {
        enabled: this.getBoolean('premium_screen_show_appopen'),
        adUnitId: this.getString('premium_screen_appopen_id'),
      },
    };
  }
}

export default RemoteConfigService.getInstance();
