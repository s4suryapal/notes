import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/lib/ThemeContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import { NotesProvider } from '@/lib/NotesContext';
import { ToastProvider } from '@/lib/ToastContext';
import { ErrorBoundary } from '@/components';
import { setupPersistentNotification, handleNotificationResponse } from '@/lib/persistentNotification';
import { useLanguage } from '@/lib/LanguageContext';
import { useAppOpenAd } from '@/hooks/useAppOpenAd';
import analytics from '@/services/analytics';
import crashlytics from '@/services/crashlytics';
import { initGlobalErrorHandler } from '@/services/globalErrorHandler';
import admobService from '@/services/admob';

// Keep the splash screen visible while we fetch resources
void SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isFirstLaunch, isLoading } = useLanguage();
  const { showAd, preloadAd, isAdReady } = useAppOpenAd();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const hasHiddenRef = useRef(false);

  // Initialize Firebase and AdMob, then show App Open Ad
  useEffect(() => {
    if (isInitialized) return;

    let cancelled = false;
    (async () => {
      try {
        // Initialize Firebase services
        await crashlytics.initialize();
        console.log('[FIREBASE] Crashlytics initialized');

        initGlobalErrorHandler();
        console.log('[FIREBASE] Global error handler initialized');

        await analytics.initialize();
        await analytics.logAppOpen();
        console.log('[FIREBASE] Analytics initialized');

        // Initialize AdMob
        await admobService.initialize();
        console.log('[ADMOB] AdMob initialized');

        // Wait for language context to load
        let waitCount = 0;
        while (isLoading && waitCount < 20) {
          await new Promise(r => setTimeout(r, 50));
          waitCount++;
        }

        // Load and show App Open Ad if not first launch
        if (!isFirstLaunch && !isLoading) {
          console.log('🔍 Attempting to load AppOpen ad...');
          try {
            // Preload ad if not ready
            if (!isAdReady()) {
              await preloadAd('app-launch');
            }

            const start = Date.now();
            // Wait up to 5s for ad to load
            while (!cancelled && !isAdReady() && Date.now() - start < 5000) {
              await new Promise(r => setTimeout(r, 150));
            }

            // Show ad if ready
            if (!cancelled && isAdReady()) {
              console.log('🔍 Ad ready - showing now');
              await showAd({ reason: 'app-launch', skipConditions: [] });
            } else {
              console.log('🔍 Ad timeout or not ready - skipping');
            }
          } catch (e) {
            console.log('🔍 Ad flow error:', (e as any)?.toString?.());
          }
        } else {
          console.log('🔍 First launch or context loading - skipping ad');
        }

        // Hide native splash and proceed
        if (!cancelled) {
          console.log('🔍 Hiding native splash');
          if (!hasHiddenRef.current) {
            await SplashScreen.hideAsync();
            hasHiddenRef.current = true;
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.log('[INIT] Initialization error:', error);
        // Ensure splash hides even on error
        try {
          if (!hasHiddenRef.current) {
            await SplashScreen.hideAsync();
            hasHiddenRef.current = true;
          }
          setIsInitialized(true);
        } catch {}
      }
    })();

    return () => { cancelled = true; };
  }, [isInitialized]);

  // Safety: hide native splash after 10s max
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isInitialized) {
        console.log('⏳ Safety timeout - hiding native splash after 10s');
        try {
          if (!hasHiddenRef.current) {
            await SplashScreen.hideAsync();
            hasHiddenRef.current = true;
          }
        } catch {}
        setIsInitialized(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Optionally preload next ad after initialization when not first launch
  useEffect(() => {
    if (!isLoading && isInitialized && !isFirstLaunch) {
      setTimeout(() => {
        preloadAd('next-app-launch');
      }, 1000);
    }
  }, [isLoading, isInitialized, isFirstLaunch, preloadAd]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="language-selection" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="note/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const pathname = usePathname();
  const hasHiddenRef = useRef(false);
  const onLayoutRootView = useCallback(async () => {
    try {
      if (!hasHiddenRef.current) {
        await SplashScreen.hideAsync();
        hasHiddenRef.current = true;
      }
    } catch {}
  }, []);

  // Log screen views on route changes
  useEffect(() => {
    try {
      if (pathname != null) {
        const screenName = String(pathname).replace(/^\//, '') || 'home';
        analytics.logScreenView(screenName);
      }
    } catch (error) {
      console.log('[ANALYTICS] Screen view logging failed:', error);
    }
  }, [pathname]);

  useEffect(() => {
    // Setup persistent notification if permissions are already granted (won't request permission)
    // For first-time users, this is set up in the permissions screen
    const initNotifications = async () => {
      await setupPersistentNotification();
    };

    initNotifications();

    // Listen for notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const result = handleNotificationResponse(response);

      if (result) {
        switch (result.action) {
          case 'create_note':
          case 'create_text_note':
            router.push('/note/new');
            break;
          case 'create_photo_note':
            // Open note editor and trigger photo picker
            router.push('/note/new?mode=photo');
            break;
          case 'create_audio_note':
            // Open note editor and trigger audio recorder
            router.push('/note/new?mode=audio');
            break;
        }
      }
    });

    // Listen for native Android notification actions
    let nativeSubscription: any;
    if (Platform.OS === 'android') {
      nativeSubscription = DeviceEventEmitter.addListener('onNotificationAction', (actionType: string) => {
        console.log('Native notification action:', actionType);
        switch (actionType) {
          case 'text':
            router.push('/note/new');
            break;
          case 'checklist':
            router.push('/note/new?mode=checklist');
            break;
          case 'drawing':
            router.push('/note/new?mode=drawing');
            break;
          case 'photo':
            router.push('/note/new?mode=photo');
            break;
          case 'audio':
            router.push('/note/new?mode=audio');
            break;
        }
      });
    }

    return () => {
      subscription.remove();
      if (nativeSubscription) {
        nativeSubscription.remove();
      }
    };
  }, []);
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <LanguageProvider>
          <ThemeProvider>
            <ToastProvider>
              <NotesProvider>
                <AppNavigation />
                <StatusBar style="auto" translucent={true} backgroundColor="transparent" />
              </NotesProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
