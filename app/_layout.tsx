import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '@/lib/NotesContext';
import { ToastProvider } from '@/lib/ToastContext';
import { ErrorBoundary } from '@/components';

// 🚀 Prevent auto-hiding of splash screen - we'll control it manually
SplashScreen.preventAutoHideAsync();

// 🛡️ Safety: ensure the native splash is never shown longer than 5 seconds
setTimeout(() => {
  try {
    SplashScreen.hideAsync();
  } catch (e) {
    console.error('Error hiding splash screen:', e);
  }
}, 5000);

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ToastProvider>
          <NotesProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="note/[id]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" translucent={true} backgroundColor="transparent" />
          </NotesProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
