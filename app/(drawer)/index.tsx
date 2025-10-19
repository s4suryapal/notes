import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert, RefreshControl, Modal, Pressable, useWindowDimensions, TextInput, KeyboardAvoidingView, Platform, InteractionManager, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { router, useNavigation } from 'expo-router';
import { Menu, Search as SearchIcon, Grid2x2 as Grid, List, ArrowUpDown, Check, Plus, X, Trash2, Archive, CheckSquare, FolderInput, CheckCircle2, Circle, FolderPlus, Image as ImageIcon, Mic, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { NoteCard, NoteCardSkeleton, FormattedText, FeatureTour, ErrorBoundary } from '@/components';
import { CategoryChip } from '@/components/CategoryChip';
import { FAB } from '@/components/FAB';
import { EmptyState } from '@/components/EmptyState';
import { NoteActionsSheet } from '@/components/NoteActionsSheet';
import { getBackgroundById } from '@/components/BackgroundPicker';
import BannerAdComponent from '@/components/BannerAdComponent';
import { useNotes } from '@/lib/NotesContext';
import { authenticateWithBiometrics } from '@/lib/biometric';
import { useToast } from '@/lib/ToastContext';
import { useFeatureTour } from '@/lib/FeatureTourContext';
import { getHomeTourSteps } from '@/components/tours/homeTourSteps';
import { ViewMode, Note, SortBy } from '@/types';
import analytics from '@/services/analytics';

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
  const { notes, categories, loading, error, retry, deleteNote, toggleFavorite, toggleArchive, toggleLock, refreshNotes, updateNote, createCategory } = useNotes();
  const { showSuccess, showInfo } = useToast();
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  const { shouldShowHomeTour, setHomeTourCompleted } = useFeatureTour();
  const { guardNavigation } = useNavigationGuard({ delay: 500 });

  // Responsive grid calculations (AllMail pattern)
  const { width: windowWidth } = layout;
  const gridConfig = useMemo(() => {
    const horizontalPadding = Spacing.sm * 2; // Left + right padding
    const gap = Spacing.xs * 2; // Gap between items

    // Determine number of columns based on screen width
    let numColumns = 2; // Default for phones
    if (windowWidth >= 1024) {
      numColumns = 4; // Desktop/large tablets
    } else if (windowWidth >= 768) {
      numColumns = 3; // Tablets
    } else if (windowWidth >= 600) {
      numColumns = 2; // Large phones landscape
    }

    // Calculate item width with proper gap handling
    const gridWidth = Math.max(windowWidth - horizontalPadding, 0);
    const itemWidth = Math.floor((gridWidth - (numColumns - 1) * gap) / numColumns);

    return {
      numColumns,
      itemWidth,
      gap,
      horizontalPadding,
    };
  }, [windowWidth]);

  const [index, setIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');

  // Track view mode changes
  useEffect(() => {
    analytics.logViewModeChanged(viewMode).catch(console.error);
  }, [viewMode]);

  // Track sort mode changes
  useEffect(() => {
    analytics.logSortModeChanged(sortBy).catch(console.error);
  }, [sortBy]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(Colors.light.primary);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  // Feature Tour state
  const [showHomeTour, setShowHomeTour] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const fabBottom = insets.bottom + 50 + Spacing.base;
  const fabRef = useRef<View>(null);
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const homeTourSteps = useMemo(() => {
    if (!fabPosition) return [];
    return getHomeTourSteps(fabPosition);
  }, [fabPosition]);

  // Add "All" category at the beginning (no "+" tab anymore)
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
    // Dismiss tour if it's showing
    if (showHomeTour) {
      setShowHomeTour(false);
      setTourStepIndex(0);
      setHomeTourCompleted();
    }

    guardNavigation(() => {
      // Derive current tab's category id; skip if 'all'
      const currentCat = allCategories[index];
      const catId = currentCat?.id && currentCat.id !== 'all' ? currentCat.id : null;
      const href = catId ? `/note/new?category=${encodeURIComponent(catId)}` : '/note/new';
      router.push(href as any); // Type issue with dynamic query params in Expo Router
    });
  };

  const handleNoteMenu = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      setSelectedNote(note);
      InteractionManager.runAfterInteractions(() => setShowActionsSheet(true));
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

  const handleLock = async () => {
    if (selectedNote) {
      const result = await toggleLock(selectedNote.id);
      if (result.success) {
        showSuccess(selectedNote.is_locked ? 'Note unlocked' : 'Note locked');
        setShowActionsSheet(false);
      } else {
        const err = (result.error || '').toLowerCase();
        if (err.includes('cancel')) {
          showInfo(selectedNote.is_locked ? 'Unlock cancelled' : 'Lock cancelled');
          setShowActionsSheet(false);
        } else {
          Alert.alert('Lock Error', 'Could not complete the action. Please try again.');
        }
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    // If locked, require authentication before showing delete confirm
    if (selectedNote.is_locked) {
      const auth = await authenticateWithBiometrics('Authenticate to delete note');
      if (!auth.success) {
        const err = (auth.error || '').toLowerCase();
        if (err.includes('cancel')) {
          showInfo('Delete cancelled');
          setShowActionsSheet(false);
          return;
        }
        Alert.alert('Authentication required', 'Could not verify identity.');
        return;
      }
    }

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

  const handleMoveToCategory = async (categoryId: string | null) => {
    if (selectedNote) {
      await updateNote(selectedNote.id, { category_id: categoryId });
      const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name : 'None';
      showSuccess(`Note moved to ${categoryName}`);
    }
  };

  // Selection mode handlers
  const handleLongPress = (noteId: string) => {
    setSelectionMode(true);
    setSelectedNoteIds(new Set([noteId]));
  };

  const handleNotePress = (noteId: string) => {
    if (selectionMode) {
      const newSelected = new Set(selectedNoteIds);
      if (newSelected.has(noteId)) {
        newSelected.delete(noteId);
      } else {
        newSelected.add(noteId);
      }
      setSelectedNoteIds(newSelected);

      // Exit selection mode if no notes selected
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }
    } else {
      guardNavigation(() => {
        router.push(`/note/${noteId}`);
      });
    }
  };

  const handleSelectAll = (categoryNotes: Note[]) => {
    const allIds = new Set(categoryNotes.map(n => n.id));
    // Toggle: if all are selected, deselect all
    if (selectedNoteIds.size === allIds.size) {
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
    } else {
      setSelectedNoteIds(allIds);
    }
  };

  const handleDeselectAll = () => {
    setSelectedNoteIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.size === 0) return;

    // Track bulk operation attempt
    analytics.logBulkOperation('delete', selectedNoteIds.size).catch(console.error);

    // If any selected note is locked, require authentication first
    const anyLocked = notes.some(n => selectedNoteIds.has(n.id) && n.is_locked);
    if (anyLocked) {
      const auth = await authenticateWithBiometrics('Authenticate to delete locked notes');
      if (!auth.success) {
        const err = (auth.error || '').toLowerCase();
        if (err.includes('cancel')) {
          showInfo('Delete cancelled');
          return;
        }
        Alert.alert('Authentication required', 'Could not verify identity.');
        return;
      }
    }

    Alert.alert(
      'Delete Notes',
      `Move ${selectedNoteIds.size} note(s) to trash?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const count = selectedNoteIds.size;
            try {
              // Delete all notes
              await Promise.all(
                Array.from(selectedNoteIds).map(id => deleteNote(id))
              );
              showSuccess(`${count} note(s) moved to trash`);
            } catch (error) {
              console.error('Error bulk deleting notes:', error);
              Alert.alert('Error', 'Failed to delete some notes. Please try again.');
            } finally {
              setSelectedNoteIds(new Set());
              setSelectionMode(false);
            }
          },
        },
      ]
    );
  };

  const handleBulkArchive = async () => {
    if (selectedNoteIds.size === 0) return;

    const count = selectedNoteIds.size;

    // Track bulk operation
    analytics.logBulkOperation('archive', count).catch(console.error);
    try {
      // Archive all notes
      await Promise.all(
        Array.from(selectedNoteIds).map(id => toggleArchive(id))
      );
      showSuccess(`${count} note(s) archived`);
    } catch (error) {
      console.error('Error bulk archiving notes:', error);
      Alert.alert('Error', 'Failed to archive some notes. Please try again.');
    } finally {
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
    }
  };

  const [showBulkCategoryPicker, setShowBulkCategoryPicker] = useState(false);

  const handleBulkMoveToCategory = (categoryId: string | null) => {
    if (selectedNoteIds.size === 0) return;

    const count = selectedNoteIds.size;

    // Track bulk operation
    analytics.logBulkOperation('move', count).catch(console.error);
    try {
      // Move all notes to category
      Promise.all(
        Array.from(selectedNoteIds).map(id => updateNote(id, { category_id: categoryId }))
      );
      const categoryName = categoryId ? categories.find(c => c.id === categoryId)?.name : 'None';
      showSuccess(`${count} note(s) moved to ${categoryName}`);
    } catch (error) {
      console.error('Error bulk moving notes:', error);
      Alert.alert('Error', 'Failed to move some notes. Please try again.');
    } finally {
      setSelectedNoteIds(new Set());
      setSelectionMode(false);
      setShowBulkCategoryPicker(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      await createCategory(newCategoryName.trim(), newCategoryColor);
      showSuccess('Folder created');
      setNewCategoryName('');
      setNewCategoryColor(Colors.light.primary);
      setShowCreateCategoryModal(false);
      // Switch to the last real category (not the "+" tab)
      setIndex(categories.length);
    } catch (error) {
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  // Handle FAB layout for tour positioning
  const handleFabLayout = useCallback(() => {
    if (!loading && fabRef.current) {
      // Use a longer delay to ensure layout is fully settled
      setTimeout(() => {
        fabRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          // Verify we got valid measurements
          if (width > 0 && height > 0) {
            setFabPosition({ x, y, width, height });
          }
        });
      }, 300);
    }
  }, [loading]);

  // Show home tour after data loads and FAB is measured
  useEffect(() => {
    if (!loading && shouldShowHomeTour() && fabPosition) {
      // Delay slightly to let UI settle
      const timer = setTimeout(() => setShowHomeTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, shouldShowHomeTour, fabPosition]);

  const handleTourNext = () => {
    setTourStepIndex((prev) => prev + 1);
  };

  const handleTourSkip = () => {
    analytics.logFeatureTourSkipped('home_tour', tourStepIndex).catch(console.error);
    setShowHomeTour(false);
    setTourStepIndex(0);
    setHomeTourCompleted();
  };

  const handleTourComplete = () => {
    analytics.logFeatureTourCompleted('home_tour').catch(console.error);
    setShowHomeTour(false);
    setTourStepIndex(0);
    setHomeTourCompleted();
  };

  // Handle Android back: close sheets/modals, exit selection, or double-press to exit app
  const lastBackPressRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Close modals/sheets first
        if (showActionsSheet) {
          setShowActionsSheet(false);
          return true;
        }
        if (showSortModal) {
          setShowSortModal(false);
          return true;
        }
        if (showCreateCategoryModal) {
          setShowCreateCategoryModal(false);
          return true;
        }
        // Deselect notes if in selection mode
        if (selectionMode) {
          handleDeselectAll();
          return true;
        }
        // Double-press to exit
        const now = Date.now();
        if (now - (lastBackPressRef.current || 0) < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPressRef.current = now;
        try { showSuccess('Press back again to exit'); } catch {}
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        try { sub.remove(); } catch {}
      };
    }, [showActionsSheet, showSortModal, showCreateCategoryModal, selectionMode, handleDeselectAll, showSuccess])
  );

  const handleTabChange = (newIndex: number) => {
    setIndex(newIndex);
  };

  const renderNotesList = (categoryId: string) => {
    const filteredNotes = getFilteredNotes(categoryId);

    if (filteredNotes.length === 0) {
      return (
        <ErrorBoundary componentName="EmptyState">
          <EmptyState
            title="No notes yet"
            message="Tap the + button to create your first note"
            actionText="Create Note"
            onActionPress={handleCreateNote}
          />
        </ErrorBoundary>
      );
    }

    if (viewMode === 'list') {
      return (
        <FlatList
          key="list"
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => handleNotePress(item.id)}
              onLongPress={() => handleLongPress(item.id)}
              onMenuPress={() => handleNoteMenu(item.id)}
              selectionMode={selectionMode}
              isSelected={selectedNoteIds.has(item.id)}
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
        key={`grid-${gridConfig.numColumns}`}
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        numColumns={gridConfig.numColumns}
        renderItem={({ item }) => {
          const background = getBackgroundById(item.color);
          const isGradient = background?.type === 'gradient' && background.gradient && background.gradient.length >= 2;
          const isPattern = background?.type === 'pattern';
          const isSolid = background?.type === 'solid' && background.value;

          // Calculate checklist progress
          const checklistProgress = item.checklist_items && item.checklist_items.length > 0
            ? {
                completed: item.checklist_items.filter(ci => ci.completed).length,
                total: item.checklist_items.length
              }
            : null;

          const cardContent = (
            <>
              <View style={styles.gridContent}>
                {selectionMode ? (
                  <View style={styles.gridSelectionIndicator}>
                    {selectedNoteIds.has(item.id) ? (
                      <CheckCircle2 size={24} color={C.primary} fill={C.primary} />
                    ) : (
                      <Circle size={24} color={C.borderLight} />
                    )}
                  </View>
                ) : (
                  item.is_favorite && (
                    <View style={styles.gridFavorite}>
                      <Text style={styles.gridFavoriteIcon}>⭐</Text>
                    </View>
                  )
                )}

                {item.is_locked ? (
                  <View style={styles.gridLockedContent}>
                    <Lock size={28} color={C.textSecondary} strokeWidth={1.5} />
                    <Text style={[styles.gridLockedText, { color: C.textSecondary }]}>Locked</Text>
                  </View>
                ) : (
                  <>
                    {item.title ? (
                      <Text style={[styles.gridTitle, { color: C.text }]} numberOfLines={3}>
                        {item.title}
                      </Text>
                    ) : null}
                    {item.checklist_items && item.checklist_items.length > 0 ? (
                      <View style={styles.gridChecklist}>
                        {item.checklist_items.slice(0, 2).map((checkItem) => (
                          <View key={checkItem.id} style={styles.gridChecklistItem}>
                            <Text style={[styles.gridChecklistIcon, { color: C.textSecondary }]}>
                              {checkItem.completed ? '☑' : '☐'}
                            </Text>
                            <Text
                              style={[
                                styles.gridChecklistText,
                                { color: C.text },
                                checkItem.completed && { color: C.textSecondary },
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
                        text={item.body.substring(0, 100) + (item.body.length > 100 ? '...' : '')}
                        style={[styles.gridBody, { color: C.textSecondary }] as any}
                        numberOfLines={4}
                      />
                    ) : null}
                  </>
                )}

                {/* Metadata Footer */}
                <View style={[styles.gridMetadataFooter, { borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
                  {checklistProgress && (
                    <View style={styles.gridMetadataItem}>
                      <CheckSquare size={12} color={C.textTertiary} />
                      <Text style={[styles.gridMetadataText, { color: C.textTertiary }]}>
                        {checklistProgress.completed}/{checklistProgress.total}
                      </Text>
                    </View>
                  )}
                  {item.images && item.images.length > 0 && (
                    <View style={styles.gridMetadataItem}>
                      <ImageIcon size={12} color={C.textTertiary} />
                      {item.images.length > 1 && (
                        <Text style={[styles.gridMetadataText, { color: C.textTertiary }]}>{item.images.length}</Text>
                      )}
                    </View>
                  )}
                  {item.audio_recordings && item.audio_recordings.length > 0 && (
                    <View style={styles.gridMetadataItem}>
                      <Mic size={12} color={C.textTertiary} />
                      {item.audio_recordings.length > 1 && (
                        <Text style={[styles.gridMetadataText, { color: C.textTertiary }]}>{item.audio_recordings.length}</Text>
                      )}
                    </View>
                  )}
                  {item.is_locked && (
                    <View style={styles.gridMetadataItem}>
                      <Lock size={12} color={C.textTertiary} />
                    </View>
                  )}
                </View>
              </View>
              {!selectionMode && (
                <Pressable
                  onPress={(e) => {
                    (e as any)?.stopPropagation?.();
                    handleNoteMenu(item.id);
                  }}
                  style={styles.gridMenu}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  android_ripple={{ color: 'transparent' }}
                >
                  <Text style={styles.gridMenuIcon}>⋮</Text>
                </Pressable>
              )}
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

          const isSelected = selectedNoteIds.has(item.id);

          return (
            <View style={[styles.gridItem, { width: gridConfig.itemWidth, padding: gridConfig.gap / 2 }]}>
              {isGradient ? (
                <TouchableOpacity
                  onPress={() => handleNotePress(item.id)}
                  onLongPress={() => handleLongPress(item.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={background.gradient as [string, string, ...string[]]}
                    style={[
                      styles.gridCard,
                      { backgroundColor: C.surface },
                      isSelected && { borderColor: C.primary, borderWidth: 3 }
                    ]}
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
                    { backgroundColor: (isSolid || isPattern) ? (background?.value || C.surface) : C.surface },
                    isSelected && { borderColor: C.primary, borderWidth: 3 }
                  ]}
                  onPress={() => handleNotePress(item.id)}
                  onLongPress={() => handleLongPress(item.id)}
                  activeOpacity={1}
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
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      />
    );
  };

  const renderScene = ({ route }: { route: { key: string; title: string } }) => {
    return (
      <ErrorBoundary componentName={`NotesList-${route.key}`}>
        {renderNotesList(route.key)}
      </ErrorBoundary>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: C.background }]}>
        <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={openDrawer}>
              <Menu size={24} color={C.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: C.text }]}>Notes</Text>
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
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: C.background }]}>
        <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={openDrawer}>
              <Menu size={24} color={C.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: C.text }]}>Notes</Text>
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
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: C.surface, borderBottomColor: C.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={openDrawer}>
            <Menu size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: C.text }]}>Notes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
            <SearchIcon size={24} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSortModal(true)} style={styles.iconButton}>
            <ArrowUpDown size={24} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            style={styles.iconButton}
          >
            {viewMode === 'grid' ? (
              <List size={24} color={C.text} />
            ) : (
              <Grid size={24} color={C.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabViewWrapper}>
        <TabView
          navigationState={{ index, routes: allCategories.map(cat => ({ key: cat.id, title: cat.name })) }}
          renderScene={renderScene}
          onIndexChange={handleTabChange}
          initialLayout={{ width: layout.width }}
          renderTabBar={props => {
            // Get current category color
            const currentCategory = allCategories[index];
            const indicatorColor = currentCategory?.id === 'all'
              ? Colors.light.primary
              : currentCategory?.color || Colors.light.primary;

            return (
              <View style={styles.tabBarContainer}>
                <TabBar
                  {...props}
                  scrollEnabled
                  indicatorStyle={[styles.tabIndicator, { backgroundColor: indicatorColor }]}
                  style={[styles.tabBar, { backgroundColor: C.surface, borderBottomColor: C.borderLight }]}
                  tabStyle={styles.tab}
                  activeColor={indicatorColor}
                  inactiveColor={C.textSecondary}
                  contentContainerStyle={styles.tabBarContent}
                />
                <View style={[styles.addCategoryButton, { backgroundColor: C.surface }]}>
                  <View style={[styles.verticalDivider, { backgroundColor: C.borderLight }]} />
                  <TouchableOpacity
                    style={styles.addCategoryButtonInner}
                    onPress={() => setShowCreateCategoryModal(true)}
                  >
                    <FolderPlus size={20} color={C.text} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Banner Ad at bottom */}
      <View style={[styles.bannerAdContainer, { backgroundColor: C.background }]}>
        <BannerAdComponent
          adType="adaptiveBanner"
          location="home"
          height={50}
        />
      </View>

      {!selectionMode && (
        <FAB
          ref={fabRef}
          onPress={handleCreateNote}
          bottom={insets.bottom + 50 + Spacing.base}
          onLayout={handleFabLayout}
        />
      )}

      {/* Bulk Actions Bottom Bar */}
      {selectionMode && (
        <SafeAreaView edges={['bottom']} style={[styles.bottomActionBar, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <View style={styles.bottomActionBarContent}>
            <TouchableOpacity style={styles.bottomBarButton} onPress={() => handleSelectAll(getFilteredNotes(allCategories[index].id))}>
              <CheckSquare size={20} color={C.text} />
              <Text style={[styles.bottomBarText, { color: C.text }]}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomBarButton} onPress={() => setShowBulkCategoryPicker(true)} disabled={selectedNoteIds.size === 0}>
              <FolderInput size={20} color={selectedNoteIds.size === 0 ? C.textTertiary : C.text} />
              <Text style={[styles.bottomBarText, { color: selectedNoteIds.size === 0 ? C.textTertiary : C.text }]}>
                Move
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomBarButton} onPress={handleBulkArchive} disabled={selectedNoteIds.size === 0}>
              <Archive size={20} color={selectedNoteIds.size === 0 ? C.textTertiary : C.text} />
              <Text style={[styles.bottomBarText, { color: selectedNoteIds.size === 0 ? C.textTertiary : C.text }]}>
                Archive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomBarButton} onPress={handleBulkDelete} disabled={selectedNoteIds.size === 0}>
              <Trash2 size={20} color={selectedNoteIds.size === 0 ? C.textTertiary : C.error} />
              <Text style={[styles.bottomBarText, { color: selectedNoteIds.size === 0 ? C.textTertiary : C.text }]}>
                Delete
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomBarButton} onPress={handleDeselectAll}>
              <X size={20} color={C.text} />
              <Text style={[styles.bottomBarText, { color: C.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      <NoteActionsSheet
        visible={showActionsSheet}
        note={selectedNote}
        onClose={() => setShowActionsSheet(false)}
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onLock={handleLock}
        onDelete={handleDelete}
        onColorChange={handleColorChange}
        onMoveToCategory={handleMoveToCategory}
        categories={categories}
      />

      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
        statusBarTranslucent
      >
        <Pressable style={[styles.sortModalOverlay, { backgroundColor: C.overlay }]} onPress={() => setShowSortModal(false)}>
          <Pressable style={[styles.sortModal, { backgroundColor: C.surface }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.sortModalTitle, { color: C.text }]}>Sort by</Text>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortBy('updated');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.sortOptionText, { color: C.text }]}>Last updated</Text>
              {sortBy === 'updated' && <Check size={20} color={C.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortBy('created');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.sortOptionText, { color: C.text }]}>Date created</Text>
              {sortBy === 'created' && <Check size={20} color={C.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sortOption}
              onPress={() => {
                setSortBy('title');
                setShowSortModal(false);
              }}
            >
              <Text style={[styles.sortOptionText, { color: C.text }]}>Title (A-Z)</Text>
              {sortBy === 'title' && <Check size={20} color={C.primary} />}
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
            <SafeAreaView edges={['bottom']} style={styles.createCategoryModalWrapper} pointerEvents="box-none">
              <Pressable style={styles.createCategoryModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.createCategoryHeader}>
                <Text style={styles.sortModalTitle}>New Folder</Text>
                <TouchableOpacity onPress={() => setShowCreateCategoryModal(false)}>
                  <X size={24} color={Colors.light.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.categoryInput}
                placeholder="Folder name"
                placeholderTextColor={Colors.light.textTertiary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />

              <Text style={styles.colorPickerLabel}>Color</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.colorPicker}
                keyboardShouldPersistTaps="handled"
              >
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
                    activeOpacity={0.7}
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
            </SafeAreaView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bulk Move to Folder Modal */}
      <Modal
        visible={showBulkCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBulkCategoryPicker(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.sortModalOverlay} onPress={() => setShowBulkCategoryPicker(false)}>
          <Pressable style={styles.sortModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.bulkCategoryHeader}>
              <Text style={styles.sortModalTitle}>Move {selectedNoteIds.size} note{selectedNoteIds.size !== 1 ? 's' : ''} to folder</Text>
              <TouchableOpacity onPress={() => setShowBulkCategoryPicker(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bulkCategoryList}>
              {/* None option */}
              <TouchableOpacity
                style={styles.bulkCategoryOption}
                onPress={() => handleBulkMoveToCategory(null)}
              >
                <View style={[styles.bulkCategoryDot, { backgroundColor: Colors.light.textTertiary }]} />
                <Text style={styles.bulkCategoryOptionText}>None</Text>
              </TouchableOpacity>

              {/* Categories */}
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.bulkCategoryOption}
                  onPress={() => handleBulkMoveToCategory(category.id)}
                >
                  <View style={[styles.bulkCategoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.bulkCategoryOptionText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Feature Tour */}
      <FeatureTour
        visible={showHomeTour}
        steps={homeTourSteps}
        currentStepIndex={tourStepIndex}
        onNext={handleTourNext}
        onSkip={handleTourSkip}
        onComplete={handleTourComplete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  bannerAdContainer: {
    width: '100%',
    paddingBottom: Spacing.xs,
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
  tabViewWrapper: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'relative',
  },
  addCategoryButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    zIndex: 10,
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.light.borderLight,
    marginRight: Spacing.sm,
  },
  addCategoryButtonInner: {
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tabBarContent: {
    paddingRight: 60, // Space for folder+ button
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
    height: 3,
    // backgroundColor is set dynamically based on category color
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
    // Width and padding set dynamically via gridConfig
  },
  gridCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 140,
    ...Shadows.md,
  },
  gridCardSelected: {
    borderWidth: 3,
    borderColor: Colors.light.primary,
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
  gridSelectionIndicator: {
    alignSelf: 'flex-start',
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
  gridMetadataFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    flexWrap: 'wrap',
  },
  gridMetadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridMetadataText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textTertiary,
    fontWeight: Typography.fontWeight.medium,
  },
  gridLockedContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.lg,
  },
  gridLockedText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
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
  createCategoryModalWrapper: {
    backgroundColor: 'transparent',
  },
  createCategoryModal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
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
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    ...Shadows.lg,
  },
  bottomActionBarContent: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  bottomBarButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bottomBarText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  bottomBarTextDisabled: {
    color: Colors.light.textTertiary,
  },
  bulkCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  bulkCategoryList: {
    maxHeight: 400,
  },
  bulkCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  bulkCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bulkCategoryOptionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
});
