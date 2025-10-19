import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  NativeModules,
  AppState,
  BackHandler,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/lib/LanguageContext';
import BannerAdComponent from '@/components/BannerAdComponent';
import { storage } from '@/lib/mmkvStorage';

const { OverlaySettingsModule } = NativeModules;

// OPTIMIZATION: Cache keys (must match app/index.tsx)
const OVERLAY_PERMISSION_CACHE_KEY = 'overlay_permission_granted';
const OVERLAY_CACHE_TIMESTAMP_KEY = 'overlay_last_checked';

export default function OverlayPermissionScreen() {
  const { colors } = useTheme();
  const { t, markFirstLaunchComplete } = useLanguage();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);
  const insets = useSafeAreaInsets();

  // Listen for app state changes to detect return from settings
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      // If user returns from settings (with or without granting permission), go to home
      if (hasOpenedSettings && nextAppState === 'active') {
        if (__DEV__) console.log('📱 [OVERLAY_PERMISSION] User returned from settings - going to home');
        setHasOpenedSettings(false);

        // Check if overlay was granted (for logging)
        let hasOverlay = false;
        try {
          if (OverlaySettingsModule && OverlaySettingsModule.hasOverlayPermission) {
            hasOverlay = await OverlaySettingsModule.hasOverlayPermission();
          }
        } catch {}
        if (__DEV__) console.log('📱 [OVERLAY_PERMISSION] Overlay permission after settings:', hasOverlay);

        // OPTIMIZATION: Update cache with new permission status
        storage.set(OVERLAY_PERMISSION_CACHE_KEY, hasOverlay);
        storage.set(OVERLAY_CACHE_TIMESTAMP_KEY, Date.now());

        // Mark first launch complete and navigate to home
        await markFirstLaunchComplete();
        setIsRequesting(false);
        // Navigate directly to home (drawer) to avoid index.tsx routing
        router.replace('/(drawer)');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [hasOpenedSettings, markFirstLaunchComplete]);

  // Hardware back button handler - go to home
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', async () => {
        if (__DEV__) console.log('📱 [OVERLAY_PERMISSION] Back button pressed - going to home');
        // Mark first launch complete before navigating
        await markFirstLaunchComplete();
        // Navigate directly to home (drawer) to avoid index.tsx routing
        router.replace('/(drawer)');
        return true; // Prevent default back behavior
      });

      return () => backHandler.remove();
    }, [markFirstLaunchComplete])
  );

  const handleEnablePermission = async () => {
    setIsRequesting(true);

    try {
      if (Platform.OS === 'android') {
        // Check if already granted
        let hasOverlay = false;
        try {
          if (OverlaySettingsModule && OverlaySettingsModule.hasOverlayPermission) {
            hasOverlay = await OverlaySettingsModule.hasOverlayPermission();
          }
        } catch {}
        if (__DEV__) console.log('📱 [OVERLAY_PERMISSION] Overlay permission current state:', hasOverlay);

        if (hasOverlay) {
          // Already granted - go to home
          setIsRequesting(false);
          if (__DEV__) console.log('🎉 [OVERLAY_PERMISSION] Overlay already granted - going to home');
          await markFirstLaunchComplete();
          // Navigate directly to home (drawer) to avoid index.tsx routing
          router.replace('/(drawer)');
          return;
        }

        if (__DEV__) console.log('📱 [OVERLAY_PERMISSION] Opening overlay permission settings...');

        // Set flag to track that we're opening settings
        setHasOpenedSettings(true);

        // Open overlay permission settings
        const packageName = 'com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes'; // From app.json

        try {
          // Use native module
          if (__DEV__) console.log('Opening overlay settings using native module for package:', packageName);

          if (OverlaySettingsModule) {
            await OverlaySettingsModule.openOverlaySettings();
            if (__DEV__) console.log('Successfully opened overlay settings with app highlighting');
          } else {
            throw new Error('OverlaySettingsModule not available');
          }
        } catch (nativeError) {
          if (__DEV__) console.log('Native module failed:', nativeError);
          // Reset flag if we couldn't open settings
          setHasOpenedSettings(false);
        }

        setIsRequesting(false);

        // Navigation to home happens on return from settings (AppState listener)
        return;
      } else {
        // iOS doesn't need overlay permission - go to home
        if (__DEV__) console.log('iOS - no overlay permission needed');
        setIsRequesting(false);
        await markFirstLaunchComplete();
        // Navigate directly to home (drawer) to avoid index.tsx routing
        router.replace('/(drawer)');
      }
    } catch (error) {
      if (__DEV__) console.log('Overlay permission error:', error);
      // Continue to main app even if error
      setIsRequesting(false);
      await markFirstLaunchComplete();
      // Navigate directly to home (drawer) to avoid index.tsx routing
      router.replace('/(drawer)');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable Content Container */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {t('overlay_permission_title') || 'Enable Overlay Permission'}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('overlay_permission_subtitle') || `Allow ${t('notes_ai')} to display quick notes over other apps`}
        </Text>

        {/* Benefits Section */}
        <View style={[styles.benefitsContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            {t('overlay_benefits_title') || 'Why Enable This?'}
          </Text>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📝</Text>
            <Text style={[styles.benefitText, { color: colors.text }]}>
              {t('overlay_benefit_1') || 'Quick access to your notes from any app'}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={[styles.benefitText, { color: colors.text }]}>
              {t('overlay_benefit_2') || 'Create notes without leaving your current app'}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔔</Text>
            <Text style={[styles.benefitText, { color: colors.text }]}>
              {t('overlay_benefit_3') || 'Floating reminders and notifications'}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>✅</Text>
            <Text style={[styles.benefitText, { color: colors.text }]}>
              {t('overlay_benefit_4') || 'Enhanced productivity features'}
            </Text>
          </View>
        </View>

        {/* Illustration Container */}
        <View style={styles.illustrationContainer}>
          {/* Mock phone illustration */}
          <View style={[styles.phoneFrame, { backgroundColor: colors.border }]}>
            {/* Notch */}
            <View style={[styles.notch, { backgroundColor: colors.background }]} />

            {/* Phone content - Settings screen mockup */}
            <View style={[styles.phoneContent, { backgroundColor: '#F5F5F5' }]}>
              {/* Settings header */}
              <View style={styles.settingsHeader}>
                <Text style={styles.backArrow}>←</Text>
                <Text style={styles.headerTitle}>Appear on top</Text>
              </View>

              {/* Settings description */}
              <View style={styles.settingsDescription}>
                <Text style={styles.descriptionText}>
                  This permission allows an app to show things on top of other apps you&apos;re using.
                </Text>
              </View>

              {/* App list */}
              <View style={styles.appList}>
                {/* Other app - blurred */}
                <View style={[styles.appItem, styles.dimmedApp]}>
                  <View style={[styles.appIconSmall, { backgroundColor: '#E0E0E0' }]}>
                    <View style={styles.blurredIcon} />
                  </View>
                  <View style={styles.appInfo}>
                    <View style={[styles.blurredTextLine, { width: 80 }]} />
                    <View style={[styles.blurredTextLine, { width: 50, height: 8 }]} />
                  </View>
                  <View style={styles.toggleOff} />
                </View>

                {/* #NotesAI - HIGHLIGHTED */}
                <View style={[styles.appItem, styles.highlightedApp, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                  <View style={styles.appIconSmall}>
                    <Image
                      source={require('@/assets/images/icon.png')}
                      style={styles.appIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={[styles.appName, { color: colors.primary, fontWeight: '700' }]}>#{t('notes_ai')}</Text>
                    <Text style={[styles.appSize, { color: colors.primary }]}>2.5 MB</Text>
                  </View>
                  <View style={[styles.toggle, { backgroundColor: colors.primary }]}>
                    <View style={[styles.toggleThumb, { backgroundColor: '#FFFFFF' }]} />
                  </View>
                </View>

                {/* Other app - blurred */}
                <View style={[styles.appItem, styles.dimmedApp]}>
                  <View style={[styles.appIconSmall, { backgroundColor: '#E0E0E0' }]}>
                    <View style={styles.blurredIcon} />
                  </View>
                  <View style={styles.appInfo}>
                    <View style={[styles.blurredTextLine, { width: 100 }]} />
                    <View style={[styles.blurredTextLine, { width: 45, height: 8 }]} />
                  </View>
                  <View style={styles.toggleOff} />
                </View>

                {/* Other app - blurred */}
                <View style={[styles.appItem, styles.dimmedApp]}>
                  <View style={[styles.appIconSmall, { backgroundColor: '#E0E0E0' }]}>
                    <View style={styles.blurredIcon} />
                  </View>
                  <View style={styles.appInfo}>
                    <View style={[styles.blurredTextLine, { width: 90 }]} />
                    <View style={[styles.blurredTextLine, { width: 55, height: 8 }]} />
                  </View>
                  <View style={styles.toggleOff} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions Text */}
        <Text style={[styles.instructions, { color: colors.text, fontWeight: '600' }]}>
          {t('overlay_permission_instructions') || `Tap "Enable Permission" and toggle the switch for #${t('notes_ai')}`}
        </Text>

        {/* Important Notice */}
        <View style={[styles.noticeContainer, { backgroundColor: '#FFF3CD', borderColor: '#FFB020' }]}>
          <Text style={styles.noticeIcon}>ℹ️</Text>
          <Text style={[styles.noticeText, { color: '#856404' }]}>
            {t('overlay_permission_notice') || 'This permission is optional but recommended for the best experience'}
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Footer: Contains Button and Banner Ad */}
      <View
        style={[
          styles.fixedFooter,
          { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 8) }
        ]}
      >
        {/* Enable Button - Prominent */}
        <Pressable
          style={[styles.enableButton, { backgroundColor: colors.primary }]}
          onPress={handleEnablePermission}
          disabled={isRequesting}
        >
          <Text style={styles.enableButtonText}>
            {isRequesting ? 'Processing...' : (t('overlay_enable_button') || 'Enable Permission')}
          </Text>
        </Pressable>

        {/* Banner Ad - Full width */}
        <View
          style={[
            styles.footerAdContainer,
            { borderTopColor: colors.border }
          ]}
        >
          <BannerAdComponent
            adType="adaptiveBanner"
            location="permissions"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 160, // Space for footer: button (50) + ad (60) + padding (50)
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  benefitsContainer: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  phoneFrame: {
    width: 280,
    height: 500,
    borderRadius: 30,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  notch: {
    width: 120,
    height: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 4,
  },
  phoneContent: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backArrow: {
    fontSize: 20,
    color: '#333',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingsDescription: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  descriptionText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 15,
  },
  appList: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dimmedApp: {
    opacity: 0.4,
  },
  highlightedApp: {
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    borderBottomWidth: 2,
  },
  appIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  appIconImage: {
    width: '100%',
    height: '100%',
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  appSize: {
    fontSize: 11,
    color: '#999',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 2,
    alignItems: 'flex-end',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleOff: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D0D0D0',
  },
  blurredIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: '#C0C0C0',
    borderRadius: 4,
  },
  blurredTextLine: {
    height: 10,
    backgroundColor: '#D0D0D0',
    borderRadius: 4,
    marginBottom: 4,
  },
  instructions: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  enableButton: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 12,
  },
  enableButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerAdContainer: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    paddingVertical: 2,
    marginHorizontal: -16, // Extend to full width (negate parent padding)
  },
});
