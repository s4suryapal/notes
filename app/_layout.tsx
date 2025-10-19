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
import { FeatureTourProvider } from '@/lib/FeatureTourContext';
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
  const isLoadingRef = useRef(isLoading);

  // Keep ref in sync with isLoading state
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // ⚡ SPLASH & INITIALIZATION FLOW
  // This controls when the native splash screen is dismissed
  //
  // Launch Flow:
  // FIRST LAUNCH:
  // 1. Initialize AdMob SDK (required for ads)
  // 2. Initialize Remote Config (get ad configurations)
  // 3. Wait for LanguageContext to load (determines first-launch state)
  // 4. Hide splash → Show language screen (ads ready to display)
  // 5. Defer Firebase (Crashlytics, Analytics) to BACKGROUND
  //
  // SUBSEQUENT LAUNCHES:
  // 1. Initialize AdMob SDK
  // 2. Wait for LanguageContext
  // 3. Hide splash → Show app
  // 4. Defer Firebase + Remote Config to BACKGROUND
  //
  // Safety: 5s maximum splash time (see useEffect below)
  useEffect(() => {
    if (isInitialized) return;

    let cancelled = false;
    (async () => {
      try {
        console.log('[SPLASH] 🚀 Starting app initialization...');
        const startTime = Date.now();

        // Step 1: Initialize CRITICAL services (AdMob SDK)
        await admobService.initialize();
        console.log('[ADMOB] ✅ AdMob SDK initialized');

        // Step 2: Wait for language context to load (determines isFirstLaunch)
        // Use ref to avoid closure issues with stale state
        await new Promise<void>((resolve) => {
          if (!isLoadingRef.current) {
            resolve();
            return;
          }

          let checkInterval: ReturnType<typeof setInterval> | null = null;
          let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

          checkInterval = setInterval(() => {
            if (!isLoadingRef.current) {
              if (checkInterval) clearInterval(checkInterval);
              if (timeoutTimer) clearTimeout(timeoutTimer);
              console.log('[CONTEXT] ✅ Language context loaded', { isFirstLaunch, isLoading: isLoadingRef.current });
              resolve();
            }
          }, 16); // Check every frame (~60fps) for responsive UI

          // Safety timeout after 1 second
          timeoutTimer = setTimeout(() => {
            if (checkInterval) clearInterval(checkInterval);
            console.warn('[CONTEXT] ⚠️  Language context load timeout - proceeding anyway');
            console.log('[CONTEXT] State at timeout:', { isFirstLaunch, isLoading: isLoadingRef.current });
            resolve();
          }, 1000);
        });

        // Step 3: FOR FIRST LAUNCH - Initialize Remote Config BEFORE hiding splash
        // This ensures ad configuration is ready when language screen displays
        if (isFirstLaunch) {
          console.log('[SPLASH] 📺 First launch detected - initializing Remote Config for ads...');
          try {
            const rcInitialized = await remoteConfig.initialize();
            if (rcInitialized) {
              console.log('[REMOTE_CONFIG] ✅ Remote Config initialized (first launch)');
              const langConfig = remoteConfig.getLanguageScreenAdConfig();
              console.log('[REMOTE_CONFIG] 📺 Language screen ad config loaded:', langConfig);
            } else {
              console.log('[REMOTE_CONFIG] ⚠️  Using default ad configuration');
            }
          } catch (rcError) {
            console.log('[REMOTE_CONFIG] ⚠️  Remote Config init failed, using defaults:', rcError);
          }
        }

        // Step 4: Wait for navigation to be ready and first screen to render
        // This ensures the UI is actually visible before hiding splash
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!cancelled) {
          const totalTime = Date.now() - startTime;
          console.log(`[SPLASH] ✅ Initialization complete (${totalTime}ms) - hiding splash`);

          if (!hasHiddenRef.current) {
            await SplashScreen.hideAsync();
            hasHiddenRef.current = true;
            console.log('[SPLASH] 👋 Native splash hidden - app visible');
          }
          setIsInitialized(true);

          // Step 5: Initialize non-critical services in BACKGROUND
          // This doesn't block the user from seeing the app
          // Includes: Firebase (Crashlytics, Analytics)
          // For non-first-launch: Also includes Remote Config + AppOpen ads
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

                // For non-first-launch: Initialize Remote Config in background
                if (!isFirstLaunch) {
                  console.log('[REMOTE_CONFIG] 🔄 Fetching AppOpen ad configuration (background)...');
                  const initialized = await remoteConfig.initialize();

                  if (initialized) {
                    console.log('[REMOTE_CONFIG] ✅ Remote Config initialized (background)');
                  } else {
                    console.log('[REMOTE_CONFIG] ⚠️  Using default configuration');
                  }
                }

                // Configure AppOpen ads from Remote Config
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
  }, [isInitialized, isFirstLaunch]);

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
      // Don't hide splash here - it's handled by AppNavigation
      // This prevents hiding splash before navigation is ready
      console.log('[ROOT_LAYOUT] onLayout called - splash control delegated to AppNavigation');
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
              <FeatureTourProvider>
                <NotesProvider>
                  <AppNavigation />
                  <StatusBar style="auto" translucent={true} backgroundColor="transparent" />
                </NotesProvider>
              </FeatureTourProvider>
            </ToastProvider>
          </ThemeProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
