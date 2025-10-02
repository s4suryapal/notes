import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '@/lib/NotesContext';
import { ToastProvider } from '@/lib/ToastContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ToastProvider>
        <NotesProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="note/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </NotesProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
