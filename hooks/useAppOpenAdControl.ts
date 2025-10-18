import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

const { AppOpenAdModule } = NativeModules;

interface AppOpenAdControl {
  /**
   * Set the current screen name
   * Call this when navigating to a new screen
   */
  setCurrentScreen: (screenName: string) => void;

  /**
   * Configure which screens should show AppOpen ads
   * @param screens Array of screen names (e.g., ['settings', 'premium'])
   *                Empty array = show on all screens (default)
   */
  setEnabledScreens: (screens: string[]) => void;

  /**
   * Enable or disable AppOpen ads globally
   */
  setEnabled: (enabled: boolean) => Promise<boolean>;

  /**
   * Set the ad unit ID from Remote Config
   * @param adUnitId Ad unit ID (null to use default)
   */
  setAdUnitId: (adUnitId: string | null) => void;

  /**
   * Get current configuration (for debugging)
   */
  getConfiguration: () => Promise<{
    currentScreen: string;
    enabledScreens: string[];
    isEnabled: boolean;
    adUnitId: string;
  }>;
}

/**
 * Hook to control screen-specific AppOpen ads
 *
 * @example
 * // Show AppOpen ads only on settings screen
 * const appOpenAd = useAppOpenAdControl();
 *
 * useEffect(() => {
 *   appOpenAd.setEnabledScreens(['settings']);
 * }, []);
 *
 * // Update current screen on navigation
 * useEffect(() => {
 *   appOpenAd.setCurrentScreen('settings');
 * }, []);
 */
export function useAppOpenAdControl(): AppOpenAdControl {
  // Only available on Android
  if (Platform.OS !== 'android' || !AppOpenAdModule) {
    return {
      setCurrentScreen: () => {},
      setEnabledScreens: () => {},
      setEnabled: async () => false,
      setAdUnitId: () => {},
      getConfiguration: async () => ({
        currentScreen: '',
        enabledScreens: [],
        isEnabled: false,
        adUnitId: 'default',
      }),
    };
  }

  return {
    setCurrentScreen: (screenName: string) => {
      AppOpenAdModule.setCurrentScreen(screenName);
    },

    setEnabledScreens: (screens: string[]) => {
      AppOpenAdModule.setEnabledScreens(screens);
    },

    setEnabled: async (enabled: boolean) => {
      return AppOpenAdModule.setAppOpenAdsEnabled(enabled);
    },

    setAdUnitId: (adUnitId: string | null) => {
      AppOpenAdModule.setAdUnitId(adUnitId);
    },

    getConfiguration: async () => {
      return AppOpenAdModule.getConfiguration();
    },
  };
}

/**
 * Hook to automatically track current screen for AppOpen ads
 *
 * @param screenName The name of the current screen
 *
 * @example
 * // In your Settings screen component
 * function SettingsScreen() {
 *   useAppOpenAdScreen('settings');
 *
 *   return <View>...</View>;
 * }
 */
export function useAppOpenAdScreen(screenName: string) {
  const { setCurrentScreen } = useAppOpenAdControl();

  useEffect(() => {
    setCurrentScreen(screenName);
    console.log(`[AppOpenAd] Current screen: ${screenName}`);
  }, [screenName, setCurrentScreen]);
}
