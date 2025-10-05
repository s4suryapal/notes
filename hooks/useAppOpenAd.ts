import { useCallback } from 'react';
import AdMobService from '@/services/admob';

interface ShowAdOptions {
  reason: string;
  skipConditions?: string[];
}

export function useAppOpenAd() {

  const showAd = useCallback(async ({ reason, skipConditions = [] }: ShowAdOptions): Promise<boolean> => {
    console.log(`🔍 [AD_ATTEMPT] Trying to show AppOpen ad after ${reason}`);

    // Log skip conditions for debugging
    if (skipConditions.length > 0) {
      console.log(`🔍 [AD_SKIP_CONDITIONS] ${reason}:`, skipConditions);
    }

    try {
      const adShown = await AdMobService.showAppOpenAd();

      if (adShown) {
        console.log(`🔍 [AD_SUCCESS] ✅ AppOpen ad shown after ${reason}`);
      } else {
        console.log(`🔍 [AD_NOT_READY] ⚠️ AppOpen ad not ready after ${reason}`);
      }

      return adShown;

    } catch (error: any) {
      const errorCode = error.code || 'unknown';
      const isNoFill = errorCode === 'googleMobileAds/no-fill' || error.message?.includes('no-fill');

      if (isNoFill) {
        console.log(`🔍 [AD_NO_FILL] ℹ️ No AppOpen ad available after ${reason} (normal in dev/test)`);
      } else {
        console.log(`🔍 [AD_ERROR] ❌ AppOpen ad failed after ${reason}:`, {
          message: error.message,
          code: errorCode
        });
      }
      return false;
    }
  }, []);

  const preloadAd = useCallback(async (reason: string): Promise<void> => {
    console.log(`🔍 [AD_PRELOAD] Preloading AppOpen ad for ${reason}...`);

    try {
      await AdMobService.preloadAppOpenAd();
      console.log(`🔍 [AD_PRELOAD_SUCCESS] ✅ AppOpen ad preloaded for ${reason}`);
    } catch (error: any) {
      console.log(`🔍 [AD_PRELOAD_ERROR] ❌ Failed to preload AppOpen ad for ${reason}:`, {
        message: error.message,
        code: error.code || 'unknown'
      });
    }
  }, []);

  const isAdReady = useCallback((): boolean => {
    return AdMobService.isAppOpenAdReady();
  }, []);

  return {
    showAd,
    preloadAd,
    isAdReady
  };
}
