import React, { useMemo, useState } from 'react';
import { Pressable, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MoreVertical, Star, CheckCircle2, Circle, Lock, Image as ImageIcon, Mic, CheckSquare } from 'lucide-react-native';
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
  const [menuPressing, setMenuPressing] = useState(false);
  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const background = useMemo(() => getBackgroundById(note.color), [note.color]);

  // Strip HTML for preview - don't process body if note is locked
  const plainTextBody = useMemo(() => {
    if (note.is_locked) return '';
    return stripHtml(note.body || '');
  }, [note.body, note.is_locked]);

  // Calculate checklist progress
  const checklistProgress = useMemo(() => {
    if (!note.checklist_items || note.checklist_items.length === 0) return null;
    const completed = note.checklist_items.filter(item => item.completed).length;
    const total = note.checklist_items.length;
    return { completed, total };
  }, [note.checklist_items]);

  const renderCardContent = () => (
    <>
      <View style={styles.content}>
        {/* Only render header if needed */}
        {(selectionMode || note.is_favorite) && (
          <View style={styles.header}>
            {selectionMode ? (
              isSelected ? (
                <CheckCircle2 size={24} color={Colors.light.primary} fill={Colors.light.primary} />
              ) : (
                <Circle size={24} color={Colors.light.borderLight} />
              )
            ) : (
              note.is_favorite && (
                <View style={styles.headerIcons}>
                  <Star size={18} color={Colors.light.secondary} fill={Colors.light.secondary} />
                </View>
              )
            )}
          </View>
        )}

        {note.is_locked ? (
          // Show locked message instead of content
          <View style={styles.lockedContent}>
            <Lock size={20} color={Colors.light.textSecondary} strokeWidth={1.5} />
            <Text style={styles.lockedText}>Locked</Text>
            <Text style={styles.lockedSubtext}>Tap to unlock</Text>
          </View>
        ) : (
          <>
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
                {note.checklist_items.slice(0, 2).map((item) => (
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
                {note.checklist_items.length > 2 && (
                  <Text style={styles.checklistMore}>
                    +{note.checklist_items.length - 2} more
                  </Text>
                )}
              </View>
            ) : plainTextBody ? (
              searchQuery ? (
                <HighlightedText
                  text={plainTextBody.substring(0, 100) + (plainTextBody.length > 100 ? '...' : '')}
                  searchQuery={searchQuery}
                  style={styles.body}
                  numberOfLines={2}
                />
              ) : (
                <Text style={styles.body} numberOfLines={2}>
                  {plainTextBody.substring(0, 100) + (plainTextBody.length > 100 ? '...' : '')}
                </Text>
              )
            ) : null}
          </>
        )}

        {/* Metadata Footer */}
        <View style={styles.footer}>
          <View style={styles.metadataRow}>
            {/* Checklist indicator */}
            {checklistProgress && (
              <View style={styles.metadataItem}>
                <CheckSquare size={12} color={Colors.light.textTertiary} />
                <Text style={styles.metadataText}>
                  {checklistProgress.completed}/{checklistProgress.total}
                </Text>
              </View>
            )}

            {/* Images indicator */}
            {note.images && note.images.length > 0 && (
              <View style={styles.metadataItem}>
                <ImageIcon size={12} color={Colors.light.textTertiary} />
                {note.images.length > 1 && (
                  <Text style={styles.metadataText}>{note.images.length}</Text>
                )}
              </View>
            )}

            {/* Audio indicator */}
            {note.audio_recordings && note.audio_recordings.length > 0 && (
              <View style={styles.metadataItem}>
                <Mic size={12} color={Colors.light.textTertiary} />
                {note.audio_recordings.length > 1 && (
                  <Text style={styles.metadataText}>{note.audio_recordings.length}</Text>
                )}
              </View>
            )}

            {/* Lock indicator */}
            {note.is_locked && (
              <View style={styles.metadataItem}>
                <Lock size={12} color={Colors.light.textTertiary} />
              </View>
            )}

            {/* Date */}
            <Text style={styles.date}>{formattedDate}</Text>
          </View>

          {/* Menu button */}
          <Pressable
            onPress={(e) => {
              // Prevent parent press feedback and navigate smoothly
              (e as any)?.stopPropagation?.();
              onMenuPress();
            }}
            onPressIn={() => setMenuPressing(true)}
            onPressOut={() => setMenuPressing(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'transparent' }}
          >
            <MoreVertical size={18} color={Colors.light.textTertiary} />
          </Pressable>
        </View>
      </View>
    </>
  );

  // Render card with appropriate background using Pressable to control pressed feedback
  const pressedStyle = { transform: [{ scale: 0.99 }], opacity: 0.98 } as const;

  if (background?.type === 'gradient' && background.gradient && background.gradient.length >= 2) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        android_ripple={{ color: 'transparent' }}
        style={({ pressed }) => [styles.containerNoPadding, pressed && !menuPressing ? pressedStyle : null]}
      >
        <LinearGradient
          colors={background.gradient as [string, string, ...string[]]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {renderCardContent()}
        </LinearGradient>
      </Pressable>
    );
  }

  if (background?.type === 'pattern') {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        android_ripple={{ color: 'transparent' }}
        style={({ pressed }) => [styles.container, { backgroundColor: background.value || Colors.light.surface }, pressed && !menuPressing ? pressedStyle : null]}
      >
        {background.pattern === 'grid' && <View style={styles.gridPattern} />}
        {background.pattern === 'floral' && <Text style={styles.patternEmoji}>🌸</Text>}
        {background.pattern === 'strawberry' && <Text style={styles.patternEmoji}>🍓</Text>}
        {renderCardContent()}
      </Pressable>
    );
  }

  // Solid color or no background
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: 'transparent' }}
      style={({ pressed }) => [styles.container, background?.value && { backgroundColor: background.value }, pressed && !menuPressing ? pressedStyle : null]}
    >
      {renderCardContent()}
    </Pressable>
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
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    minHeight: 20,
    marginBottom: Spacing.xs,
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
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metadataText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textTertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textTertiary,
    marginLeft: 'auto',
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
  lockedContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  lockedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.semibold,
  },
  lockedSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
});
