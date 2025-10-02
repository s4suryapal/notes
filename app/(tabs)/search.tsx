import { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SafeAreaView, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search as SearchIcon, X, SlidersHorizontal } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SwipeableNoteCard, NoteActionsSheet, EmptyState } from '@/components';
import { useNotes } from '@/lib/NotesContext';
import { Note } from '@/types';

export default function SearchScreen() {
  const { notes, deleteNote, toggleFavorite, toggleArchive, refreshNotes } = useNotes();
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [inputValue]);

  const searchResults = useMemo(() => {
    if (debouncedQuery.trim() === '') return [];

    return notes.filter(
      (note) =>
        !note.is_deleted &&
        !note.is_archived &&
        (note.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          note.body.toLowerCase().includes(debouncedQuery.toLowerCase()))
    );
  }, [notes, debouncedQuery]);

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

  return (
    <SafeAreaView style={styles.container}>
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
        <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
          <SlidersHorizontal size={24} color={Colors.light.text} />
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
      />
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
});
