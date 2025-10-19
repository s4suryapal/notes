import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  NativeModules,
  AppState,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Phone, Layers, Bell, FileText } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/lib/LanguageContext';
import { setupPersistentNotification } from '@/lib/persistentNotification';
import BannerAdComponent from '@/components/BannerAdComponent';

const { OverlaySettingsModule } = NativeModules;

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);

  // Listen for app state changes to detect return from settings
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      // If user returns from settings, verify overlay and finish onboarding
      if (hasOpenedSettings && nextAppState === 'active') {
        console.log('📱 [PERMISSIONS] User returned from settings - verifying overlay permission');
        setHasOpenedSettings(false); // Reset flag

        // Re-check overlay permission
        let hasOverlay = false;
        try {
          if (OverlaySettingsModule && OverlaySettingsModule.hasOverlayPermission) {
            hasOverlay = await OverlaySettingsModule.hasOverlayPermission();
          }
        } catch {}
        console.log('📱 [PERMISSIONS] Overlay permission after settings:', hasOverlay);

        // Also ensure phone permission is granted
        let hasPhone = false;
        try {
          hasPhone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
          if (!hasPhone) {
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
            hasPhone = result === PermissionsAndroid.RESULTS.GRANTED;
          }
        } catch {}
        console.log('📱 [PERMISSIONS] Phone permission after settings:', hasPhone);

        if (hasOverlay && hasPhone) {
          console.log('🎉 [PERMISSIONS] Overlay + Phone granted after settings - navigating to onboarding');

          // Setup persistent notification now that permissions are granted
          try {
            await setupPersistentNotification();
            console.log('Persistent notification setup completed after settings return');
          } catch (notifError) {
            console.log('Failed to setup persistent notification after settings:', notifError);
          }

          setIsRequesting(false);
          router.replace('/onboarding');
        } else {
          console.log('⚠️ [PERMISSIONS] Still missing required permission(s):', { hasOverlay, hasPhone });
          setIsRequesting(false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [hasOpenedSettings]);

  const handleAllow = async () => {
    setIsRequesting(true);

    try {
      console.log('Starting permission flow...');

      // Step 1: Request phone state permission directly
      let phonePermissionGranted = false;
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
        );
        phonePermissionGranted = result === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        phonePermissionGranted = false;
      }
      console.log('Phone permission granted:', phonePermissionGranted);

      // Step 2: Request notification permission (Android 13+)
      let notificationsGranted = true;
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          notificationsGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        } catch {
          notificationsGranted = false;
        }
        console.log('Notification permission granted:', notificationsGranted);

        // Setup persistent notification if permission was granted
        if (notificationsGranted) {
          try {
            await setupPersistentNotification();
            console.log('Persistent notification setup completed');
          } catch (notifError) {
            console.log('Failed to setup persistent notification:', notifError);
          }
        }
      }

      // Step 3: Handle overlay permission - check first, then open settings if needed
      if (Platform.OS === 'android') {
        try {
          let hasOverlay = false;
          try {
            if (OverlaySettingsModule && OverlaySettingsModule.hasOverlayPermission) {
              hasOverlay = await OverlaySettingsModule.hasOverlayPermission();
            }
          } catch {
            hasOverlay = false;
          }
          console.log('📱 [PERMISSIONS] Overlay permission current state:', hasOverlay);

          if (hasOverlay) {
            // Ensure phone permission is also granted before finishing onboarding
            let hasPhone = phonePermissionGranted;
            try {
              if (!hasPhone) {
                hasPhone = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
              }
            } catch {}
            if (hasPhone) {
              console.log('🎉 [PERMISSIONS] Overlay + Phone granted - navigating to onboarding');

              // Setup persistent notification now that permissions are granted
              try {
                await setupPersistentNotification();
                console.log('Persistent notification setup completed');
              } catch (notifError) {
                console.log('Failed to setup persistent notification:', notifError);
              }

              setIsRequesting(false);
              router.replace('/onboarding');
              return;
            }
          }

          console.log('📱 [PERMISSIONS] Opening overlay permission settings...');

          // Set flag to track that we're opening settings
          setHasOpenedSettings(true);

          // Open direct overlay permission settings
          try {
            // Use native module with exact same code as working reference app
            console.log('Opening overlay settings using native module');

            if (OverlaySettingsModule) {
              await OverlaySettingsModule.openOverlaySettings();
              console.log('Successfully opened overlay settings with app highlighting');
            } else {
              throw new Error('OverlaySettingsModule not available');
            }
          } catch (nativeError) {
            console.log('Native module failed, trying Linking methods:', nativeError);
            try {
              // Fallback: Try sendIntent method
              await (Linking as any).sendIntent('android.settings.action.MANAGE_OVERLAY_PERMISSION');
              console.log('Opened general overlay permission settings via sendIntent');
            } catch (sendError) {
              console.log('sendIntent failed, using final fallback:', sendError);
              try {
                // Final fallback to general app settings
                await Linking.openSettings();
              } catch (settingsError) {
                console.log('Could not open any settings screen:', settingsError);
                // Reset flag if we couldn't open settings
                setHasOpenedSettings(false);
              }
            }
          }

          // We cannot know the result immediately; wait for AppState 'active' to verify
          setIsRequesting(false);
          // Do not finish onboarding yet; handled on return from settings
          return;
        } catch (overlayError) {
          console.log('Overlay permission error:', overlayError);
          // Continue to onboarding even if overlay permission fails
          setIsRequesting(false);

          console.log('📱 [PERMISSIONS] Permissions flow complete (overlay failed) - navigating to onboarding');

          router.replace('/onboarding');
        }
      } else {
        // iOS doesn't need overlay permission
        console.log('iOS - no overlay permission needed');

        // Setup persistent notification (iOS doesn't use it but this is for safety)
        try {
          await setupPersistentNotification();
          console.log('Notification setup completed (iOS)');
        } catch (notifError) {
          console.log('Failed to setup notification (iOS):', notifError);
        }

        setIsRequesting(false);

        console.log('📱 [PERMISSIONS] Permissions flow complete (iOS) - navigating to onboarding');

        router.replace('/onboarding');
      }

    } catch (error) {
      console.log('Permission request error:', error);

      // Continue to onboarding anyway if there's an error
      setIsRequesting(false);

      console.log('📱 [PERMISSIONS] Permissions flow complete (with error) - navigating to onboarding');

      router.replace('/onboarding');
    }
  };

  const handlePrivacyPolicy = () => {
    // Open privacy policy in browser
    Linking.openURL('https://yourapp.com/privacy-policy');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerContent}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <FileText size={28} color="white" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('notes_ai')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Permission Cards */}
        <View style={styles.permissionsContainer}>
          {/* Phone Status Permission */}
          <View style={[styles.permissionCard, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.permissionHeader}>
              <View style={[styles.permissionIcon, { backgroundColor: colors.primary }]}>
                <Phone size={20} color="white" />
              </View>
              <Text style={[styles.permissionTitle, { color: colors.text }]}>
                {t('phone_permission')}
              </Text>
            </View>
            <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>
              {t('phone_permission_desc')}
            </Text>
          </View>

          {/* Notification Permission */}
          <View style={[styles.permissionCard, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.permissionHeader}>
              <View style={[styles.permissionIcon, { backgroundColor: colors.accent }]}>
                <Bell size={20} color="white" />
              </View>
              <Text style={[styles.permissionTitle, { color: colors.text }]}>
                {t('notification_permission')}
              </Text>
            </View>
            <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>
              {t('notification_permission_desc')}
            </Text>
          </View>

          {/* Overlay Permission */}
          <View style={[styles.permissionCard, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.permissionHeader}>
              <View style={[styles.permissionIcon, { backgroundColor: colors.secondary }]}>
                <Layers size={20} color="white" />
              </View>
              <Text style={[styles.permissionTitle, { color: colors.text }]}>
                {t('overlay_permission')}
              </Text>
            </View>
            <Text style={[styles.permissionDescription, { color: colors.textSecondary }]}>
              {t('overlay_permission_desc')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Footer: Contains Privacy, Button, and Banner Ad */}
      <View
        style={[
          styles.fixedFooter,
          { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 8) }
        ]}
      >
        {/* Privacy Policy */}
        <View style={styles.privacySection}>
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            {t('privacy_policy_text')}{' '}
          </Text>
          <Pressable onPress={handlePrivacyPolicy}>
            <Text style={[styles.privacyLink, { color: colors.primary }]}>
              {t('privacy_policy')}
            </Text>
          </Pressable>
        </View>

        {/* Allow Button */}
        <Pressable
          style={[styles.allowButton, { backgroundColor: colors.primary }]}
          onPress={handleAllow}
          disabled={isRequesting}
        >
          <Text style={styles.allowButtonText}>
            {isRequesting ? 'Processing...' : t('allow')}
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 220, // Space for footer: privacy (30) + button (50) + ad (60) + padding (80)
  },
  permissionsContainer: {
    gap: 12,
  },
  permissionCard: {
    borderRadius: 12,
    padding: 14,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  permissionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  privacySection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 11,
    textAlign: 'center',
  },
  privacyLink: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  allowButton: {
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 12,
  },
  allowButtonText: {
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
