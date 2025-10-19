import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/lib/LanguageContext';
import BannerAdComponent from '@/components/BannerAdComponent';
import { NativeAdCard } from '@/components';
import remoteConfig from '@/services/remoteConfig';
import admobService from '@/services/admob';

type Language = 'en' | 'hi' | 'de' | 'es' | 'fr' | 'ru' | 'id' | 'ja' | 'zh' | 'ko' | 'vi' | 'pt' | 'ar' | 'tr' | 'pl' | 'it' | 'fil' | 'uk' | 'th' | 'af' | 'bn';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'français', flag: '🇫🇷' },
  { code: 'ru', name: 'Russian', nativeName: 'русский', flag: '🇷🇺' },
  { code: 'id', name: 'Indonesian', nativeName: 'Indonesia', flag: '🇮🇩' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'português', flag: '🇵🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'polski', flag: '🇵🇱' },
  { code: 'it', name: 'Italian', nativeName: 'italiano', flag: '🇮🇹' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'українська', flag: '🇺🇦' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
];

export default function LanguageSelectionScreen() {
  const { colors } = useTheme();
  const { currentLanguage, setLanguage, isFirstLaunch } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
  const [adConfig, setAdConfig] = useState({
    showAd: 1,
    bannerId: '',
    nativeId: '',
    showFirstDoneInterstitial: false,
    firstDoneInterstitialId: ''
  });

  // Load Remote Config for language screen ads
  useEffect(() => {
    const config = remoteConfig.getLanguageScreenAdConfig();
    setAdConfig(config);
    console.log('[LanguageSelection] Ad Config:', config);
  }, []);

  console.log('[LanguageSelection] Screen rendering', { isFirstLaunch, currentLanguage, colors, adConfig });

  const handleLanguageSelect = (languageCode: Language) => {
    setSelectedLanguage(languageCode);
  };

  const handleDone = async () => {
    console.log('🌍 Language selection completed:', { selectedLanguage, isFirstLaunch });

    // Save the selected language
    await setLanguage(selectedLanguage);

    // Show interstitial ad on first launch if enabled
    if (isFirstLaunch && adConfig.showFirstDoneInterstitial && adConfig.firstDoneInterstitialId) {
      console.log('📺 Attempting to show interstitial ad:', adConfig.firstDoneInterstitialId);
      try {
        const shown = await admobService.showInterstitial(adConfig.firstDoneInterstitialId, { timeoutMs: 2500 });
        console.log('📺 Interstitial ad result:', shown);
      } catch (error) {
        console.log('📺 Interstitial ad error:', error);
      }
    }

    // Navigate based on launch type
    if (isFirstLaunch) {
      console.log('🌍 → Navigating to permissions (first launch)');
      router.replace('/permissions');
    } else {
      console.log('🌍 → Going back (settings)');
      router.back();
    }
  };

  const handleBack = () => {
    if (isFirstLaunch) {
      // On first launch, don't allow going back - user must select a language
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Simple Header with Back and Done buttons */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {!isFirstLaunch && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        {isFirstLaunch && <View style={styles.backButton} />}

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Language
        </Text>

        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
          onPress={handleDone}
          activeOpacity={0.8}
        >
          <Check size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageList}>
          {languages.map((language) => {
            const isSelected = selectedLanguage === language.code;
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                activeOpacity={0.8}
              >
                <View style={styles.languageContent}>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageText}>
                      <Text style={[styles.languageName, { color: colors.text }]}>
                        {language.nativeName}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioButton,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                    }
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom ad area - 0:off, 1:banner, 2:native */}
      {adConfig.showAd !== 0 && (
        <View
          style={[
            adConfig.showAd === 2 ? styles.nativeAdContainer : styles.bannerAdContainer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          {adConfig.showAd === 1 ? (
            <BannerAdComponent
              adType="inlineAdaptiveBanner"
              height={250}
              style={styles.bannerAdWrapper}
              location="language-selection"
              unitId={adConfig.bannerId || undefined}
            />
          ) : (
            <NativeAdCard
              location="language-selection"
              unitId={adConfig.nativeId || undefined}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  doneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  languageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  bannerAdContainer: {
    borderTopWidth: 1,
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  nativeAdContainer: {
    borderTopWidth: 1,
    minHeight: 280,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  bannerAdWrapper: {
    width: '100%',
    minHeight: 250,
    alignSelf: 'stretch',
  },
});
