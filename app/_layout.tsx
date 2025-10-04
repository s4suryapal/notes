import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '@/lib/NotesContext';
import { ToastProvider } from '@/lib/ToastContext';
import { ErrorBoundary, Onboarding } from '@/components';
import { setupPersistentNotification, handleNotificationResponse } from '@/lib/persistentNotification';
import { isOnboardingCompleted, completeOnboarding } from '@/lib/storage';
import NativeSplashScreen from '@/components/NativeSplashScreen';

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Setup persistent notification on app start (asks for permission if needed)
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

  // Check onboarding status after splash
  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await isOnboardingCompleted();
      if (!completed && !showSplash) {
        // Show onboarding after splash screen finishes
        setTimeout(() => {
          setShowOnboarding(true);
        }, 300);
      }
    };

    if (!showSplash) {
      checkOnboarding();
    }
  }, [showSplash]);

  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    setShowOnboarding(false);
  };

  if (showSplash) {
    return <NativeSplashScreen onAnimationFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <NotesProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(drawer)" />
              <Stack.Screen name="note/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" translucent={true} backgroundColor="transparent" />

            {/* Onboarding Modal */}
            <Onboarding
              visible={showOnboarding}
              onComplete={handleOnboardingComplete}
            />
          </NotesProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
