import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Star, Archive, Share, Info, Eye, Clock } from 'lucide-react-native';
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
  onColorChange?: (color: string | null) => void;
}

export function NoteActionsSheet({
  visible,
  note,
  onClose,
  onFavorite,
  onArchive,
  onDelete,
  onShare,
}: NoteActionsSheetProps) {
  if (!note) return null;

  const handleAction = (action: () => void, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action();
    onClose();
  };

  const handleNoteDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const createdDate = new Date(note.created_at).toLocaleString();
    const updatedDate = new Date(note.updated_at).toLocaleString();
    Alert.alert(
      'Note Details',
      `Created: ${createdDate}\nLast modified: ${updatedDate}\n\nCharacters: ${(note.title + note.body).length}`,
      [{ text: 'OK', onPress: () => {} }]
    );
    onClose();
  };

  const handleReadingMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Reading Mode', 'Reading mode feature coming soon!', [{ text: 'OK' }]);
    onClose();
  };

  const handleReminders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Reminders', 'Set reminder feature coming soon!', [{ text: 'OK' }]);
    onClose();
  };

  const menuOptions = [
    {
      icon: Share,
      label: 'Share',
      onPress: () => {
        if (onShare) {
          handleAction(onShare, 'Share');
        } else {
          Alert.alert('Share', 'Share feature coming soon!', [{ text: 'OK' }]);
          onClose();
        }
      },
    },
    {
      icon: Info,
      label: 'Note Details',
      onPress: handleNoteDetails,
    },
    {
      icon: Eye,
      label: 'Reading Mode',
      onPress: handleReadingMode,
    },
    {
      icon: Star,
      label: 'Favorite',
      onPress: () => handleAction(onFavorite, 'Favorite'),
    },
    {
      icon: Archive,
      label: 'Archive',
      onPress: () => handleAction(onArchive, 'Archive'),
    },
    {
      icon: Clock,
      label: 'Reminders',
      onPress: handleReminders,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuOption}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <option.icon size={20} color={Colors.light.text} />
              <Text style={styles.menuOptionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: Spacing.base,
  },
  menu: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xs,
    minWidth: 200,
    ...Shadows.xl,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.base,
  },
  menuOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
