import { useEffect } from 'react';
import { router } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { isFirstLaunch } = useLanguage();
  const { colors } = useTheme();

  useEffect(() => {
    // Navigate based on first launch status
    if (isFirstLaunch) {
      console.log('🚀 First launch detected - navigating to language selection');
      router.replace('/language-selection');
    } else {
      console.log('🚀 Not first launch - navigating to main app');
      router.replace('/(drawer)');
    }
  }, [isFirstLaunch]);

  // Show loading indicator while deciding where to navigate
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
