import { Redirect, useRootNavigationState } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import { View, ActivityIndicator, Platform, NativeModules } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';

const { OverlaySettingsModule } = NativeModules;

export default function Index() {
  const { isFirstLaunch, isLoading } = useLanguage();
  const { colors } = useTheme();
  const rootNavigation = useRootNavigationState();
  const [hasOverlayPermission, setHasOverlayPermission] = useState<boolean | null>(null);

  // Check overlay permission on mount
  useEffect(() => {
    const checkOverlayPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          if (OverlaySettingsModule && OverlaySettingsModule.hasOverlayPermission) {
            const hasPermission = await OverlaySettingsModule.hasOverlayPermission();
            if (__DEV__) console.log('📱 [INDEX] Overlay permission status:', hasPermission);
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
      checkOverlayPermission();
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
    console.log('🚀 First launch detected - redirecting to language selection');
    return <Redirect href="/language-selection" />;
  }

  // Check overlay permission for returning users
  if (!hasOverlayPermission) {
    console.log('🚀 Overlay permission not granted - redirecting to overlay permission screen');
    return <Redirect href="/overlay-permission" />;
  }

  console.log('🚀 Not first launch - redirecting to main app');
  return <Redirect href="/(drawer)" />;
}
