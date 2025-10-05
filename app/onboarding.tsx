import { router } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import Onboarding from '@/components/Onboarding';

export default function OnboardingScreen() {
  const { markFirstLaunchComplete } = useLanguage();

  const handleComplete = async () => {
    // Mark first launch as complete
    await markFirstLaunchComplete();

    // Navigate to main app
    router.replace('/(drawer)');
  };

  return (
    <Onboarding
      visible={true}
      onComplete={handleComplete}
    />
  );
}
