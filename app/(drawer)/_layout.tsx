import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import {
  Import,
  CloudUpload,
  Archive,
  Trash2,
  Heart,
  Calendar,
  Settings as SettingsIcon,
  ChevronRight,
  StickyNote,
  Crown,
  Folder,
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
      <ChevronRight size={20} color={Colors.light.textTertiary} />
    </TouchableOpacity>
  );
}

function CustomDrawerContent() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}> 
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.appIcon}>
            <StickyNote size={20} color={Colors.light.surface} />
          </View>
          <View>
            <Text style={styles.title}>Notes</Text>
            <Text style={styles.subtitle}>Create Practical Notes</Text>
          </View>
        </View>

        <View style={styles.section}>
          <DrawerItem
            icon={<Folder size={22} color={Colors.light.textSecondary} />}
            label="Folders"
            onPress={() => router.push('/folders')}
          />
          <DrawerItem
            icon={<Import size={22} color={Colors.light.textSecondary} />}
            label="Import File"
            onPress={() => router.push('/import')}
          />
          <DrawerItem
            icon={<CloudUpload size={22} color={Colors.light.textSecondary} />}
            label="Sync & Backup"
            onPress={() => router.push('/sync')}
          />
          <DrawerItem
            icon={<Archive size={22} color={Colors.light.textSecondary} />}
            label="Archive Notes"
            onPress={() => router.push('/archive')}
          />
          <DrawerItem
            icon={<Trash2 size={22} color={Colors.light.textSecondary} />}
            label="Trash Bin"
            onPress={() => router.push('/trash')}
          />
          <DrawerItem
            icon={<Heart size={22} color={Colors.light.textSecondary} />}
            label="Favorite Notes"
            onPress={() => router.push('/favorites')}
          />
          <DrawerItem
            icon={<Calendar size={22} color={Colors.light.textSecondary} />}
            label="Calendar"
            onPress={() => router.push('/calendar')}
          />
          <DrawerItem
            icon={<SettingsIcon size={22} color={Colors.light.textSecondary} />}
            label="Settings"
            onPress={() => router.push('/settings')}
          />
        </View>

        <View style={{ height: Spacing.lg }} />
        <View style={styles.section}>
          <DrawerItem
            icon={<Crown size={22} color="#FFD54F" />}
            label="Upgrade to Premium"
            onPress={() => router.push('/premium')}
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
    backgroundColor: Colors.light.surface,
  },
  scroll: {
    paddingVertical: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
  section: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
