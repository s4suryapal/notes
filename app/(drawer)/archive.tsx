import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Archive, ArrowLeft } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { NoteCard, EmptyState, NoteActionsSheet } from '@/components';
import type { Note } from '@/types';

export default function ArchiveScreen() {
  const { notes, toggleArchive, deleteNote } = useNotes();
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    // Filter archived notes
    const archived = notes.filter(note => note.is_archived && !note.is_deleted);
    setArchivedNotes(archived);
  }, [notes]);

  const handleNotePress = (note: Note) => {
    router.push(`/note/${note.id}`);
  };

  const handleMorePress = (note: Note) => {
    setSelectedNote(note);
    setShowActionsSheet(true);
  };

  const handleUnarchive = async () => {
    if (!selectedNote) return;

    try {
      await toggleArchive(selectedNote.id);
      setShowActionsSheet(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('Error unarchiving note:', error);
      Alert.alert('Error', 'Failed to unarchive note');
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    Alert.alert(
      'Move to Trash',
      'This note will be moved to trash.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(selectedNote.id);
              setShowActionsSheet(false);
              setSelectedNote(null);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <NoteCard
      note={item}
      onPress={() => handleNotePress(item)}
      onMenuPress={() => handleMorePress(item)}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Archive size={24} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Archive</Text>
          <Text style={styles.headerCount}>
            {archivedNotes.length} {archivedNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
      </View>

      {archivedNotes.length === 0 ? (
        <EmptyState
          title="No Archived Notes"
          message="Notes you archive will appear here"
        />
      ) : (
        <FlatList
          data={archivedNotes}
          renderItem={renderNote}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedNote && (
        <NoteActionsSheet
          visible={showActionsSheet}
          note={selectedNote}
          onClose={() => {
            setShowActionsSheet(false);
            setSelectedNote(null);
          }}
          onFavorite={() => {}}
          onArchive={handleUnarchive}
          onDelete={handleDelete}
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
  listContent: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
});
