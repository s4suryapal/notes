import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { storage } from './mmkvStorage';

type Language = 'en' | 'hi' | 'de' | 'es' | 'fr' | 'ru' | 'id' | 'ja' | 'zh' | 'ko' | 'vi' | 'pt' | 'ar' | 'tr' | 'pl' | 'it' | 'fil' | 'uk' | 'th' | 'af' | 'bn';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  isFirstLaunch: boolean;
  isLoading: boolean;
  markFirstLaunchComplete: () => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'app_language';
const FIRST_LAUNCH_KEY = 'first_launch_complete';

// Translation function (placeholder - implement proper translations later)
// OPTIMIZATION: Only keep languages with actual translations, use English as fallback
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Permissions screen
    phone_permission: 'Phone Permission',
    phone_permission_desc: 'Required to detect incoming calls and show notes during calls',
    notification_permission: 'Notification Permission',
    notification_permission_desc: 'Get notified about your notes and reminders',
    overlay_permission: 'Overlay Permission',
    overlay_permission_desc: 'Display notes on top of other apps',
    privacy_policy: 'Privacy Policy',
    privacy_policy_text: 'By continuing, you agree to our',
    allow: 'Allow',
    notes_ai: 'NotesAI',
    // Overlay permission screen
    overlay_permission_title: 'Enable Overlay Permission',
    overlay_permission_subtitle: 'Allow NotesAI to display quick notes over other apps',
    overlay_benefits_title: 'Why Enable This?',
    overlay_benefit_1: 'Quick access to your notes from any app',
    overlay_benefit_2: 'Create notes without leaving your current app',
    overlay_benefit_3: 'Floating reminders and notifications',
    overlay_benefit_4: 'Enhanced productivity features',
    overlay_permission_instructions: 'Tap "Enable Permission" and toggle the switch for our app',
    overlay_permission_notice: 'This permission is optional but recommended for the best experience',
    overlay_enable_button: 'Enable Permission',
    skip: 'Skip for now',
  },
  hi: {
    phone_permission: 'फ़ोन अनुमति',
    phone_permission_desc: 'कॉल के दौरान नोट्स दिखाने के लिए आवश्यक',
    notification_permission: 'सूचना अनुमति',
    notification_permission_desc: 'अपने नोट्स और रिमाइंडर के बारे में सूचनाएं प्राप्त करें',
    overlay_permission: 'ओवरले अनुमति',
    overlay_permission_desc: 'अन्य ऐप्स के ऊपर नोट्स प्रदर्शित करें',
    privacy_policy: 'गोपनीयता नीति',
    privacy_policy_text: 'जारी रखकर, आप हमारी सहमत हैं',
    allow: 'अनुमति दें',
    notes_ai: 'NotesAI',
  },
  de: {
    phone_permission: 'Telefonberechtigung',
    phone_permission_desc: 'Erforderlich, um Notizen während Anrufen anzuzeigen',
    notification_permission: 'Benachrichtigungsberechtigung',
    notification_permission_desc: 'Erhalten Sie Benachrichtigungen über Ihre Notizen',
    overlay_permission: 'Overlay-Berechtigung',
    overlay_permission_desc: 'Notizen über anderen Apps anzeigen',
    privacy_policy: 'Datenschutzrichtlinie',
    privacy_policy_text: 'Indem Sie fortfahren, stimmen Sie unseren zu',
    allow: 'Erlauben',
    notes_ai: 'NotesAI',
  },
  // Removed 18 duplicate placeholder languages - will use English fallback
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (__DEV__) console.log('[LanguageContext] 🔄 Loading language preferences...');
    // Load language and first launch status - wrapped in try-catch for safety
    try {
      const savedLanguage = storage.getString(LANGUAGE_KEY);
      const firstLaunchComplete = storage.getBoolean(FIRST_LAUNCH_KEY);

      if (__DEV__) console.log('[LanguageContext] Storage values:', { savedLanguage, firstLaunchComplete });

      if (savedLanguage) {
        setCurrentLanguage(savedLanguage as Language);
      }

      setIsFirstLaunch(!firstLaunchComplete);
    } catch (error) {
      console.error('[LanguageContext] ❌ Error loading from storage:', error);
      // Use defaults: en language, first launch = true
      setCurrentLanguage('en');
      setIsFirstLaunch(true);
    } finally {
      // ALWAYS set loading to false, even on error
      if (__DEV__) console.log('[LanguageContext] ✅ Setting isLoading to FALSE');
      setIsLoading(false);
    }
  }, []);

  const setLanguage = useCallback(async (language: Language) => {
    setCurrentLanguage(language);
    storage.set(LANGUAGE_KEY, language);
  }, []);

  const markFirstLaunchComplete = useCallback(async () => {
    storage.set(FIRST_LAUNCH_KEY, true);
    setIsFirstLaunch(false);
  }, []);

  const t = useCallback((key: string): string => {
    // OPTIMIZATION: Fallback to English if language translation not available
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  }, [currentLanguage]);

  const value: LanguageContextType = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      isFirstLaunch,
      isLoading,
      markFirstLaunchComplete,
      t,
    }),
    [currentLanguage, setLanguage, isFirstLaunch, isLoading, markFirstLaunchComplete, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
