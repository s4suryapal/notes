import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeatureTourContextType {
  hasCompletedOnboarding: boolean;
  hasCompletedHomeTour: boolean;
  hasCompletedEditorTour: boolean;
  setOnboardingCompleted: () => Promise<void>;
  setHomeTourCompleted: () => Promise<void>;
  setEditorTourCompleted: () => Promise<void>;
  resetAllTours: () => Promise<void>;
  shouldShowHomeTour: () => boolean;
  shouldShowEditorTour: () => boolean;
}

const FeatureTourContext = createContext<FeatureTourContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@notesai_onboarding_completed',
  HOME_TOUR_COMPLETED: '@notesai_home_tour_completed',
  EDITOR_TOUR_COMPLETED: '@notesai_editor_tour_completed',
};

export function FeatureTourProvider({ children }: { children: React.ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedHomeTour, setHasCompletedHomeTour] = useState(false);
  const [hasCompletedEditorTour, setHasCompletedEditorTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load tour completion status on mount
  useEffect(() => {
    const loadTourStatus = async () => {
      try {
        const [onboarding, homeTour, editorTour] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
          AsyncStorage.getItem(STORAGE_KEYS.HOME_TOUR_COMPLETED),
          AsyncStorage.getItem(STORAGE_KEYS.EDITOR_TOUR_COMPLETED),
        ]);

        setHasCompletedOnboarding(onboarding === 'true');
        setHasCompletedHomeTour(homeTour === 'true');
        setHasCompletedEditorTour(editorTour === 'true');
      } catch (error) {
        console.error('Error loading tour status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTourStatus();
  }, []);

  const setOnboardingCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  }, []);

  const setHomeTourCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HOME_TOUR_COMPLETED, 'true');
      setHasCompletedHomeTour(true);
    } catch (error) {
      console.error('Error saving home tour status:', error);
    }
  }, []);

  const setEditorTourCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EDITOR_TOUR_COMPLETED, 'true');
      setHasCompletedEditorTour(true);
    } catch (error) {
      console.error('Error saving editor tour status:', error);
    }
  }, []);

  const resetAllTours = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        AsyncStorage.removeItem(STORAGE_KEYS.HOME_TOUR_COMPLETED),
        AsyncStorage.removeItem(STORAGE_KEYS.EDITOR_TOUR_COMPLETED),
      ]);
      setHasCompletedOnboarding(false);
      setHasCompletedHomeTour(false);
      setHasCompletedEditorTour(false);
    } catch (error) {
      console.error('Error resetting tours:', error);
    }
  }, []);

  const shouldShowHomeTour = useCallback(() => {
    return hasCompletedOnboarding && !hasCompletedHomeTour;
  }, [hasCompletedOnboarding, hasCompletedHomeTour]);

  const shouldShowEditorTour = useCallback(() => {
    return hasCompletedOnboarding && hasCompletedHomeTour && !hasCompletedEditorTour;
  }, [hasCompletedOnboarding, hasCompletedHomeTour, hasCompletedEditorTour]);

  const value: FeatureTourContextType = useMemo(
    () => ({
      hasCompletedOnboarding,
      hasCompletedHomeTour,
      hasCompletedEditorTour,
      setOnboardingCompleted,
      setHomeTourCompleted,
      setEditorTourCompleted,
      resetAllTours,
      shouldShowHomeTour,
      shouldShowEditorTour,
    }),
    [
      hasCompletedOnboarding,
      hasCompletedHomeTour,
      hasCompletedEditorTour,
      setOnboardingCompleted,
      setHomeTourCompleted,
      setEditorTourCompleted,
      resetAllTours,
      shouldShowHomeTour,
      shouldShowEditorTour,
    ]
  );

  // Render children immediately - don't block app rendering
  // isLoading state is tracked and consumers can check it if needed
  return (
    <FeatureTourContext.Provider value={value}>
      {children}
    </FeatureTourContext.Provider>
  );
}

export function useFeatureTour() {
  const context = useContext(FeatureTourContext);
  if (context === undefined) {
    throw new Error('useFeatureTour must be used within a FeatureTourProvider');
  }
  return context;
}
