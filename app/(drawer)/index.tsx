import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, Pressable, useWindowDimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { Menu, Search as SearchIcon, Grid2x2 as Grid, List, ArrowUpDown, Check, Plus, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { SwipeableNoteCard, NoteCardSkeleton, FormattedText } from '@/components';
import { CategoryChip } from '@/components/CategoryChip';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';
import { NoteActionsSheet } from '@/components/NoteActionsSheet';
import { getBackgroundById } from '@/components/BackgroundPicker';
import { useNotes } from '@/lib/NotesContext';
import { useToast } from '@/lib/ToastContext';
import { ViewMode, Note, SortBy } from '@/types';

export default function HomeScreen() {
  const layout = useWindowDimensions();
  const navigation = useNavigation<any>();
  const openDrawer = () => {
    const parent = navigation.getParent?.();
    // Try parent drawer first, fallback to current navigator
    if (parent?.openDrawer) parent.openDrawer();
    else navigation.openDrawer?.();
  };
  const insets = useSafeAreaInsets();
  const { notes, categories, loading, error, retry, deleteNote, toggleFavorite, toggleArchive, refreshNotes, updateNote, createCategory } = useNotes();
  const { showSuccess } = useToast();

  const [index, setIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(Colors.light.primary);

  // Add "All" category at the beginning and "+" at the end
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
    {
      id: 'add_new',
      name: '+',
      color: Colors.light.primary,
      icon: null,
      order_index: 9999,
      created_at: '',
      updated_at: '',
    },
  ], [categories]);

  const [routes] = useState(
    allCategories.map(cat => ({ key: cat.id, title: cat.name }))
  );

  // Update routes when categories change
  useMemo(() => {
    const newRoutes = allCategories.map(cat => ({ key: cat.id, title: cat.name }));
    return newRoutes;
  }, [allCategories]);

  const getFilteredNotes = (categoryId: string) => {
    const filtered = notes.filter((note) => {
      if (note.is_deleted || note.is_archived) return false;
      if (categoryId === 'all') return true;
      return note.category_id === categoryId;
    });

    // Sort: favorites first, then by selected sort option
    return filtered.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;

      if (sortBy === 'title') {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      } else if (sortBy === 'created') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
  };

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

  const handleColorChange = async (color: string | null) => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { color });
      showSuccess('Note color updated');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      await createCategory(newCategoryName.trim(), newCategoryColor);
      showSuccess('Category created');
      setNewCategoryName('');
      setNewCategoryColor(Colors.light.primary);
      setShowCreateCategoryModal(false);
      // Switch to the last real category (not the "+" tab)
      setIndex(categories.length);
    } catch (error) {
      Alert.alert('Error', 'Failed to create category');
    }
  };

  const handleTabChange = (newIndex: number) => {
    // Check if user tapped the "+" tab (last tab)
    if (newIndex === allCategories.length - 1) {
      setShowCreateCategoryModal(true);
      // Don't change the index, stay on current tab
      return;
    }
    setIndex(newIndex);
  };

  const renderNotesList = (categoryId: string) => {
    // Don't render anything for the "add_new" tab
    if (categoryId === 'add_new') {
      return null;
    }

    const filteredNotes = getFilteredNotes(categoryId);

    if (filteredNotes.length === 0) {
      return (
        <EmptyState
          title="No notes yet"
          message="Tap the + button to create your first note"
          actionText="Create Note"
          onActionPress={handleCreateNote}
        />
      );
    }

    if (viewMode === 'list') {
      return (
        <FlatList
          key="list"
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
        />
      );
    }

    // Grid view
    return (
      <FlatList
        key="grid"
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => {
          const background = getBackgroundById(item.color);
          const isGradient = background?.type === 'gradient' && background.gradient && background.gradient.length >= 2;
          const isPattern = background?.type === 'pattern';
          const isSolid = background?.type === 'solid' && background.value;

          const cardContent = (
            <>
              <View style={styles.gridContent}>
                {item.is_favorite && (
                  <View style={styles.gridFavorite}>
                    <Text style={styles.gridFavoriteIcon}>⭐</Text>
                  </View>
                )}
                {item.title ? (
                  <Text style={styles.gridTitle} numberOfLines={3}>
                    {item.title}
                  </Text>
                ) : null}
                {item.checklist_items && item.checklist_items.length > 0 ? (
                  <View style={styles.gridChecklist}>
                    {item.checklist_items.slice(0, 3).map((checkItem) => (
                      <View key={checkItem.id} style={styles.gridChecklistItem}>
                        <Text style={styles.gridChecklistIcon}>
                          {checkItem.completed ? '☑' : '☐'}
                        </Text>
                        <Text
                          style={[
                            styles.gridChecklistText,
                            checkItem.completed && styles.gridChecklistTextCompleted,
                          ]}
                          numberOfLines={1}
                        >
                          {checkItem.text || 'Empty'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : item.body ? (
                  <FormattedText
                    text={item.body.substring(0, 150) + (item.body.length > 150 ? '...' : '')}
                    style={styles.gridBody}
                    numberOfLines={6}
                  />
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleNoteMenu(item.id)}
                style={styles.gridMenu}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.gridMenuIcon}>⋮</Text>
              </TouchableOpacity>
              {isPattern && background?.pattern === 'grid' && (
                <View style={styles.gridPatternOverlay} />
              )}
              {isPattern && background?.pattern === 'floral' && (
                <Text style={styles.patternEmojiOverlay}>🌸</Text>
              )}
              {isPattern && background?.pattern === 'strawberry' && (
                <Text style={styles.patternEmojiOverlay}>🍓</Text>
              )}
            </>
          );

          return (
            <View style={styles.gridItem}>
              {isGradient ? (
                <TouchableOpacity onPress={() => handleNotePress(item.id)} activeOpacity={0.7}>
                  <LinearGradient
                    colors={background.gradient as [string, string, ...string[]]}
                    style={styles.gridCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {cardContent}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.gridCard,
                    (isSolid || isPattern) && { backgroundColor: background?.value || Colors.light.surface }
                  ]}
                  onPress={() => handleNotePress(item.id)}
                  activeOpacity={0.7}
                >
                  {cardContent}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
      />
    );
  };

  const renderScene = ({ route }: { route: { key: string; title: string } }) => {
    return renderNotesList(route.key);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={openDrawer}>
              <Menu size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notes</Text>
          </View>
        </View>
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
            <TouchableOpacity onPress={openDrawer}>
              <Menu size={24} color={Colors.light.text} />
            </TouchableOpacity>
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
          <TouchableOpacity onPress={openDrawer}>
            <Menu size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <SearchIcon size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.iconButton}>
            <ArrowUpDown size={24} color={Colors.light.text} />
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

      <TabView
        navigationState={{ index, routes: allCategories.map(cat => ({ key: cat.id, title: cat.name })) }}
        renderScene={renderScene}
        onIndexChange={handleTabChange}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            scrollEnabled
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            tabStyle={styles.tab}
            labelStyle={styles.tabLabel}
            activeColor={Colors.light.primary}
            inactiveColor={Colors.light.textSecondary}
          />
        )}
      />

      <FAB onPress={handleCreateNote} />

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

      {/* Create Category Modal */}
      <Modal
        visible={showCreateCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateCategoryModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.sortModalOverlay} onPress={() => setShowCreateCategoryModal(false)}>
            <Pressable style={styles.createCategoryModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.createCategoryHeader}>
                <Text style={styles.sortModalTitle}>New Category</Text>
                <TouchableOpacity onPress={() => setShowCreateCategoryModal(false)}>
                  <X size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.categoryInput}
                placeholder="Category name"
                placeholderTextColor={Colors.light.textTertiary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />

              <Text style={styles.colorPickerLabel}>Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorPicker}>
                {[
                  Colors.light.primary,
                  Colors.light.secondary,
                  Colors.light.accent,
                  Colors.light.warning,
                  '#9C27B0',
                  '#FF5722',
                  '#4CAF50',
                  '#00BCD4',
                  '#795548',
                  '#607D8B',
                ].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  >
                    {newCategoryColor === color && (
                      <Check size={20} color={Colors.light.surface} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.createCategoryActions}>
                <TouchableOpacity
                  style={[styles.categoryButton, styles.categoryButtonCancel]}
                  onPress={() => {
                    setShowCreateCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryColor(Colors.light.primary);
                  }}
                >
                  <Text style={styles.categoryButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.categoryButton, styles.categoryButtonCreate]}
                  onPress={handleCreateCategory}
                >
                  <Text style={styles.categoryButtonCreateText}>Create</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  tabBar: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tab: {
    width: 'auto',
    paddingHorizontal: Spacing.base,
  },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'none',
  },
  tabIndicator: {
    backgroundColor: Colors.light.primary,
    height: 3,
  },
  notesContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
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
  gridContainer: {
    padding: Spacing.sm,
    paddingBottom: 100,
  },
  gridItem: {
    flex: 1,
    maxWidth: '50%',
    padding: Spacing.xs,
  },
  gridCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 140,
    ...Shadows.md,
  },
  gridContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  gridFavorite: {
    alignSelf: 'flex-end',
  },
  gridFavoriteIcon: {
    fontSize: 14,
  },
  gridTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.tight,
  },
  gridBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
  },
  gridMenu: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
  },
  gridMenuIcon: {
    fontSize: 20,
    color: Colors.light.textTertiary,
    fontWeight: Typography.fontWeight.bold,
  },
  gridChecklist: {
    gap: 2,
  },
  gridChecklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gridChecklistIcon: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  gridChecklistText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.light.text,
  },
  gridChecklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  gridPatternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderStyle: 'solid',
    borderRadius: BorderRadius.lg,
  },
  patternEmojiOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 60,
    opacity: 0.1,
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  createCategoryModal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    ...Shadows.xl,
  },
  createCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  categoryInput: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  colorPickerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  colorPicker: {
    marginBottom: Spacing.xl,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.light.text,
  },
  createCategoryActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  categoryButtonCancel: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryButtonCancelText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.text,
  },
  categoryButtonCreate: {
    backgroundColor: Colors.light.primary,
  },
  categoryButtonCreateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.surface,
  },
});
