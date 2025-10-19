import { Redirect, useRootNavigationState } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import { View, ActivityIndicator, Platform, NativeModules } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, startTransition } from 'react';
import { storage } from '@/lib/mmkvStorage';

const { OverlaySettingsModule } = NativeModules;

// OPTIMIZATION: Cache overlay permission to avoid native bridge calls
const OVERLAY_PERMISSION_CACHE_KEY = 'overlay_permission_granted';
const OVERLAY_CACHE_TIMESTAMP_KEY = 'overlay_last_checked';
const OVERLAY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function Index() {
  const { isFirstLaunch, isLoading } = useLanguage();
  const { colors } = useTheme();
  const rootNavigation = useRootNavigationState();
  const [hasOverlayPermission, setHasOverlayPermission] = useState<boolean | null>(null);

  // Check overlay permission on mount
  // OPTIMIZATION: Use startTransition to defer non-urgent check + cache result
  useEffect(() => {
    const checkOverlayPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          // Check cache first
          const cachedPermission = storage.getBoolean(OVERLAY_PERMISSION_CACHE_KEY);
          const lastChecked = storage.getNumber(OVERLAY_CACHE_TIMESTAMP_KEY);
          const now = Date.now();

          // Use cache if available and fresh (< 24 hours old)
          if (cachedPermission !== undefined && lastChecked && (now - lastChecked) < OVERLAY_CACHE_DURATION) {
            if (__DEV__) console.log('📱 [INDEX] Using cached overlay permission:', cachedPermission);
            setHasOverlayPermission(cachedPermission);
            return;
          }

          // Cache miss or stale - check native module
          if (OverlaySettingsModule && OverlaySettingsModule.hasOverlayPermission) {
            const hasPermission = await OverlaySettingsModule.hasOverlayPermission();
            if (__DEV__) console.log('📱 [INDEX] Overlay permission status (native check):', hasPermission);

            // Update cache
            storage.set(OVERLAY_PERMISSION_CACHE_KEY, hasPermission);
            storage.set(OVERLAY_CACHE_TIMESTAMP_KEY, now);

            setHasOverlayPermission(hasPermission);
          } else {
            // Module not available, skip overlay check
            setHasOverlayPermission(true);
          }
        } catch (error) {
          if (__DEV__) console.log('📱 [INDEX] Error checking overlay permission:', error);
          // On error, skip overlay check
          setHasOverlayPermission(true);
        }
      } else {
        // iOS doesn't need overlay permission
        setHasOverlayPermission(true);
      }
    };

    // Only check overlay permission after first launch is complete
    if (!isLoading && !isFirstLaunch) {
      // Use startTransition to mark this as non-urgent update
      // This allows React to prioritize showing the app first
      startTransition(() => {
        checkOverlayPermission();
      });
    } else if (!isLoading && isFirstLaunch) {
      // First launch - will go through onboarding, skip overlay check
      setHasOverlayPermission(true);
    }
  }, [isFirstLaunch, isLoading]);

  // Wait until router is ready and language state is loaded
  const notReady = isLoading || !rootNavigation?.key || hasOverlayPermission === null;

  if (notReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Declarative redirect once ready
  if (isFirstLaunch) {
    if (__DEV__) console.log('🚀 First launch detected - redirecting to language selection');
    return <Redirect href="/language-selection" />;
  }

  // Check overlay permission for returning users
  if (!hasOverlayPermission) {
    if (__DEV__) console.log('🚀 Overlay permission not granted - redirecting to overlay permission screen');
    return <Redirect href="/overlay-permission" />;
  }

  if (__DEV__) console.log('🚀 Not first launch - redirecting to main app');
  return <Redirect href="/(drawer)" />;
}
