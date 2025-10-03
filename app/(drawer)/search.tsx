import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search as SearchIcon, X, ArrowUpDown, Check } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { SwipeableNoteCard, NoteActionsSheet, EmptyState } from '@/components';
import { useNotes } from '@/lib/NotesContext';
import { Note, SortBy } from '@/types';

export default function SearchScreen() {
  const { notes, deleteNote, toggleFavorite, toggleArchive, refreshNotes, updateNote } = useNotes();
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300) as any;

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [inputValue]);

  const searchResults = useMemo(() => {
    if (debouncedQuery.trim() === '') return [];

    const filtered = notes.filter(
      (note) =>
        !note.is_deleted &&
        !note.is_archived &&
        (note.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          note.body.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );

    // Sort results
    return filtered.sort((a, b) => {
      // Favorites always come first
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;

      // Then sort by selected option
      if (sortBy === 'title') {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      } else if (sortBy === 'created') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        // 'updated' - default
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  }, [notes, debouncedQuery, sortBy]);

  const handleSearch = (query: string) => {
    setInputValue(query);
  };

  const handleClearSearch = () => {
    setInputValue('');
    setDebouncedQuery('');
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
      await toggleFavorite(selectedNote.id);
    }
  };

  const handleArchive = async () => {
    if (selectedNote) {
      await toggleArchive(selectedNote.id);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? It will be moved to trash.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(selectedNote.id);
            setShowActionsSheet(false);
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

  const handleColorChange = async (color: string | null) => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { color });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <SearchIcon size={20} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            placeholderTextColor={Colors.light.textTertiary}
            value={inputValue}
            onChangeText={handleSearch}
            autoFocus
          />
          {inputValue.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <X size={20} color={Colors.light.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.iconButton}>
          <ArrowUpDown size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {debouncedQuery.trim() === '' ? (
        <EmptyState
          title="Search your notes"
          message="Enter keywords to find notes by title or content"
        />
      ) : searchResults.length === 0 ? (
        <EmptyState
          title="No results found"
          message={`No notes found for "${debouncedQuery}"`}
        />
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
          </Text>
          <FlatList
            data={searchResults}
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
                searchQuery={debouncedQuery}
              />
            )}
            contentContainerStyle={styles.listContainer}
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
        </View>
      )}

      <NoteActionsSheet
        visible={showActionsSheet}
        note={selectedNote}
        onClose={() => setShowActionsSheet(false)}
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onColorChange={handleColorChange}
      />

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.sortModalOverlay} onPress={() => setShowSortModal(false)}>
          <Pressable style={styles.sortModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sortModalTitle}>Sort by</Text>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortBy('updated');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Last updated</Text>
              {sortBy === 'updated' && <Check size={20} color={Colors.light.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortBy('created');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Date created</Text>
              {sortBy === 'created' && <Check size={20} color={Colors.light.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortBy('title');
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>Title (A-Z)</Text>
              {sortBy === 'title' && <Check size={20} color={Colors.light.primary} />}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    padding: 0,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  listContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  sortModalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  sortModal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    ...Shadows.xl,
  },
  sortModalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.base,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  sortOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
