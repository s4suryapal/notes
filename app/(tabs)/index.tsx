import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Menu, Search as SearchIcon, Grid2x2 as Grid, List } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SwipeableNoteCard, NoteCardSkeleton } from '@/components';
import { CategoryChip } from '@/components/CategoryChip';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';
import { NoteActionsSheet } from '@/components/NoteActionsSheet';
import { useNotes } from '@/lib/NotesContext';
import { useToast } from '@/lib/ToastContext';
import { ViewMode, Note } from '@/types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { notes, categories, loading, error, retry, deleteNote, toggleFavorite, toggleArchive, refreshNotes } = useNotes();
  const { showSuccess } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add "All" category at the beginning
  const allCategories = useMemo(() => [
    {
      id: 'all',
      name: 'All',
      color: Colors.light.primary,
      icon: null,
      order_index: -1,
      created_at: '',
      updated_at: '',
    },
    ...categories,
  ], [categories]);

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      if (note.is_deleted || note.is_archived) return false;
      if (!selectedCategory || selectedCategory === 'all') return true;
      return note.category_id === selectedCategory;
    });

    // Sort: favorites first, then by updated_at
    return filtered.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes, selectedCategory]);

  const handleCreateNote = () => {
    router.push('/note/new');
  };

  const handleNotePress = (noteId: string) => {
    router.push(`/note/${noteId}`);
  };

  const handleNoteMenu = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setSelectedNote(note);
      setShowActionsSheet(true);
    }
  };

  const handleFavorite = async () => {
    if (selectedNote) {
      const wasFavorite = selectedNote.is_favorite;
      await toggleFavorite(selectedNote.id);
      showSuccess(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  const handleArchive = async () => {
    if (selectedNote) {
      const wasArchived = selectedNote.is_archived;
      await toggleArchive(selectedNote.id);
      showSuccess(wasArchived ? 'Note unarchived' : 'Note archived');
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? It will be moved to trash.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(selectedNote.id);
            setShowActionsSheet(false);
            showSuccess('Note moved to trash');
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotes();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Menu size={24} color={Colors.light.text} />
            <Text style={styles.headerTitle}>Notes</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.categorySkeleton} />
          ))}
        </ScrollView>
        <View style={styles.notesContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Menu size={24} color={Colors.light.text} />
            <Text style={styles.headerTitle}>Notes</Text>
          </View>
        </View>
        <EmptyState
          title="Something went wrong"
          message={error}
          actionText="Try Again"
          onActionPress={retry}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => {}}>
            <Menu size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <SearchIcon size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.iconButton}
          >
            {viewMode === 'grid' ? (
              <List size={24} color={Colors.light.text} />
            ) : (
              <Grid size={24} color={Colors.light.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {allCategories.map((category) => (
          <CategoryChip
            key={category.id}
            name={category.name}
            color={category.color}
            isActive={selectedCategory === category.id || (!selectedCategory && category.id === 'all')}
            onPress={() => setSelectedCategory(category.id)}
            noteCount={
              category.id === 'all'
                ? notes.filter((n) => !n.is_deleted && !n.is_archived).length
                : notes.filter((n) => n.category_id === category.id && !n.is_deleted && !n.is_archived).length
            }
          />
        ))}
      </ScrollView>

      {filteredNotes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          message="Tap the + button to create your first note"
          actionText="Create Note"
          onActionPress={handleCreateNote}
        />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SwipeableNoteCard
              note={item}
              onPress={() => handleNotePress(item.id)}
              onMenuPress={() => handleNoteMenu(item.id)}
              onDelete={() => {
                setSelectedNote(item);
                handleDelete();
              }}
              onArchive={async () => {
                await toggleArchive(item.id);
              }}
            />
          )}
          contentContainerStyle={styles.notesContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
          updateCellsBatchingPeriod={50}
        />
      )}

      <FAB onPress={handleCreateNote} />

      <NoteActionsSheet
        visible={showActionsSheet}
        note={selectedNote}
        onClose={() => setShowActionsSheet(false)}
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  categoriesContainer: {
    maxHeight: 50,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  notesContainer: {
    padding: Spacing.base,
    paddingBottom: 100, // Generous padding to account for tab bar + safe area
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
  },
  categorySkeleton: {
    width: 80,
    height: 36,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.light.borderLight,
    marginRight: Spacing.sm,
  },
});
