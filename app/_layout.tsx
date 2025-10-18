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
import analytics from '@/services/analytics';
import crashlytics from '@/services/crashlytics';
import { initGlobalErrorHandler } from '@/services/globalErrorHandler';
import admobService from '@/services/admob';
import remoteConfig from '@/services/remoteConfig';
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

// Keep the splash screen visible while we fetch resources
void SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isFirstLaunch, isLoading } = useLanguage();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasHiddenRef = useRef(false);
  const appOpenAd = useAppOpenAdControl();

  // ⚡ SPLASH & INITIALIZATION FLOW
  // This controls when the native splash screen is dismissed
  //
  // Launch Flow (First & Subsequent):
  // 1. Initialize critical services (AdMob SDK for banner ads)
  // 2. Wait for LanguageContext to load (determines first-launch state)
  // 3. Hide splash → Show app
  //    (Banner ads load with shimmer, no blocking wait needed)
  // 4. Defer Firebase + Remote Config + AppOpen ads to BACKGROUND
  //
  // Note: AppOpen ads are handled separately by native AppOpenAdManager
  // They only show when returning from background, NOT on app launch
  // Remote Config is fetched in background since it's not needed immediately
  //
  // Safety: 5s maximum splash time (see useEffect below)
  useEffect(() => {
    if (isInitialized) return;

    let cancelled = false;
    (async () => {
      try {
        console.log('[SPLASH] 🚀 Starting app initialization...');
        const startTime = Date.now();

        // Step 1: Initialize CRITICAL services only (AdMob for banner ads)
        await admobService.initialize();
        console.log('[ADMOB] ✅ AdMob SDK initialized');

        // Step 2: Wait for language context to load (determines isFirstLaunch)
        // Use promise-based approach instead of polling for better performance
        await new Promise<void>((resolve) => {
          if (!isLoading) {
            resolve();
            return;
          }

          let checkInterval: NodeJS.Timeout | null = null;
          let timeoutTimer: NodeJS.Timeout | null = null;

          checkInterval = setInterval(() => {
            if (!isLoading) {
              if (checkInterval) clearInterval(checkInterval);
              if (timeoutTimer) clearTimeout(timeoutTimer);
              resolve();
            }
          }, 16); // Check every frame (~60fps) for responsive UI

          // Safety timeout after 1 second
          timeoutTimer = setTimeout(() => {
            if (checkInterval) clearInterval(checkInterval);
            console.warn('[CONTEXT] ⚠️  Language context load timeout');
            resolve();
          }, 1000);
        });
        console.log('[CONTEXT] ✅ Language context loaded', { isFirstLaunch, isLoading });

        // Step 3: Hide native splash and proceed to app immediately
        // Note: Remote Config + AppOpen ads deferred to background (not needed immediately)
        if (!cancelled) {
          const totalTime = Date.now() - startTime;
          console.log(`[SPLASH] ✅ Initialization complete (${totalTime}ms) - hiding splash`);

          if (!hasHiddenRef.current) {
            await SplashScreen.hideAsync();
            hasHiddenRef.current = true;
            console.log('[SPLASH] 👋 Native splash hidden - app visible');
          }
          setIsInitialized(true);

          // Step 4: Initialize non-critical services in BACKGROUND
          // This doesn't block the user from seeing the app
          // Includes: Firebase (Crashlytics, Analytics) + Remote Config + AppOpen ads
          setTimeout(() => {
            (async () => {
              try {
                console.log('[BACKGROUND] 🔄 Background init starting...');

                // Initialize Firebase services in PARALLEL for faster startup
                const [crashlyticsResult, analyticsResult] = await Promise.allSettled([
                  crashlytics.initialize(),
                  analytics.initialize(),
                ]);

                console.log('[FIREBASE] ✅ Crashlytics initialized (background):', crashlyticsResult.status);
                console.log('[FIREBASE] ✅ Analytics initialized (background):', analyticsResult.status);

                // Error handler can be initialized immediately (sync operation)
                initGlobalErrorHandler();
                console.log('[FIREBASE] ✅ Error handler initialized (background)');

                // Log app open after analytics is ready
                if (analyticsResult.status === 'fulfilled') {
                  await analytics.logAppOpen();
                }

                // Initialize Remote Config and configure AppOpen ads
                console.log('[REMOTE_CONFIG] 🔄 Fetching AppOpen ad configuration...');
                const initialized = await remoteConfig.initialize();

                if (initialized) {
                  console.log('[REMOTE_CONFIG] ✅ Remote Config initialized (background)');

                  const appOpenConfig = remoteConfig.getAppOpenAdConfig();
                  console.log('[APPOPEN] 📺 Configuring AppOpen ads from Remote Config:', appOpenConfig);

                  // Set global enabled/disabled state
                  await appOpenAd.setEnabled(appOpenConfig.enabled);

                  // Configure which screens should show AppOpen ads
                  if (appOpenConfig.enabledScreens.length > 0) {
                    appOpenAd.setEnabledScreens(appOpenConfig.enabledScreens);
                    console.log('[APPOPEN] ✅ Enabled screens:', appOpenConfig.enabledScreens);
                  } else {
                    appOpenAd.setEnabledScreens([]);
                    console.log('[APPOPEN] ✅ Enabled on ALL screens');
                  }

                  // Set ad unit ID (check screen-specific settings)
                  if (appOpenConfig.settingsScreen.enabled && appOpenConfig.settingsScreen.adUnitId) {
                    appOpenAd.setAdUnitId(appOpenConfig.settingsScreen.adUnitId);
                    console.log('[APPOPEN] ✅ Using settings screen ad unit ID');
                  } else {
                    appOpenAd.setAdUnitId(null);
                    console.log('[APPOPEN] ✅ Using default ad unit ID');
                  }

                  console.log('[APPOPEN] ✅ AppOpen ads configured from Remote Config (background)');
                } else {
                  console.log('[REMOTE_CONFIG] ⚠️  Using default AppOpen ad configuration');
                  // AppOpen ads will use default settings from native
                }

                console.log('[BACKGROUND] ✅ All background services initialized');
              } catch (error) {
                console.log('[BACKGROUND] ⚠️  Background init failed:', error);
              }
            })();
          }, 100);
        }
      } catch (error) {
        console.log('[SPLASH] ❌ Initialization error:', error);
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

  // Safety: hide native splash after 5s max
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!isInitialized) {
        console.log('⏳ SAFETY TIMEOUT - forcing splash hide after 5s');
        try {
          if (!hasHiddenRef.current) {
            await SplashScreen.hideAsync();
            hasHiddenRef.current = true;
          }
        } catch {}
        setIsInitialized(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Note: AppOpen ad preloading removed - handled by native AppOpenAdManager
  // Ads only show when returning from background, not on app launch

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
    let mounted = true;

    // Setup persistent notification if permissions are already granted (won't request permission)
    // For first-time users, this is set up in the permissions screen
    const initNotifications = async () => {
      try {
        await setupPersistentNotification();
      } catch (error) {
        console.error('[NOTIFICATIONS] Setup failed:', error);
      }
    };

    if (mounted) {
      initNotifications();
    }

    // Listen for notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!mounted) return;

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
    let createNoteSubscription: any;
    let openNoteSubscription: any;
    if (Platform.OS === 'android') {
      nativeSubscription = DeviceEventEmitter.addListener('onNotificationAction', (actionType: string) => {
        if (!mounted) return;

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

      // Listen for create note action from CallEndActivity
      createNoteSubscription = DeviceEventEmitter.addListener('onCreateNote', (noteType: string) => {
        if (!mounted) return;

        console.log('Create note from CallEnd:', noteType);
        switch (noteType) {
          case 'text':
            router.push('/note/new');
            break;
          case 'checklist':
            router.push('/note/new?mode=checklist');
            break;
          case 'audio':
            router.push('/note/new?mode=audio');
            break;
          case 'photo':
            router.push('/note/new?mode=photo');
            break;
          case 'scan':
            router.push('/note/new?mode=scan');
            break;
          case 'ocr':
            router.push('/note/new?mode=ocr');
            break;
          case 'drawing':
            router.push('/note/new?mode=drawing');
            break;
          default:
            router.push('/note/new');
        }
      });

      // Listen for open note action from CallEndActivity
      openNoteSubscription = DeviceEventEmitter.addListener('onOpenNote', (noteId: string) => {
        if (!mounted) return;

        console.log('Open note from CallEnd:', noteId);
        if (noteId) {
          router.push(`/note/${noteId}`);
        }
      });
    }

    return () => {
      mounted = false;
      subscription.remove();
      if (nativeSubscription) {
        nativeSubscription.remove();
      }
      if (createNoteSubscription) {
        createNoteSubscription.remove();
      }
      if (openNoteSubscription) {
        openNoteSubscription.remove();
      }
    };
  }, [router]); // Include router in dependencies to prevent stale closure
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
