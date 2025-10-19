import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Phone, Bell, FileText } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/lib/LanguageContext';
import { setupPersistentNotification } from '@/lib/persistentNotification';
import BannerAdComponent from '@/components/BannerAdComponent';

export default function PermissionsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleAllow = async () => {
    setIsRequesting(true);

    try {
      if (__DEV__) console.log('Starting permission flow...');

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
      if (__DEV__) console.log('Phone permission granted:', phonePermissionGranted);

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
        if (__DEV__) console.log('Notification permission granted:', notificationsGranted);

        // Setup persistent notification if permission was granted
        if (notificationsGranted) {
          try {
            await setupPersistentNotification();
            if (__DEV__) console.log('Persistent notification setup completed');
          } catch (notifError) {
            if (__DEV__) console.log('Failed to setup persistent notification:', notifError);
          }
        }
      }

      // Step 3: Navigate to overlay permission screen
      // Overlay permission is now optional and handled in a separate screen
      if (__DEV__) console.log('✅ [PERMISSIONS] Phone + Notifications done - navigating to overlay screen');
      setIsRequesting(false);
      router.replace('/overlay-permission');

    } catch (error) {
      if (__DEV__) console.log('Permission request error:', error);

      // Continue to overlay screen anyway if there's an error
      setIsRequesting(false);
      router.replace('/overlay-permission');
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
