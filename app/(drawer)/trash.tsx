import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Trash2, RotateCcw, X, ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { NoteCard, EmptyState } from '@/components';
import { permanentlyDeleteNote, restoreNote } from '@/lib/storage';
import type { Note } from '@/types';

export default function TrashScreen() {
  const { notes, refreshNotes } = useNotes();
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Filter deleted notes
    const deleted = notes.filter(note => note.is_deleted);
    setDeletedNotes(deleted);
  }, [notes]);

  const handleRestore = async (noteId: string) => {
    try {
      await restoreNote(noteId);
      await refreshNotes();
      Alert.alert('Success', 'Note restored successfully');
    } catch (error) {
      console.error('Error restoring note:', error);
      Alert.alert('Error', 'Failed to restore note');
    }
  };

  const handlePermanentDelete = async (noteId: string) => {
    Alert.alert(
      'Delete Permanently',
      'This note will be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentlyDeleteNote(noteId);
              await refreshNotes();
            } catch (error) {
              console.error('Error permanently deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (deletedNotes.length === 0) return;

    Alert.alert(
      'Empty Trash',
      `Permanently delete all ${deletedNotes.length} notes? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(
                deletedNotes.map(note => permanentlyDeleteNote(note.id))
              );
              await refreshNotes();
              Alert.alert('Success', 'Trash emptied');
            } catch (error) {
              console.error('Error emptying trash:', error);
              Alert.alert('Error', 'Failed to empty trash');
            }
          },
        },
      ]
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View style={styles.noteWrapper}>
      <NoteCard
        note={item}
        onPress={() => {}}
        onMenuPress={() => {}}
      />
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => handleRestore(item.id)}
        >
          <RotateCcw size={18} color={Colors.light.surface} />
          <Text style={styles.actionButtonText}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handlePermanentDelete(item.id)}
        >
          <X size={18} color={Colors.light.surface} />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Trash2 size={24} color={Colors.light.error} />
          <Text style={styles.headerTitle}>Trash</Text>
          <Text style={styles.headerCount}>
            {deletedNotes.length} {deletedNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
      </View>

      {deletedNotes.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Notes in trash will be automatically deleted after 30 days
          </Text>
          <TouchableOpacity
            style={styles.emptyTrashButton}
            onPress={handleEmptyTrash}
          >
            <Text style={styles.emptyTrashText}>Empty Trash</Text>
          </TouchableOpacity>
        </View>
      )}

      {deletedNotes.length === 0 ? (
        <EmptyState
          title="Trash is Empty"
          message="Deleted notes will appear here"
        />
      ) : (
        <FlatList
          data={deletedNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  headerCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    
    padding: Spacing.md,
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    marginRight: Spacing.sm,
  },
  emptyTrashButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.error,
    borderRadius: BorderRadius.sm,
  },
  emptyTrashText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
  },
  listContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  noteWrapper: {
    marginBottom: Spacing.md,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  restoreButton: {
    backgroundColor: Colors.light.primary,
  },
  deleteButton: {
    backgroundColor: Colors.light.error,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
  },
});
