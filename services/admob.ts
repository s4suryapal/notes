import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentStatus,
  AppOpenAd,
  BannerAdSize,
  MaxAdContentRating,
  InterstitialAd,
  AdEventType
} from 'react-native-google-mobile-ads';

// Helper function for consistent AdMob logging
const logAdMob = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`📺 [${timestamp}] [ADMOB_${category}] ${message}${logData ? '\n' + logData : ''}`);
};

/**
 * AdMobService - React Native AdMob integration for NotesAI
 */
export class AdMobService {
  private static instance: AdMobService;
  private isInitialized = false;

  // App Open Ad state
  private appOpenAd: AppOpenAd | null = null;
  private appOpenAdLoaded = false;
  private appOpenAdLoadTime = 0;
  private isShowingAppOpenAd = false;
  private isLoadingAppOpenAd = false;

  // Interstitial Ad state
  private isShowingInterstitial = false;

  constructor() {
    logAdMob('INIT', 'AdMobService instance created', {
      initialState: {
        isInitialized: false
      }
    });
  }

  public static getInstance(): AdMobService {
    if (!AdMobService.instance) {
      AdMobService.instance = new AdMobService();
    }
    return AdMobService.instance;
  }

  async initialize() {
    logAdMob('INITIALIZE_START', 'Starting AdMob initialization', {
      currentState: {
        isInitialized: this.isInitialized,
        willSkip: this.isInitialized
      }
    });

    if (this.isInitialized) {
      logAdMob('INITIALIZE_SKIP', 'AdMob already initialized - skipping');
      return;
    }

    try {
      const startTime = Date.now();

      // Configure request settings before initialization
      logAdMob('CONFIG_START', 'Configuring AdMob request settings', {
        isDev: __DEV__,
        testDevices: __DEV__ ? ['EMULATOR'] : []
      });

      await mobileAds().setRequestConfiguration({
        // Update all future requests suitable for parental guidance
        maxAdContentRating: MaxAdContentRating.PG,

        // Indicates that you want your content treated as child-directed for purposes of COPPA.
        tagForChildDirectedTreatment: false,

        // Indicates that you want the ad request to be handled in a manner suitable for users under the age of consent.
        tagForUnderAgeOfConsent: false,

        // An array of test device IDs to allow for testing
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });

      logAdMob('CONFIG_COMPLETE', 'AdMob configuration completed');

      // Initialize the Mobile Ads SDK
      logAdMob('SDK_INIT_START', 'Initializing Mobile Ads SDK');
      const adapterStatuses = await mobileAds().initialize();

      const initTime = Date.now() - startTime;
      this.isInitialized = true;

      logAdMob('INITIALIZE_SUCCESS', 'AdMob initialized successfully', {
        initializationTime: `${initTime}ms`,
        adapterStatuses,
        newState: {
          isInitialized: true
        }
      });

      // Handle consent for European users (GDPR) - non-blocking
      this.handleConsent().catch(error => {
        logAdMob('CONSENT_ERROR', 'Consent handling failed, but app continues', {
          error: error.message,
          impact: 'Non-blocking - app continues normally'
        });
      });

    } catch (error) {
      logAdMob('INITIALIZE_ERROR', 'AdMob initialization failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        criticalImpact: 'No ads will be shown'
      });
    }
  }

  private async handleConsent() {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate({
        debugGeography: __DEV__ ? AdsConsentDebugGeography.EEA : AdsConsentDebugGeography.DISABLED,
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      });

      // Check if consent form is available and status indicates consent is required
      if (consentInfo.isConsentFormAvailable && consentInfo.status === AdsConsentStatus.REQUIRED) {
        const { status } = await AdsConsent.showForm();
        console.log('Consent form status:', status);
      }
    } catch (error) {
      console.log('Consent handling error:', error);
      // Don't let consent errors block the app - continue initialization
    }
  }

  // Test Ad Unit IDs for development (Official Google Test IDs)
  // Source: https://developers.google.com/admob/android/test-ads
  // These are safe to use during development and testing
  getTestAdUnitIds() {
    return {
      // Banner Ads
      banner: 'ca-app-pub-3940256099942544/6300978111', // Standard Banner (official Google test ID)
      adaptiveBanner: 'ca-app-pub-3940256099942544/9214589741', // Adaptive Banner (official Google test ID)
      rectangleBanner: 'ca-app-pub-3940256099942544/6300978111', // Fixed Size Banner (for rectangles)

      // Other Ad Types
      appOpen: 'ca-app-pub-3940256099942544/9257395921', // App Open Ad
      interstitial: 'ca-app-pub-3940256099942544/1033173712', // Interstitial Ad
      rewarded: 'ca-app-pub-3940256099942544/5224354917', // Rewarded Ads
      rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379', // Rewarded Interstitial

      // Native Ads
      native: 'ca-app-pub-3940256099942544/2247696110', // Standard Native
      nativeVideo: 'ca-app-pub-3940256099942544/1044960115', // Native Video
    };
  }

  // Production Ad Unit IDs (replace with your actual AdMob IDs from Google AdMob Console)
  // Firebase Project: NotesAI
  // Package: com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes
  getProductionAdUnitIds() {
    return {
      // Banner Ads
      banner: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
      adaptiveBanner: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
      rectangleBanner: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',

      // Other Ad Types
      appOpen: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
      interstitial: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
      rewarded: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
      rewardedInterstitial: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',

      // Native Ads
      native: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
      nativeVideo: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy',
    };
  }

  // Get ad unit ID based on environment
  getAdUnitId(adType: 'banner' | 'adaptiveBanner' | 'rectangleBanner' | 'inlineAdaptiveBanner' | 'appOpen' | 'interstitial' | 'rewarded' | 'rewardedInterstitial' | 'native' | 'nativeVideo'): string {
    // Map inlineAdaptiveBanner to adaptiveBanner for ad unit ID
    const mappedAdType = adType === 'inlineAdaptiveBanner' ? 'adaptiveBanner' : adType;

    let adUnitId: string;
    if (__DEV__) {
      const testIds = this.getTestAdUnitIds();
      adUnitId = testIds[mappedAdType as keyof typeof testIds];
    } else {
      const prodIds = this.getProductionAdUnitIds();
      adUnitId = prodIds[mappedAdType as keyof typeof prodIds];
    }

    return adUnitId;
  }

  // Banner ad sizes
  getBannerSizes() {
    return {
      BANNER: BannerAdSize.BANNER, // 320x50
      LARGE_BANNER: BannerAdSize.LARGE_BANNER, // 320x100
      MEDIUM_RECTANGLE: BannerAdSize.MEDIUM_RECTANGLE, // 300x250
      FULL_BANNER: BannerAdSize.FULL_BANNER, // 468x60
      LEADERBOARD: BannerAdSize.LEADERBOARD, // 728x90
      ADAPTIVE_BANNER: BannerAdSize.ADAPTIVE_BANNER,
      ANCHORED_ADAPTIVE_BANNER: BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
    };
  }

  // Check if initialized
  isAdMobInitialized(): boolean {
    return this.isInitialized;
  }

  // AppOpen Ad Methods

  /**
   * Load App Open Ad
   */
  async loadAppOpenAd(): Promise<void> {
    if (this.isLoadingAppOpenAd || this.isAppOpenAdReady()) {
      logAdMob('APP_OPEN_LOAD_SKIP', 'App Open Ad already loading or loaded');
      return;
    }

    this.isLoadingAppOpenAd = true;
    logAdMob('APP_OPEN_LOAD_START', 'Loading App Open Ad...');

    try {
      const adUnitId = this.getAdUnitId('appOpen');

      this.appOpenAd = AppOpenAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
      });

      this.appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
        this.appOpenAdLoaded = true;
        this.appOpenAdLoadTime = Date.now();
        this.isLoadingAppOpenAd = false;
        logAdMob('APP_OPEN_LOADED', 'App Open Ad loaded successfully');
      });

      this.appOpenAd.addAdEventListener(AdEventType.ERROR, (error) => {
        this.isLoadingAppOpenAd = false;
        this.appOpenAdLoaded = false;
        logAdMob('APP_OPEN_ERROR', 'App Open Ad failed to load', { error });
      });

      this.appOpenAd.load();
    } catch (error) {
      this.isLoadingAppOpenAd = false;
      logAdMob('APP_OPEN_LOAD_ERROR', 'Failed to create App Open Ad', { error });
      throw error;
    }
  }

  /**
   * Show App Open Ad
   */
  async showAppOpenAd(): Promise<boolean> {
    if (this.isShowingAppOpenAd) {
      logAdMob('APP_OPEN_SHOW_SKIP', 'App Open Ad already showing');
      return false;
    }

    if (!this.isAppOpenAdReady()) {
      logAdMob('APP_OPEN_NOT_READY', 'App Open Ad not ready');
      return false;
    }

    // Check if ad is expired (4 hours)
    const adAge = Date.now() - this.appOpenAdLoadTime;
    const FOUR_HOURS = 4 * 60 * 60 * 1000;
    if (adAge > FOUR_HOURS) {
      logAdMob('APP_OPEN_EXPIRED', 'App Open Ad expired, loading new ad', { age: adAge });
      this.appOpenAd = null;
      this.appOpenAdLoaded = false;
      await this.loadAppOpenAd();
      return false;
    }

    try {
      this.isShowingAppOpenAd = true;
      logAdMob('APP_OPEN_SHOW_START', 'Showing App Open Ad');

      if (!this.appOpenAd) {
        this.isShowingAppOpenAd = false;
        return false;
      }

      // Add event listeners before showing
      this.appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
        this.isShowingAppOpenAd = false;
        this.appOpenAd = null;
        this.appOpenAdLoaded = false;
        logAdMob('APP_OPEN_CLOSED', 'App Open Ad closed, preloading next ad');
        // Preload next ad
        this.loadAppOpenAd();
      });

      this.appOpenAd.addAdEventListener(AdEventType.OPENED, () => {
        logAdMob('APP_OPEN_OPENED', 'App Open Ad opened');
      });

      await this.appOpenAd.show();
      logAdMob('APP_OPEN_SHOWN', 'App Open Ad shown successfully');
      return true;

    } catch (error) {
      this.isShowingAppOpenAd = false;
      logAdMob('APP_OPEN_SHOW_ERROR', 'Failed to show App Open Ad', { error });
      // Load new ad for next time
      this.appOpenAd = null;
      this.appOpenAdLoaded = false;
      await this.loadAppOpenAd();
      return false;
    }
  }

  /**
   * Check if App Open Ad is ready
   */
  isAppOpenAdReady(): boolean {
    return this.appOpenAdLoaded && this.appOpenAd !== null;
  }

  /**
   * Preload App Open Ad
   */
  async preloadAppOpenAd(): Promise<void> {
    logAdMob('APP_OPEN_PRELOAD', 'Preloading App Open Ad');
    await this.loadAppOpenAd();
  }

  // Helper method to get user-friendly error messages
  private getAdErrorMessage(error: any): string {
    if (!error) return 'Unknown error';

    const errorMessage = error.message || error.toString();

    // Map common AdMob error codes to user-friendly messages
    if (errorMessage.includes('no-fill')) {
      return 'No ads available';
    } else if (errorMessage.includes('network')) {
      return 'Network unavailable';
    } else if (errorMessage.includes('timeout')) {
      return 'Request timeout';
    } else if (errorMessage.includes('invalid-request')) {
      return 'Invalid request';
    } else if (errorMessage.includes('app-id-missing')) {
      return 'App configuration error';
    } else {
      // Return a generic message for other errors
      return 'Temporary issue';
    }
  }

  /**
   * Show an interstitial ad. Loads on demand and shows once loaded.
   * Resolves true when an ad is shown and closed, false on load error/timeout.
   */
  async showInterstitial(
    adUnitId: string,
    options?: { timeoutMs?: number }
  ): Promise<boolean> {
    const timeoutMs = Math.max(800, options?.timeoutMs ?? 2500);

    if (this.isShowingInterstitial) {
      logAdMob('INTERSTITIAL_SKIP', 'Interstitial already showing - skip duplicate request');
      return false;
    }

    if (!adUnitId || !adUnitId.trim()) {
      logAdMob('INTERSTITIAL_SKIP', 'No ad unit ID provided');
      return false;
    }

    logAdMob('INTERSTITIAL_REQUEST', 'Requesting interstitial load', { adUnitId, timeoutMs });

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['notes', 'productivity', 'organization'],
      });

      const cleanup = () => {
        try { unsubscribeLoaded(); } catch {}
        try { unsubscribeError(); } catch {}
        try { unsubscribeOpened(); } catch {}
        try { unsubscribeClosed(); } catch {}
      };

      const finish = (result: boolean, reason?: string, error?: any) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        this.isShowingInterstitial = false;
        logAdMob('INTERSTITIAL_FINISH', `Completed with result=${result}${reason ? ` (${reason})` : ''}`, error ? { error } : undefined);
        cleanup();
        resolve(result);
      };

      const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
        logAdMob('INTERSTITIAL_EVENT', 'LOADED - showing now');
        try {
          this.isShowingInterstitial = true;
          interstitial.show();
        } catch (e) {
          finish(false, 'show_exception', e);
        }
      });

      const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
        logAdMob('INTERSTITIAL_EVENT', 'OPENED');
      });

      const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        logAdMob('INTERSTITIAL_EVENT', 'CLOSED');
        finish(true);
      });

      const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        logAdMob('INTERSTITIAL_EVENT', 'ERROR', { error: String(error) });
        finish(false, 'load_error', error);
      });

      const timer = setTimeout(() => finish(false, 'timeout'), timeoutMs);

      try {
        interstitial.load();
      } catch (e) {
        finish(false, 'load_exception', e);
      }
    });
  }
}

export default AdMobService.getInstance();
