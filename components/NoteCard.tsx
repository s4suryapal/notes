import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MoveVertical as MoreVertical, Star } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { HighlightedText } from './HighlightedText';
import { FormattedText } from './FormattedText';
import { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onMenuPress: () => void;
  searchQuery?: string;
}

export const NoteCard = React.memo(function NoteCard({ note, onPress, onMenuPress, searchQuery }: NoteCardProps) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const previewText = note.body.substring(0, 100) + (note.body.length > 100 ? '...' : '');

  return (
    <TouchableOpacity
      style={[styles.container, note.color && { backgroundColor: note.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          {note.is_favorite && (
            <Star size={16} color={Colors.light.secondary} fill={Colors.light.secondary} />
          )}
        </View>
        {note.title ? (
          searchQuery ? (
            <HighlightedText
              text={note.title}
              searchQuery={searchQuery}
              style={styles.title}
              numberOfLines={2}
            />
          ) : (
            <Text style={styles.title} numberOfLines={2}>
              {note.title}
            </Text>
          )
        ) : null}
        {note.checklist_items && note.checklist_items.length > 0 ? (
          <View style={styles.checklistPreview}>
            {note.checklist_items.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.checklistItem}>
                <Text style={styles.checklistIcon}>{item.completed ? '☑' : '☐'}</Text>
                <Text
                  style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}
                  numberOfLines={1}
                >
                  {item.text || 'Empty item'}
                </Text>
              </View>
            ))}
            {note.checklist_items.length > 3 && (
              <Text style={styles.checklistMore}>
                +{note.checklist_items.length - 3} more items
              </Text>
            )}
          </View>
        ) : note.body ? (
          searchQuery ? (
            <HighlightedText
              text={previewText}
              searchQuery={searchQuery}
              style={styles.body}
              numberOfLines={4}
            />
          ) : (
            <FormattedText text={previewText} style={styles.body} numberOfLines={4} />
          )
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.date}>{formattedDate}</Text>
          <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreVertical size={20} color={Colors.light.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  content: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 20,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.tight,
  },
  body: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textTertiary,
  },
  checklistPreview: {
    gap: Spacing.xs,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  checklistIcon: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  checklistText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.light.text,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  checklistMore: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textTertiary,
    fontStyle: 'italic',
  },
});
