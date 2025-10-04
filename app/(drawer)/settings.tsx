import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Switch, Platform } from 'react-native';
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
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { exportAllData, importAllData, clearAllData, resetOnboarding } from '@/lib/storage';
import { useToast } from '@/lib/ToastContext';
import { setupPersistentNotification, removePersistentNotification } from '@/lib/persistentNotification';

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
  variant?: 'default' | 'danger';
}

function SettingsItem({ icon, label, description, onPress, variant = 'default' }: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsItem, variant === 'danger' && styles.settingsItemDanger]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        {icon}
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsItemLabel, variant === 'danger' && styles.settingsItemLabelDanger]}>
            {label}
          </Text>
          {description && <Text style={styles.settingsItemDescription}>{description}</Text>}
        </View>
      </View>
      <ChevronRight
        size={20}
        color={variant === 'danger' ? Colors.light.error : Colors.light.textTertiary}
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { refreshNotes, refreshCategories } = useNotes();
  const { showSuccess, showError } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [persistentNotificationEnabled, setPersistentNotificationEnabled] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.card}>
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Bell size={24} color={Colors.light.primary} />
                  <View style={styles.settingsItemText}>
                    <Text style={styles.settingsItemLabel}>Quick Note Actions</Text>
                    <Text style={styles.settingsItemDescription}>
                      Show persistent notification with quick actions
                    </Text>
                  </View>
                </View>
                <Switch
                  value={persistentNotificationEnabled}
                  onValueChange={handleTogglePersistentNotification}
                  trackColor={{ false: Colors.light.borderLight, true: Colors.light.primaryLight }}
                  thumbColor={persistentNotificationEnabled ? Colors.light.primary : Colors.light.textTertiary}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            <SettingsItem
              icon={<Download size={24} color={Colors.light.primary} />}
              label="Export Data"
              description="Save a backup of all your notes and categories"
              onPress={handleExportData}
            />
            <SettingsItem
              icon={<Upload size={24} color={Colors.light.accent} />}
              label="Import Data"
              description="Restore from a backup file"
              onPress={handleImportData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingsItem
              icon={<Info size={24} color={Colors.light.primary} />}
              label="About NotesAI"
              description="Version 1.0.0"
              onPress={handleAbout}
            />
            <SettingsItem
              icon={<FileText size={24} color={Colors.light.textSecondary} />}
              label="Privacy Policy"
              description="All data stored locally on your device"
              onPress={() => {
                Alert.alert(
                  'Privacy Policy',
                  'NotesAI stores all your data locally on your device. No data is sent to external servers. Your notes are private and secure.',
                  [{ text: 'OK' }]
                );
              }}
            />
            <SettingsItem
              icon={<Info size={24} color={Colors.light.accent} />}
              label="Show Tutorial Again"
              description="Reset onboarding to see welcome screens"
              onPress={handleResetOnboarding}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.card}>
            <SettingsItem
              icon={<Trash2 size={24} color={Colors.light.error} />}
              label="Clear All Data"
              description="Permanently delete all notes and settings"
              onPress={handleClearData}
              variant="danger"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ using React Native & Expo
          </Text>
          <Text style={styles.footerText}>
            🤖 Built with Claude Code
          </Text>
        </View>
      </ScrollView>
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
});
