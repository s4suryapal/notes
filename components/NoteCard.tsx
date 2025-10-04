import React, { useMemo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MoreVertical, Star, CheckCircle2, Circle, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { HighlightedText } from './HighlightedText';
import { getBackgroundById } from './BackgroundPicker';
import { Note } from '@/types';

// Helper function to strip HTML tags and decode entities for preview
function stripHtml(html: string): string {
  if (!html) return '';

  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags and content
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags and content
    .replace(/<br\s*\/?>/gi, '\n') // Convert br to newline
    .replace(/<\/p>/gi, '\n') // Convert closing p to newline
    .replace(/<\/div>/gi, '\n') // Convert closing div to newline
    .replace(/<li>/gi, '• ') // Convert li to bullet
    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress: () => void;
  searchQuery?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
}

export const NoteCard = React.memo(function NoteCard({
  note,
  onPress,
  onLongPress,
  onMenuPress,
  searchQuery,
  selectionMode = false,
  isSelected = false
}: NoteCardProps) {
  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const background = useMemo(() => getBackgroundById(note.color), [note.color]);

  // Strip HTML for preview
  const plainTextBody = useMemo(() => stripHtml(note.body || ''), [note.body]);

  const renderCardContent = () => (
    <>
      <View style={styles.content}>
        <View style={styles.header}>
          {selectionMode ? (
            isSelected ? (
              <CheckCircle2 size={24} color={Colors.light.primary} fill={Colors.light.primary} />
            ) : (
              <Circle size={24} color={Colors.light.borderLight} />
            )
          ) : (
            <View style={styles.headerIcons}>
              {note.is_locked && (
                <Lock size={14} color={Colors.light.textSecondary} />
              )}
              {note.is_favorite && (
                <Star size={16} color={Colors.light.secondary} fill={Colors.light.secondary} />
              )}
            </View>
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
        ) : plainTextBody ? (
          searchQuery ? (
            <HighlightedText
              text={plainTextBody.substring(0, 160) + (plainTextBody.length > 160 ? '...' : '')}
              searchQuery={searchQuery}
              style={styles.body}
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.body} numberOfLines={4}>
              {plainTextBody.substring(0, 160) + (plainTextBody.length > 160 ? '...' : '')}
            </Text>
          )
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.date}>{formattedDate}</Text>
          <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <MoreVertical size={20} color={Colors.light.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // Render card with appropriate background
  if (background?.type === 'gradient' && background.gradient && background.gradient.length >= 2) {
    return (
      <TouchableOpacity style={styles.containerNoPadding} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
        <LinearGradient
          colors={background.gradient as [string, string, ...string[]]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderCardContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (background?.type === 'pattern') {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: background.value || Colors.light.surface }]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {background.pattern === 'grid' && <View style={styles.gridPattern} />}
        {background.pattern === 'floral' && <Text style={styles.patternEmoji}>🌸</Text>}
        {background.pattern === 'strawberry' && <Text style={styles.patternEmoji}>🍓</Text>}
        {renderCardContent()}
      </TouchableOpacity>
    );
  }

  // Solid color or no background
  return (
    <TouchableOpacity
      style={[styles.container, background?.value && { backgroundColor: background.value }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {renderCardContent()}
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
  containerNoPadding: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.base,
    ...Shadows.md,
    overflow: 'hidden',
  },
  content: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
  gradientBackground: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.lg,
  },
  patternEmoji: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 60,
    opacity: 0.1,
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
});
