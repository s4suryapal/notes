import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {
  CloudUpload,
  Archive,
  Trash2,
  Heart,
  Calendar,
  Settings as SettingsIcon,
  StickyNote,
  Crown,
  Bell,
  Hash,
  Layout,
  HelpCircle,
  Users,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { router } from 'expo-router';

function DrawerItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemLeft}>
        {icon}
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PremiumBanner({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.premiumBanner} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.premiumIconContainer}>
        <Crown size={24} color="#FFF" />
      </View>
      <View style={styles.premiumTextContainer}>
        <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
        <Text style={styles.premiumSubtitle}>Unlock all features</Text>
      </View>
    </TouchableOpacity>
  );
}

function CustomDrawerContent() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View style={styles.header}>
          <View style={styles.appLogoContainer}>
            <View style={styles.appIcon}>
              <StickyNote size={20} color="#FFF" />
            </View>
            <View>
              <Text style={styles.appName}>NotesAI</Text>
              <Text style={styles.appSubtitle}>Notes that matter</Text>
            </View>
          </View>
        </View>

        {/* Premium Banner */}
        <PremiumBanner onPress={() => router.push('/premium')} />

        {/* Main Menu */}
        <View style={styles.menuSection}>
          <DrawerItem
            icon={<Calendar size={20} color={Colors.light.primary} />}
            label="Calendar"
            onPress={() => router.push('/calendar')}
          />
          <DrawerItem
            icon={<Heart size={20} color="#FF6B6B" />}
            label="Favorites"
            onPress={() => router.push('/favorites')}
          />
          <DrawerItem
            icon={<Archive size={20} color="#00C49A" />}
            label="Archive"
            onPress={() => router.push('/archive')}
          />
          <DrawerItem
            icon={<Trash2 size={20} color={Colors.light.textSecondary} />}
            label="Trash"
            onPress={() => router.push('/trash')}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Secondary Menu */}
        <View style={styles.menuSection}>
          <DrawerItem
            icon={<CloudUpload size={20} color={Colors.light.textSecondary} />}
            label="Sync & Backup"
            onPress={() => router.push('/sync')}
          />
          <DrawerItem
            icon={<SettingsIcon size={20} color={Colors.light.textSecondary} />}
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: Colors.light.surface,
          width: 300,
        },
        overlayColor: 'rgba(0,0,0,0.4)',
        swipeEdgeWidth: 40,
      }}
      drawerContent={() => <CustomDrawerContent />}
    >
      {/* Main Notes screen */}
      <Drawer.Screen name="index" options={{ drawerLabel: 'Notes' }} />

      {/* Drawer destinations */}
      <Drawer.Screen name="import" options={{ drawerLabel: 'Import' }} />
      <Drawer.Screen name="folders" options={{ drawerLabel: 'Folders' }} />
      <Drawer.Screen name="archive" options={{ drawerLabel: 'Archive' }} />
      <Drawer.Screen name="trash" options={{ drawerLabel: 'Trash' }} />
      <Drawer.Screen name="favorites" options={{ drawerLabel: 'Favorites' }} />
      <Drawer.Screen name="calendar" options={{ drawerLabel: 'Calendar' }} />
      <Drawer.Screen name="sync" options={{ drawerLabel: 'Sync & Backup' }} />
      <Drawer.Screen name="settings" options={{ drawerLabel: 'Settings' }} />
      <Drawer.Screen name="premium" options={{ drawerLabel: 'Upgrade to Premium' }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    paddingVertical: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  appLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  appSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD54F',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  premiumSubtitle: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.7)',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: Colors.light.surface,
  },
  divider: {
    height: 8,
    backgroundColor: '#F8F9FA',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    backgroundColor: Colors.light.surface,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    fontWeight: '400',
  },
});
