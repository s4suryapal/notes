import mobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentStatus,
  AppOpenAd,
  BannerAdSize,
  MaxAdContentRating
} from 'react-native-google-mobile-ads';

// Helper function for consistent AdMob logging
const logAdMob = (category: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logData = data ? JSON.stringify(data, null, 2) : '';
  console.log(`📺 [${timestamp}] [ADMOB_${category}] ${message}${logData ? '\n' + logData : ''}`);
};

/**
 * AdMobService - React Native AdMob integration for NotesAI
 *
 * IMPORTANT: App Open Ads are managed natively in Kotlin (AppOpenAdManager.kt)
 * following Google AdMob guidelines. This service maintains the TypeScript API
 * for backward compatibility but delegates to native implementation.
 *
 * Native Implementation Benefits:
 * - Proper app lifecycle tracking with ProcessLifecycleOwner
 * - Launch count tracking (no ads on first 2 launches)
 * - Automatic preloading and expiration handling
 * - Better integration with splash screen and cold starts
 *
 * See: android/app/src/main/java/com/notesai/easynotes/ai/smart/notepad/ocr/docscanner/privatenotes/AppOpenAdManager.kt
 */
export class AdMobService {
  private static instance: AdMobService;
  private isInitialized = false;

  // NOTE: App Open Ads are now handled natively in Kotlin
  // These properties are kept for backward compatibility but are deprecated
  private appOpenAd: AppOpenAd | null = null;
  private appOpenAdLoaded = false;
  private appOpenAdLoadTime = 0;
  private isShowingAppOpenAd = false;

  constructor() {
    logAdMob('INIT', 'AdMobService instance created', {
      initialState: {
        isInitialized: false,
        note: 'App Open Ads managed by native AppOpenAdManager.kt'
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
  // NOTE: These methods are deprecated - App Open Ads are now managed natively
  // Keeping them for backward compatibility, but they now log warnings

  /**
   * @deprecated App Open Ads are now managed by native AppOpenAdManager.kt
   * This method is kept for backward compatibility but does nothing.
   */
  async loadAppOpenAd(): Promise<void> {
    logAdMob('DEPRECATED', 'loadAppOpenAd() called but App Open Ads are managed natively', {
      recommendation: 'App Open Ads are automatically managed by AppOpenAdManager.kt',
      location: 'android/app/src/main/java/com/notesai/easynotes/ai/smart/notepad/ocr/docscanner/privatenotes/AppOpenAdManager.kt'
    });

    // No-op: Native implementation handles loading automatically
    return Promise.resolve();
  }

  /**
   * @deprecated App Open Ads are now managed by native AppOpenAdManager.kt
   * This method is kept for backward compatibility but always returns false.
   */
  async showAppOpenAd(): Promise<boolean> {
    logAdMob('DEPRECATED', 'showAppOpenAd() called but App Open Ads are managed natively', {
      recommendation: 'App Open Ads are automatically shown by AppOpenAdManager.kt on app foreground',
      behavior: 'Native implementation follows Google guidelines (no ads on first 2 launches)'
    });

    // No-op: Native implementation handles showing automatically
    return Promise.resolve(false);
  }

  /**
   * @deprecated App Open Ads are now managed by native AppOpenAdManager.kt
   */
  isAppOpenAdReady(): boolean {
    logAdMob('DEPRECATED', 'isAppOpenAdReady() called but App Open Ads are managed natively');
    return false;
  }

  /**
   * @deprecated App Open Ads are now managed by native AppOpenAdManager.kt
   * This method is kept for backward compatibility but does nothing.
   */
  async preloadAppOpenAd(): Promise<void> {
    logAdMob('DEPRECATED', 'preloadAppOpenAd() called but App Open Ads are managed natively', {
      note: 'Native implementation automatically preloads ads on app startup'
    });

    // No-op: Native implementation handles preloading automatically
    return Promise.resolve();
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
}

export default AdMobService.getInstance();
