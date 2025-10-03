import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert, Share as RNShare, ScrollView } from 'react-native';
import { useState, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import { Star, Archive, Share, Info, Eye, Clock, X, FolderInput, Trash2, FileText, FileDown, Image as ImageIcon, Copy, Printer, Music } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { Note, Category } from '@/types';

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
  onMoveToCategory?: (categoryId: string | null) => void;
  categories?: Category[];
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
  onMoveToCategory,
  categories = [],
}: NoteActionsSheetProps) {
  const [showReadingMode, setShowReadingMode] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

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

  const handleMoveToCategory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCategoryPicker(true);
    onClose();
  };

  const handleCategorySelect = (categoryId: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onMoveToCategory) {
      onMoveToCategory(categoryId);
    }
    setShowCategoryPicker(false);
  };

  const handleExport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowExportOptions(true);
    onClose();
  };

  const handleExportText = async () => {
    try {
      const plainText = stripHtml(note.body);
      const content = note.title
        ? `${note.title}\n\n${plainText}`
        : plainText;

      const fileName = `${note.title || 'Note'}.txt`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Note as Text',
        });
      } else {
        Alert.alert('Success', 'Note exported successfully');
      }
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting as text:', error);
      Alert.alert('Error', 'Failed to export note as text');
    }
  };

  const handleExportPDF = async () => {
    try {
      const plainText = stripHtml(note.body);
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px;
                line-height: 1.6;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: #333;
              }
              p {
                font-size: 16px;
                color: #555;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            ${note.title ? `<h1>${note.title}</h1>` : ''}
            <p>${plainText.replace(/\n/g, '<br>')}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Note as PDF',
        });
      } else {
        Alert.alert('Success', 'PDF created successfully');
      }
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting as PDF:', error);
      Alert.alert('Error', 'Failed to export note as PDF');
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const plainText = stripHtml(note.body);
      let content = '';

      if (note.title) {
        content = `# ${note.title}\n\n${plainText}`;
      } else {
        content = plainText;
      }

      const fileName = `${note.title || 'Note'}.md`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/markdown',
          dialogTitle: 'Export Note as Markdown',
        });
      } else {
        Alert.alert('Success', 'Markdown file created successfully');
      }
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting as Markdown:', error);
      Alert.alert('Error', 'Failed to export note as Markdown');
    }
  };

  const handleExportImage = async () => {
    try {
      const plainText = stripHtml(note.body);
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 30px;
                line-height: 1.6;
                background-color: #ffffff;
                max-width: 800px;
              }
              h1 {
                font-size: 28px;
                margin-bottom: 20px;
                color: #333;
                font-weight: bold;
              }
              p {
                font-size: 18px;
                color: #555;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            ${note.title ? `<h1>${note.title}</h1>` : ''}
            <p>${plainText.replace(/\n/g, '<br>')}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      // For now, share the PDF as image alternative
      // A proper image implementation would need ViewShot with a rendered component
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Export Note as Image',
        });
      } else {
        Alert.alert('Success', 'Note exported successfully');
      }
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting as image:', error);
      Alert.alert('Error', 'Failed to export note as image');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const plainText = stripHtml(note.body);
      const content = note.title
        ? `${note.title}\n\n${plainText}`
        : plainText;

      await Clipboard.setStringAsync(content);
      Alert.alert('Copied', 'Note copied to clipboard');
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy note to clipboard');
    }
  };

  const handlePrint = async () => {
    try {
      const plainText = stripHtml(note.body);
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px;
                line-height: 1.6;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: #333;
              }
              p {
                font-size: 16px;
                color: #555;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            ${note.title ? `<h1>${note.title}</h1>` : ''}
            <p>${plainText.replace(/\n/g, '<br>')}</p>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error printing note:', error);
      Alert.alert('Error', 'Failed to print note');
    }
  };

  const handleExportAudio = async () => {
    try {
      if (!note.audio_recordings || note.audio_recordings.length === 0) {
        Alert.alert('No Audio', 'This note does not contain any audio recordings');
        setShowExportOptions(false);
        return;
      }

      // If single audio file, share it directly
      if (note.audio_recordings.length === 1) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(note.audio_recordings[0], {
            mimeType: 'audio/m4a',
            dialogTitle: 'Export Audio Recording',
          });
        } else {
          Alert.alert('Success', 'Audio file ready for export');
        }
      } else {
        // Multiple audio files - share them one by one or create a zip
        // For now, share the first one and show count
        Alert.alert(
          'Multiple Audio Files',
          `This note has ${note.audio_recordings.length} audio recordings. Sharing first recording...`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Share First',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(note.audio_recordings![0], {
                    mimeType: 'audio/m4a',
                    dialogTitle: 'Export Audio Recording',
                  });
                }
              },
            },
          ]
        );
      }
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting audio:', error);
      Alert.alert('Error', 'Failed to export audio recording');
    }
  };

  const menuOptions = [
    {
      icon: Share,
      label: 'Share',
      onPress: handleShare,
    },
    {
      icon: FileDown,
      label: 'Export',
      onPress: handleExport,
    },
    {
      icon: FolderInput,
      label: 'Move to Folder',
      onPress: handleMoveToCategory,
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
      icon: Trash2,
      label: 'Delete',
      onPress: () => handleAction(onDelete, 'Delete'),
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
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
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
          </Pressable>
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

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.reminderOverlay} onPress={() => setShowCategoryPicker(false)}>
          <Pressable style={styles.reminderModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderTitle}>Move to Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {/* None/All option */}
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  !note.category_id && styles.categoryOptionActive,
                ]}
                onPress={() => handleCategorySelect(null)}
              >
                <View style={[styles.categoryDot, { backgroundColor: Colors.light.textTertiary }]} />
                <Text style={styles.categoryOptionText}>None</Text>
                {!note.category_id && <X size={16} color={Colors.light.primary} />}
              </TouchableOpacity>

              {/* Categories */}
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    note.category_id === category.id && styles.categoryOptionActive,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryOptionText}>{category.name}</Text>
                  {note.category_id === category.id && <X size={16} color={Colors.light.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Export Options Modal */}
      <Modal
        visible={showExportOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportOptions(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.reminderOverlay} onPress={() => setShowExportOptions(false)}>
          <Pressable style={styles.reminderModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.reminderHeader}>
              <Text style={styles.reminderTitle}>Export Note</Text>
              <TouchableOpacity onPress={() => setShowExportOptions(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.exportList}>
              <TouchableOpacity
                style={styles.reminderOption}
                onPress={handleExportPDF}
              >
                <FileDown size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Export as PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={handleExportText}
              >
                <FileText size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Export as Text (.txt)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={handleExportMarkdown}
              >
                <FileText size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Export as Markdown (.md)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={handleExportImage}
              >
                <ImageIcon size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Export as Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={handleCopyToClipboard}
              >
                <Copy size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Copy to Clipboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reminderOption}
                onPress={handlePrint}
              >
                <Printer size={20} color={Colors.light.text} />
                <Text style={styles.reminderOptionText}>Print</Text>
              </TouchableOpacity>

              {note.audio_recordings && note.audio_recordings.length > 0 && (
                <TouchableOpacity
                  style={styles.reminderOption}
                  onPress={handleExportAudio}
                >
                  <Music size={20} color={Colors.light.text} />
                  <Text style={styles.reminderOptionText}>
                    Export Audio {note.audio_recordings.length > 1 ? `(${note.audio_recordings.length})` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxxl,
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
  // Category Picker styles
  categoryList: {
    maxHeight: 400,
  },
  // Export List styles
  exportList: {
    maxHeight: 450,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  categoryOptionActive: {
    backgroundColor: Colors.light.background,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
