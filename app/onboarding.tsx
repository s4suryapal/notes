import { router } from 'expo-router';
import { useLanguage } from '@/lib/LanguageContext';
import { useFeatureTour } from '@/lib/FeatureTourContext';
import Onboarding from '@/components/Onboarding';

export default function OnboardingScreen() {
  const { markFirstLaunchComplete } = useLanguage();
  const { setOnboardingCompleted } = useFeatureTour();

  const handleComplete = async () => {
    // Mark first launch as complete
    await markFirstLaunchComplete();

    // Mark onboarding as completed to trigger feature tours
    await setOnboardingCompleted();

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
