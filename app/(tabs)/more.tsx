import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  FileText,
  Folder,
  Star,
  Bell,
  Tag,
  Archive,
  Trash2,
  Settings,
  Crown,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  onPress: () => void;
  variant?: 'default' | 'premium';
}

function MenuItem({ icon, label, count, onPress, variant = 'default' }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, variant === 'premium' && styles.menuItemPremium]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        {icon}
        <Text style={[styles.menuItemLabel, variant === 'premium' && styles.menuItemLabelPremium]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {count !== undefined && <Text style={styles.menuItemCount}>{count}</Text>}
        <ChevronRight size={20} color={variant === 'premium' ? '#FFD54F' : Colors.light.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { notes, categories } = useNotes();

  const counts = useMemo(() => ({
    all: notes.filter((n) => !n.is_deleted && !n.is_archived).length,
    favorites: notes.filter((n) => n.is_favorite && !n.is_deleted && !n.is_archived).length,
    archived: notes.filter((n) => n.is_archived && !n.is_deleted).length,
    trash: notes.filter((n) => n.is_deleted).length,
  }), [notes]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organize</Text>
          <View style={styles.card}>
            <MenuItem
              icon={<FileText size={24} color={Colors.light.primary} />}
              label="All Notes"
              count={counts.all}
              onPress={() => {}}
            />
            <MenuItem
              icon={<Folder size={24} color={Colors.light.accent} />}
              label="Folders"
              count={categories.length}
              onPress={() => {}}
            />
            <MenuItem
              icon={<Star size={24} color={Colors.light.secondary} />}
              label="Favorites"
              count={counts.favorites}
              onPress={() => {}}
            />
            <MenuItem
              icon={<Bell size={24} color={Colors.light.warning} />}
              label="Reminders"
              count={0}
              onPress={() => {}}
            />
            <MenuItem
              icon={<Tag size={24} color={Colors.light.primary} />}
              label="Tags"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.card}>
            <MenuItem
              icon={<Archive size={24} color={Colors.light.textSecondary} />}
              label="Archive"
              count={counts.archived}
              onPress={() => {}}
            />
            <MenuItem
              icon={<Trash2 size={24} color={Colors.light.error} />}
              label="Trash"
              count={counts.trash}
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem
              icon={<Crown size={24} color="#FFD54F" />}
              label="Upgrade to Premium"
              onPress={() => {}}
              variant="premium"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem
              icon={<Settings size={24} color={Colors.light.textSecondary} />}
              label="Settings"
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>NotesAI v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  menuItemPremium: {
    backgroundColor: 'rgba(255, 213, 79, 0.1)',
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  menuItemLabelPremium: {
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.semibold,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  menuItemCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textTertiary,
    minWidth: 24,
    textAlign: 'right',
  },
  footer: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textTertiary,
  },
});
