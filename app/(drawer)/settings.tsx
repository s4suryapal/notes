import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Switch, Platform, Modal, Pressable, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import {
  ArrowLeft,
  Download,
  Upload,
  Trash2,
  Info,
  FileText,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  Monitor,
  Check,
  X,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { exportAllData, exportCurrentNotes, importAllData, clearAllData, resetOnboarding } from '@/lib/storage';
import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useToast } from '@/lib/ToastContext';
import { setupPersistentNotification, removePersistentNotification } from '@/lib/persistentNotification';
import { useTheme } from '@/hooks/useTheme';
import { useAppOpenAdScreen } from '@/hooks/useAppOpenAdControl';
import { useInterstitialAd, BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import remoteConfig from '@/services/remoteConfig';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
}

function SettingsItem({ icon, label, description, onPress, variant = 'default', colorScheme = 'light' }: SettingsItemProps & { colorScheme?: 'light' | 'dark' }) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: Colors[colorScheme].borderLight }, variant === 'danger' && styles.settingsItemDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        {icon}
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsItemLabel, { color: Colors[colorScheme].text }, variant === 'danger' && { color: Colors[colorScheme].error }]}>
            {label}
          </Text>
          {description && <Text style={[styles.settingsItemDescription, { color: Colors[colorScheme].textSecondary }]}>{description}</Text>}
        </View>
      </View>
      <ChevronRight
        size={20}
        color={variant === 'danger' ? Colors[colorScheme].error : Colors[colorScheme].textTertiary}
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { refreshNotes, refreshCategories } = useNotes();
  const { showSuccess, showError } = useToast();
  const { mode, colorScheme, setThemeMode } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [persistentNotificationEnabled, setPersistentNotificationEnabled] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Track screen for AppOpen ads
  useAppOpenAdScreen('settings');

  // Get Remote Config settings
  const adConfig = remoteConfig.getSettingsScreenAdConfig();

  // Back press interstitial
  const { isLoaded: interstitialLoaded, isClosed: interstitialClosed, load: loadInterstitial, show: showInterstitial } = useInterstitialAd(
    adConfig.showBackInterstitial && adConfig.backInterstitialId ? adConfig.backInterstitialId : TestIds.INTERSTITIAL
  );

  // Load interstitial on mount if enabled
  useEffect(() => {
    if (adConfig.showBackInterstitial) {
      loadInterstitial();
    }
  }, [adConfig.showBackInterstitial]);

  // Reload interstitial after it's closed
  useEffect(() => {
    if (interstitialClosed && adConfig.showBackInterstitial) {
      loadInterstitial();
    }
  }, [interstitialClosed, adConfig.showBackInterstitial]);

  // Handle back press with interstitial
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [interstitialLoaded, adConfig.showBackInterstitial]);

  const handleBackPress = useCallback(() => {
    if (adConfig.showBackInterstitial && interstitialLoaded) {
      showInterstitial();
      // Navigate to home (drawer) after ad closes
      setTimeout(() => router.push('/(drawer)'), 500);
    } else {
      // Navigate directly to home (drawer)
      router.push('/(drawer)');
    }
  }, [adConfig.showBackInterstitial, interstitialLoaded]);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationPermissionGranted(status === 'granted');
    // Check if notification is currently shown (simplified check)
    setPersistentNotificationEnabled(status === 'granted');
  };

  const handleTogglePersistentNotification = async (value: boolean) => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Persistent notifications are only available on Android');
      return;
    }

    if (value) {
      // Request permission and setup notification
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await setupPersistentNotification();
        setPersistentNotificationEnabled(true);
        setNotificationPermissionGranted(true);
        showSuccess('Persistent notification enabled');
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notification permission in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Note: This would ideally open app settings
                showError('Please enable notifications in Settings > Apps > NotesAI');
              },
            },
          ]
        );
        setPersistentNotificationEnabled(false);
      }
    } else {
      // Remove notification
      await removePersistentNotification();
      setPersistentNotificationEnabled(false);
      showSuccess('Persistent notification disabled');
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);

      // Share the JSON data
      await Share.share({
        message: jsonString,
        title: 'NotesAI Backup',
      });

      showSuccess('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupNotes = async () => {
    try {
      setIsExporting(true);
      const data = await exportCurrentNotes();
      const jsonString = JSON.stringify(data, null, 2);

      // Write to a file in app documents and share
      const ts = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const fileName = `notes_backup_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
      // Use cache directory for share compatibility (Android FileProvider)
      const file = Paths.cache.createFile(fileName, 'application/json');
      await file.write(jsonString);
      const uri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        try {
          await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Share Notes Backup' });
        } catch (e) {
          // Fallback: share as raw text if file share fails
          await Share.share({ title: 'Notes Backup', message: jsonString });
        }
      } else {
        await Share.share({ title: 'Notes Backup', message: jsonString });
      }

      showSuccess('Backup created');
    } catch (error) {
      console.error('Backup error:', error);
      showError('Failed to create backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Import feature requires file picker. This will restore all your notes and categories from a backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Learn More',
          onPress: () => {
            showSuccess('Import feature coming soon');
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your notes, categories, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await refreshNotes();
              await refreshCategories();
              showSuccess('All data cleared successfully');
            } catch (error) {
              console.error('Clear data error:', error);
              showError('Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the welcome tutorial again on next app launch. Useful for learning features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await resetOnboarding();
              showSuccess('Onboarding reset! Restart app to see tutorial.');
            } catch (error) {
              console.error('Reset onboarding error:', error);
              showError('Failed to reset onboarding');
            }
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About NotesAI',
      'NotesAI v1.0.0\n\nA powerful, offline-first notes application built with React Native and Expo.\n\nFeatures:\n• Offline storage\n• Rich text formatting\n• Checklists\n• Note colors\n• Categories\n• Search & Sort\n• Grid & List views',
      [{ text: 'OK' }]
    );
  };

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun size={24} color={Colors[colorScheme].primary} />;
      case 'dark':
        return <Moon size={24} color={Colors[colorScheme].primary} />;
      case 'system':
      default:
        return <Monitor size={24} color={Colors[colorScheme].primary} />;
    }
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: Colors[colorScheme].surface, borderBottomColor: Colors[colorScheme].border }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme].text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].textSecondary }]}>Appearance</Text>
          <View style={[styles.card, { backgroundColor: Colors[colorScheme].surface }]}>
            <SettingsItem
              icon={getThemeIcon()}
              label="Theme"
              description={`Currently using ${getThemeLabel()} theme`}
              onPress={() => setShowThemeModal(true)}
              colorScheme={colorScheme}
            />
          </View>
        </View>

        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme].textSecondary }]}>Notifications</Text>
            <View style={[styles.card, { backgroundColor: Colors[colorScheme].surface }]}>
              <View style={[styles.settingsItem, { borderBottomColor: Colors[colorScheme].borderLight }]}>
                <View style={styles.settingsItemLeft}>
                  <Bell size={24} color={Colors[colorScheme].primary} />
                  <View style={styles.settingsItemText}>
                    <Text style={[styles.settingsItemLabel, { color: Colors[colorScheme].text }]}>Quick Note Actions</Text>
                    <Text style={[styles.settingsItemDescription, { color: Colors[colorScheme].textSecondary }]}>
                      Show persistent notification with quick actions
                    </Text>
                  </View>
                </View>
                <Switch
                  value={persistentNotificationEnabled}
                  onValueChange={handleTogglePersistentNotification}
                  trackColor={{ false: Colors[colorScheme].borderLight, true: Colors[colorScheme].primaryLight }}
                  thumbColor={persistentNotificationEnabled ? Colors[colorScheme].primary : Colors[colorScheme].textTertiary}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].textSecondary }]}>Data Management</Text>
          <View style={[styles.card, { backgroundColor: Colors[colorScheme].surface }]}>
            <SettingsItem
              icon={<Download size={24} color={Colors[colorScheme].primary} />}
              label="Backup Notes"
              description="Create a backup file of your current notes"
              onPress={handleBackupNotes}
              colorScheme={colorScheme}
            />
            <SettingsItem
              icon={<Download size={24} color={Colors[colorScheme].primary} />}
              label="Export Data"
              description="Save a backup of all your notes and categories"
              onPress={handleExportData}
              colorScheme={colorScheme}
            />
            <SettingsItem
              icon={<Upload size={24} color={Colors[colorScheme].accent} />}
              label="Import Data"
              description="Restore from a backup file"
              onPress={handleImportData}
              colorScheme={colorScheme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].textSecondary }]}>About</Text>
          <View style={[styles.card, { backgroundColor: Colors[colorScheme].surface }]}>
            <SettingsItem
              icon={<Info size={24} color={Colors[colorScheme].primary} />}
              label="About NotesAI"
              description="Version 1.0.0"
              onPress={handleAbout}
              colorScheme={colorScheme}
            />
            <SettingsItem
              icon={<FileText size={24} color={Colors[colorScheme].textSecondary} />}
              label="Privacy Policy"
              description="All data stored locally on your device"
              onPress={() => {
                Alert.alert(
                  'Privacy Policy',
                  'NotesAI stores all your data locally on your device. No data is sent to external servers. Your notes are private and secure.',
                  [{ text: 'OK' }]
                );
              }}
              colorScheme={colorScheme}
            />
            <SettingsItem
              icon={<Info size={24} color={Colors[colorScheme].accent} />}
              label="Show Tutorial Again"
              description="Reset onboarding to see welcome screens"
              onPress={handleResetOnboarding}
              colorScheme={colorScheme}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme].textSecondary }]}>Danger Zone</Text>
          <View style={[styles.card, { backgroundColor: Colors[colorScheme].surface }]}>
            <SettingsItem
              icon={<Trash2 size={24} color={Colors[colorScheme].error} />}
              label="Clear All Data"
              description="Permanently delete all notes and settings"
              onPress={handleClearData}
              variant="danger"
              colorScheme={colorScheme}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors[colorScheme].textTertiary }]}>
            Made with ❤️ using React Native & Expo
          </Text>
          <Text style={[styles.footerText, { color: Colors[colorScheme].textTertiary }]}>
            🤖 Built with Claude Code
          </Text>
        </View>
      </ScrollView>

      {/* Banner Ad */}
      {adConfig.showBanner && adConfig.bannerId && (
        <View style={styles.bannerContainer}>
          <BannerAd
            unitId={adConfig.bannerId || TestIds.BANNER}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
          />
        </View>
      )}

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: Colors[colorScheme].overlay }]}
          onPress={() => setShowThemeModal(false)}
        >
          <Pressable
            style={[styles.themeModal, { backgroundColor: Colors[colorScheme].surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <X size={24} color={Colors[colorScheme].text} />
              </TouchableOpacity>
            </View>

            {/* Light Theme Option */}
            <TouchableOpacity
              style={[styles.themeOption, mode === 'light' && { backgroundColor: Colors[colorScheme].borderLight }]}
              onPress={() => {
                setThemeMode('light');
                setShowThemeModal(false);
                showSuccess('Theme changed to Light');
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Sun size={24} color={Colors[colorScheme].primary} />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionLabel, { color: Colors[colorScheme].text }]}>Light</Text>
                  <Text style={[styles.themeOptionDescription, { color: Colors[colorScheme].textSecondary }]}>
                    Always use light theme
                  </Text>
                </View>
              </View>
              {mode === 'light' && <Check size={20} color={Colors[colorScheme].primary} />}
            </TouchableOpacity>

            {/* Dark Theme Option */}
            <TouchableOpacity
              style={[styles.themeOption, mode === 'dark' && { backgroundColor: Colors[colorScheme].borderLight }]}
              onPress={() => {
                setThemeMode('dark');
                setShowThemeModal(false);
                showSuccess('Theme changed to Dark');
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Moon size={24} color={Colors[colorScheme].primary} />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionLabel, { color: Colors[colorScheme].text }]}>Dark</Text>
                  <Text style={[styles.themeOptionDescription, { color: Colors[colorScheme].textSecondary }]}>
                    Always use dark theme
                  </Text>
                </View>
              </View>
              {mode === 'dark' && <Check size={20} color={Colors[colorScheme].primary} />}
            </TouchableOpacity>

            {/* System Theme Option */}
            <TouchableOpacity
              style={[styles.themeOption, mode === 'system' && { backgroundColor: Colors[colorScheme].borderLight }]}
              onPress={() => {
                setThemeMode('system');
                setShowThemeModal(false);
                showSuccess('Theme changed to System');
              }}
            >
              <View style={styles.themeOptionLeft}>
                <Monitor size={24} color={Colors[colorScheme].primary} />
                <View style={styles.themeOptionText}>
                  <Text style={[styles.themeOptionLabel, { color: Colors[colorScheme].text }]}>System</Text>
                  <Text style={[styles.themeOptionDescription, { color: Colors[colorScheme].textSecondary }]}>
                    Follow system theme settings
                  </Text>
                </View>
              </View>
              {mode === 'system' && <Check size={20} color={Colors[colorScheme].primary} />}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  settingsItemDanger: {
    borderBottomWidth: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  settingsItemLabelDanger: {
    color: Colors.light.error,
  },
  settingsItemDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  bannerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  themeModal: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  themeOptionDescription: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
});
