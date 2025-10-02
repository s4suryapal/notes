import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Star, Archive, Trash2, Copy, Share, Palette, X } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Note } from '@/types';

interface NoteActionsSheetProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
  onChangeColor?: () => void;
}

export function NoteActionsSheet({
  visible,
  note,
  onClose,
  onFavorite,
  onArchive,
  onDelete,
  onDuplicate,
  onShare,
  onChangeColor,
}: NoteActionsSheetProps) {
  if (!note) return null;

  const handleActionPress = (action: { label: string; onPress?: () => void }) => {
    // Different haptic feedback for different actions
    if (action.label === 'Delete') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (action.label.includes('Favorite')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (action.label.includes('Archive')) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    action.onPress?.();
    onClose();
  };

  const actions = [
    {
      icon: Star,
      label: note.is_favorite ? 'Unfavorite' : 'Favorite',
      onPress: onFavorite,
      color: Colors.light.secondary,
      show: true,
    },
    {
      icon: Archive,
      label: note.is_archived ? 'Unarchive' : 'Archive',
      onPress: onArchive,
      color: Colors.light.textSecondary,
      show: true,
    },
    {
      icon: Trash2,
      label: 'Delete',
      onPress: onDelete,
      color: Colors.light.error,
      show: true,
    },
    {
      icon: Copy,
      label: 'Duplicate',
      onPress: onDuplicate,
      color: Colors.light.primary,
      show: !!onDuplicate,
    },
    {
      icon: Share,
      label: 'Share',
      onPress: onShare,
      color: Colors.light.accent,
      show: !!onShare,
    },
    {
      icon: Palette,
      label: 'Change color',
      onPress: onChangeColor,
      color: Colors.light.primary,
      show: !!onChangeColor,
    },
  ].filter((action) => action.show);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.notePreview}>
            <Text style={styles.noteTitle} numberOfLines={1}>
              {note.title || 'Untitled'}
            </Text>
            {note.body && (
              <Text style={styles.noteBody} numberOfLines={2}>
                {note.body}
              </Text>
            )}
          </View>

          <View style={styles.actions}>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionItem}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: action.color + '15' }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingBottom: Spacing.xxxl,
    ...Shadows.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    position: 'relative',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: BorderRadius.round,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.base,
    top: Spacing.md,
    padding: Spacing.xs,
  },
  notePreview: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    marginBottom: Spacing.base,
  },
  noteTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  noteBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  actions: {
    paddingHorizontal: Spacing.base,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
    flex: 1,
  },
});
