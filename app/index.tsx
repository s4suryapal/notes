import { Redirect, useRootNavigationState } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { isFirstLaunch, isLoading } = useLanguage();
  const { colors } = useTheme();
  const rootNavigation = useRootNavigationState();

  // Wait until router is ready and language state is loaded
  const notReady = isLoading || !rootNavigation?.key;

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

  console.log('🚀 Not first launch - redirecting to main app');
  return <Redirect href="/(drawer)" />;
}
