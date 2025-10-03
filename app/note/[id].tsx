import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MoreVertical,
  Camera,
  Image as ImageIcon,
  Palette,
  ChevronDown,
  X,
  Search,
  Check,
} from 'lucide-react-native';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { BackgroundPicker, getBackgroundById, NoteActionsSheet } from '@/components';
import type { Background } from '@/components';
import { Note } from '@/types';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams();
  const isNewNote = id === 'new';

  const {
    notes,
    categories,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    toggleArchive,
  } = useNotes();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(!isNewNote);

  const currentNoteId = useRef<string | null>(isNewNote ? null : id as string);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);
  const richTextRef = useRef<RichEditor>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);
  const actionNote = useMemo<Note | null>(() => {
    if (!actionNoteId) {
      return null;
    }

    const persisted = notes.find((note) => note.id === actionNoteId);
    if (persisted) {
      return persisted;
    }

    if (actionNoteId !== currentNoteId.current) {
      return null;
    }

    const timestamp = new Date().toISOString();
    return {
      id: actionNoteId,
      title,
      body,
      category_id: selectedCategory,
      color: selectedColor,
      is_favorite: false,
      is_archived: false,
      is_deleted: false,
      images: images.length > 0 ? images : undefined,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }, [actionNoteId, notes, title, body, selectedCategory, selectedColor, images]);

  const currentBackground = useMemo<Background | null>(() => {
    return getBackgroundById(selectedColor);
  }, [selectedColor]);

  const paletteIconColor = useMemo(() => {
    if (!currentBackground) return Colors.light.textSecondary;
    if (currentBackground.type === 'gradient' && currentBackground.gradient) {
      return currentBackground.gradient[0]; // Use first color of gradient
    }
    return currentBackground.value || Colors.light.primary;
  }, [currentBackground]);

  // Load existing note
  useEffect(() => {
    if (!isNewNote && id && !initialLoadDone.current) {
      const note = notes.find((n) => n.id === id);
      if (note) {
        setTitle(note.title);
        setBody(note.body);
        setSelectedCategory(note.category_id);
        setSelectedColor(note.color);
        setImages(note.images || []);
        currentNoteId.current = note.id;
      }
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [id, isNewNote, notes]);

  const handleOpenActionsSheet = useCallback(() => {
    if (!currentNoteId.current) {
      return;
    }
    setActionNoteId(currentNoteId.current);
    setShowActionsSheet(true);
  }, []);

  const handleCloseActionsSheet = useCallback(() => {
    setShowActionsSheet(false);
    setActionNoteId(null);
  }, []);

  const handleFavoriteAction = useCallback(async () => {
    if (!currentNoteId.current) {
      return;
    }
    try {
      await toggleFavorite(currentNoteId.current);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [toggleFavorite]);

  const handleArchiveAction = useCallback(async () => {
    if (!currentNoteId.current) {
      return;
    }
    try {
      await toggleArchive(currentNoteId.current);
      router.back();
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  }, [toggleArchive, router]);

  const handleDeleteAction = useCallback(() => {
    if (!currentNoteId.current) {
      return;
    }

    const noteId = currentNoteId.current;
    Alert.alert(
      'Delete note',
      'Move this note to trash?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(noteId);
              handleCloseActionsSheet();
              router.back();
            } catch (error) {
              console.error('Error deleting note:', error);
            }
          },
        },
      ]
    );
  }, [deleteNote, handleCloseActionsSheet, router]);

  // Helper to strip HTML and check for actual content
  const hasActualContent = (html: string): boolean => {
    const stripped = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace nbsp with space
      .replace(/\s+/g, '') // Remove all whitespace
      .trim();
    return stripped.length > 0;
  };

  // Auto-save function with debouncing
  const saveNote = useCallback(async (
    titleText: string,
    bodyText: string,
    categoryId: string | null,
    color: string | null = null,
    imagesToSave?: string[]
  ) => {
    const imageArray = imagesToSave !== undefined ? imagesToSave : images;
    const hasTitleContent = titleText.trim().length > 0;
    const hasBodyContent = hasActualContent(bodyText);
    const hasImages = imageArray.length > 0;

    console.log('saveNote called:', {
      hasTitleContent,
      hasBodyContent,
      hasImages,
      titleText,
      bodyLength: bodyText.length,
      currentNoteId: currentNoteId.current,
    });

    if (!hasTitleContent && !hasBodyContent && !hasImages) {
      console.log('No content to save, skipping');
      return;
    }

    try {
      if (currentNoteId.current) {
        // Update existing note
        console.log('Updating note:', currentNoteId.current);
        await updateNote(currentNoteId.current, {
          title: titleText,
          body: bodyText,
          category_id: categoryId,
          color: color,
          images: imageArray.length > 0 ? imageArray : undefined,
        });
        console.log('Note updated successfully');
      } else {
        // Create new note
        console.log('Creating new note');
        const newNote = await createNote({
          title: titleText,
          body: bodyText,
          category_id: categoryId,
          color,
          images: imageArray.length > 0 ? imageArray : undefined,
        });
        currentNoteId.current = newNote.id;
        console.log('New note created:', newNote.id);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [createNote, updateNote, images]);

  // Debounced save
  const debouncedSave = useCallback((titleText: string, bodyText: string, categoryId: string | null, color: string | null, imagesToSave?: string[]) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveNote(titleText, bodyText, categoryId, color, imagesToSave);
    }, 300) as any; // 300ms debounce
  }, [saveNote]);

  // Handle text changes
  const handleTitleChange = (text: string) => {
    setTitle(text);
    debouncedSave(text, body, selectedCategory, selectedColor);
  };

  const handleBodyChange = (html: string) => {
    setBody(html);
    debouncedSave(title, html, selectedCategory, selectedColor);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryPicker(false);
    // Save immediately when category changes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, categoryId, selectedColor);
  };

  const handleColorChange = (color: string | null) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    // Save immediately when color changes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, selectedCategory, color);
  };

  // Handle back button
  const handleBack = async () => {
    // Clear any pending save
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      // Do final save if there's content
      if (title.trim() || body.trim()) {
        await saveNote(title, body, selectedCategory, selectedColor);
      }
    }
    router.back();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);



  // Image handling
  const handleCameraPress = async () => {
    try {
      // Request camera permission
      const cameraPermission = await ExpoCamera.Camera.requestCameraPermissionsAsync();

      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);
        debouncedSave(title, body, selectedCategory, selectedColor, newImages);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleImagePickerPress = async () => {
    try {
      // Request media library permission
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        setImages(newImages);
        debouncedSave(title, body, selectedCategory, selectedColor, newImages);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleDeleteImage = (index: number) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
            debouncedSave(title, body, selectedCategory, selectedColor, newImages);
          },
        },
      ]
    );
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render background based on type
  const renderBackgroundWrapper = (children: React.ReactNode) => {
    if (!currentBackground) {
      return <View style={styles.backgroundWrapper}>{children}</View>;
    }

    if (currentBackground.type === 'gradient' && currentBackground.gradient && currentBackground.gradient.length >= 2) {
      return (
        <LinearGradient
          colors={currentBackground.gradient as [string, string, ...string[]]}
          style={styles.backgroundWrapper}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      );
    }

    if (currentBackground.type === 'pattern') {
      return (
        <View style={[styles.backgroundWrapper, { backgroundColor: currentBackground.value || Colors.light.background }]}>
          {currentBackground.pattern === 'grid' && (
            <View style={styles.gridPatternOverlay} />
          )}
          {currentBackground.pattern === 'floral' && (
            <Text style={styles.patternEmojiOverlay}>🌸</Text>
          )}
          {currentBackground.pattern === 'strawberry' && (
            <Text style={styles.patternEmojiOverlay}>🍓</Text>
          )}
          {children}
        </View>
      );
    }

    // Solid color
    return (
      <View style={[styles.backgroundWrapper, { backgroundColor: currentBackground.value || Colors.light.background }]}>
        {children}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notes</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/search')} style={styles.iconButton}>
              <Search size={20} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <Check size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenActionsSheet}
              style={[styles.iconButton, !currentNoteId.current && styles.iconButtonDisabled]}
              disabled={!currentNoteId.current}
            >
              <MoreVertical size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Timestamp & Category Row */}
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
          {categories.length > 0 && (
            <TouchableOpacity
              style={styles.categoryDropdown}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryDropdownText}>
                {selectedCategoryData?.name || 'All'}
              </Text>
              <ChevronDown size={16} color={Colors.light.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Picker Modal */}
      {categories.length > 0 && showCategoryPicker && (
        <Pressable style={styles.categoryModalOverlay} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.categoryModal}>
            <TouchableOpacity
              style={[
                styles.categoryModalOption,
                !selectedCategory && styles.categoryModalOptionActive,
              ]}
              onPress={() => handleCategoryChange(null as any)}
            >
              <Text style={styles.categoryModalOptionText}>All</Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryModalOption,
                  selectedCategory === category.id && styles.categoryModalOptionActive,
                ]}
                onPress={() => handleCategoryChange(category.id)}
              >
                <Text style={styles.categoryModalOptionText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      )}

      {/* Main Content with Background */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {renderBackgroundWrapper(
          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors.light.textTertiary}
              value={title}
              onChangeText={handleTitleChange}
              multiline
            />

            {/* Rich Text Editor */}
            <RichEditor
              ref={richTextRef}
              style={styles.richEditor}
              placeholder="Note here..."
              initialContentHTML={body}
              onChange={handleBodyChange}
              onCursorPosition={(scrollY) => {
                scrollRef.current?.scrollTo({ y: scrollY - 30, animated: true });
              }}
              editorStyle={{
                backgroundColor: 'transparent',
                placeholderColor: Colors.light.textTertiary,
                color: Colors.light.text,
                contentCSSText: `
                  font-size: ${Typography.fontSize.md}px;
                  line-height: ${Typography.fontSize.md * Typography.lineHeight.normal}px;
                  padding: 0;
                  min-height: 200px;
                `,
              }}
              useContainer={true}
              initialFocus={false}
            />

            {/* Images Display */}
            {images.length > 0 && (
              <View style={styles.imagesContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imagesScrollContent}
                >
                  {images.map((imageUri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: imageUri }} style={styles.noteImage} />
                      <TouchableOpacity
                        style={styles.deleteImageButton}
                        onPress={() => handleDeleteImage(index)}
                      >
                        <X size={16} color={Colors.light.surface} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        )}

        {/* RichToolbar - Moves with keyboard */}
        <RichToolbar
          editor={richTextRef}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.setStrikethrough,
            actions.insertBulletsList,
            actions.insertOrderedList,
            'camera',
            'gallery',
            'palette',
            actions.keyboard,
            actions.removeFormat,
            actions.undo,
            actions.redo,
          ]}
          iconMap={{
            camera: () => <Camera size={20} color={Colors.light.text} />,
            gallery: () => <ImageIcon size={20} color={Colors.light.text} />,
            palette: () => <Palette size={20} color={paletteIconColor} />,
          }}
          camera={handleCameraPress}
          gallery={handleImagePickerPress}
          palette={() => setShowColorPicker(true)}
          style={styles.richToolbar}
          selectedIconTint={Colors.light.primary}
          iconTint={Colors.light.text}
          disabledIconTint={Colors.light.textTertiary}
        />
      </KeyboardAvoidingView>

      {/* Background Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
          <Pressable style={styles.backgroundPickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Background</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Check size={24} color={Colors.light.primary} />
              </TouchableOpacity>
            </View>
            <BackgroundPicker selectedBackground={selectedColor} onBackgroundSelect={handleColorChange} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Note Actions Sheet */}
      <NoteActionsSheet
        visible={showActionsSheet && !!actionNote}
        note={actionNote}
        onClose={handleCloseActionsSheet}
        onFavorite={handleFavoriteAction}
        onArchive={handleArchiveAction}
        onDelete={handleDeleteAction}
        onColorChange={handleColorChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backgroundWrapper: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
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
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    flex: 1,
    marginLeft: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timestamp: {
    fontSize: Typography.fontSize.xs,
    color: Colors.light.textSecondary,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryDropdownText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.text,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryModalOverlay: {
    position: 'absolute',
    top: 80,
    right: Spacing.base,
    zIndex: 1000,
  },
  categoryModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xs,
    minWidth: 150,
    ...Shadows.lg,
  },
  categoryModalOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  categoryModalOptionActive: {
    backgroundColor: Colors.light.borderLight,
  },
  categoryModalOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.base,
  },
  titleInput: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  bodyInput: {
    fontSize: Typography.fontSize.md,
    color: Colors.light.text,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
    minHeight: 200,
    paddingTop: Spacing.xs,
  },
  richEditor: {
    minHeight: 200,
    flex: 1,
  },
  richToolbar: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    minHeight: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  backgroundPickerModal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingBottom: Spacing.xl,
    maxHeight: '85%',
    width: '100%',
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.light.text,
  },
  imagesContainer: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  imagesScrollContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  noteImage: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.borderLight,
  },
  deleteImageButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.light.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
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
  },
  patternEmojiOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: 120,
    opacity: 0.1,
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
});
