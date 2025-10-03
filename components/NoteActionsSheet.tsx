import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert, Share as RNShare, ScrollView } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Star, Archive, Share, Info, Eye, Clock, X } from 'lucide-react-native';
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

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .trim();
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
  const [showReadingMode, setShowReadingMode] = useState(false);
  const [showReminders, setShowReminders] = useState(false);

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
    const plainText = stripHtml(note.body);
    Alert.alert(
      'Note Details',
      `Created: ${createdDate}\nLast modified: ${updatedDate}\n\nCharacters: ${(note.title + plainText).length}`,
      [{ text: 'OK', onPress: () => {} }]
    );
    onClose();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const plainText = stripHtml(note.body);
      const message = note.title
        ? `${note.title}\n\n${plainText}`
        : plainText;

      await RNShare.share({
        message: message,
        title: note.title || 'Note',
      });
      onClose();
    } catch (error) {
      console.error('Error sharing note:', error);
      Alert.alert('Error', 'Failed to share note');
      onClose();
    }
  };

  const handleReadingMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReadingMode(true);
    onClose();
  };

  const handleReminders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReminders(true);
    onClose();
  };

  const menuOptions = [
    {
      icon: Share,
      label: 'Share',
      onPress: handleShare,
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
    <>
      {/* Actions Menu */}
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

      {/* Reading Mode Modal */}
      <Modal
        visible={showReadingMode}
        animationType="slide"
        onRequestClose={() => setShowReadingMode(false)}
        statusBarTranslucent
      >
        <View style={styles.readingModeContainer}>
          <View style={styles.readingModeHeader}>
            <Text style={styles.readingModeTitle}>Reading Mode</Text>
            <TouchableOpacity onPress={() => setShowReadingMode(false)}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.readingModeContent} contentContainerStyle={styles.readingModeContentContainer}>
            {note.title && (
              <Text style={styles.readingModeNoteTitle}>{note.title}</Text>
            )}
            <Text style={styles.readingModeBody}>{stripHtml(note.body)}</Text>
          </ScrollView>
        </View>
      </Modal>

      {/* Reminders Modal */}
      <Modal
        visible={showReminders}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminders(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.reminderOverlay} onPress={() => setShowReminders(false)}>
          <Pressable style={styles.reminderModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderTitle}>Set Reminder</Text>
              <TouchableOpacity onPress={() => setShowReminders(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.reminderOptions}>
              <TouchableOpacity
                style={styles.reminderOption}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  Alert.alert(
                    'Reminder Set',
                    `Reminder set for tomorrow at ${tomorrow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
                    [{ text: 'OK' }]
                  );
                  setShowReminders(false);
                }}
              >
                <Clock size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Tomorrow morning</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  nextWeek.setHours(9, 0, 0, 0);
                  Alert.alert(
                    'Reminder Set',
                    `Reminder set for ${nextWeek.toLocaleDateString('en-US')} at ${nextWeek.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
                    [{ text: 'OK' }]
                  );
                  setShowReminders(false);
                }}
              >
                <Clock size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Next week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={() => {
                  Alert.alert(
                    'Custom Reminder',
                    'Custom date/time picker coming soon! This will allow you to set any date and time for your reminder.',
                    [{ text: 'OK' }]
                  );
                  setShowReminders(false);
                }}
              >
                <Clock size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Custom date & time</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  // Reading Mode styles
  readingModeContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  readingModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingTop: 60,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  readingModeTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  readingModeContent: {
    flex: 1,
  },
  readingModeContentContainer: {
    padding: Spacing.xl,
  },
  readingModeNoteTitle: {
    fontSize: Typography.fontSize.huge,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xl,
    lineHeight: Typography.fontSize.huge * Typography.lineHeight.tight,
  },
  readingModeBody: {
    fontSize: Typography.fontSize.lg,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.relaxed,
  },
  // Reminders styles
  reminderOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  reminderModal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    ...Shadows.xl,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  reminderTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  reminderOptions: {
    gap: Spacing.xs,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  reminderOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
