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
  Keyboard,
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
  FolderPlus,
  Mic,
  CheckSquare,
} from 'lucide-react-native';
import * as ExpoCamera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { isBiometricAvailable } from '@/lib/biometric';
import { BackgroundPicker, getBackgroundById, NoteActionsSheet, ChecklistItem } from '@/components';
import type { Background } from '@/components';
import { Note, ChecklistItem as ChecklistItemType } from '@/types';
import AudioPlayer from '@/components/AudioPlayer';

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
    unlockNote,
    createCategory,
  } = useNotes();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [audioRecordings, setAudioRecordings] = useState<string[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(!isNewNote);

  const currentNoteId = useRef<string | null>(isNewNote ? null : id as string);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);
  const richTextRef = useRef<RichEditor>(null);
  const scrollRef = useRef<ScrollView>(null);
  const titleInputRef = useRef<TextInput>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);
  const keyboardVisibleRef = useRef(false);
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
    const loadNote = async () => {
      if (!isNewNote && id && !initialLoadDone.current) {
        const note = notes.find((n) => n.id === id);
        if (note) {
          setTitle(note.title);

          // If note is locked, require authentication
          if (note.is_locked) {
            const result = await unlockNote(id as string);
            if (result.success && result.decryptedBody) {
              setBody(result.decryptedBody);
            } else {
              // Authentication failed, go back
              Alert.alert(
                'Authentication Failed',
                result.error || 'Could not unlock note',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
              return;
            }
          } else {
            setBody(note.body);
          }

          setSelectedCategory(note.category_id);
          setSelectedColor(note.color);
          setImages(note.images || []);
          setAudioRecordings(note.audio_recordings || []);
          setChecklistItems(note.checklist_items || []);
          setShowChecklist((note.checklist_items || []).length > 0);
          currentNoteId.current = note.id;
        }
        setLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadNote();
  }, [id, isNewNote, notes, unlockNote]);

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

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      // Generate a random color
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newCategory = await createCategory(newCategoryName.trim(), randomColor);

      // Set the newly created category as selected
      setSelectedCategory(newCategory.id);
      setNewCategoryName('');
      setShowNewCategoryModal(false);
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert('Error', 'Failed to create category. Please try again.');
    }
  }, [newCategoryName, createCategory]);

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
    imagesToSave?: string[],
    audioToSave?: string[],
    checklistToSave?: ChecklistItemType[]
  ) => {
    const imageArray = imagesToSave !== undefined ? imagesToSave : images;
    const audioArray = audioToSave !== undefined ? audioToSave : audioRecordings;
    const checklistArray = checklistToSave !== undefined ? checklistToSave : checklistItems;
    const hasTitleContent = titleText.trim().length > 0;
    const hasBodyContent = hasActualContent(bodyText);
    const hasImages = imageArray.length > 0;
    const hasAudio = audioArray.length > 0;
    const hasChecklist = checklistArray.length > 0;

    console.log('saveNote called:', {
      hasTitleContent,
      hasBodyContent,
      hasImages,
      hasAudio,
      hasChecklist,
      titleText,
      bodyLength: bodyText.length,
      currentNoteId: currentNoteId.current,
    });

    if (!hasTitleContent && !hasBodyContent && !hasImages && !hasAudio && !hasChecklist) {
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
          audio_recordings: audioArray.length > 0 ? audioArray : undefined,
          checklist_items: checklistArray.length > 0 ? checklistArray : undefined,
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
          audio_recordings: audioArray.length > 0 ? audioArray : undefined,
          checklist_items: checklistArray.length > 0 ? checklistArray : undefined,
        });
        currentNoteId.current = newNote.id;
        console.log('New note created:', newNote.id);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [createNote, updateNote, images, audioRecordings, checklistItems]);

  // Debounced save
  const debouncedSave = useCallback((titleText: string, bodyText: string, categoryId: string | null, color: string | null, imagesToSave?: string[], audioToSave?: string[], checklistToSave?: ChecklistItemType[]) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveNote(titleText, bodyText, categoryId, color, imagesToSave, audioToSave, checklistToSave);
    }, 300) as any; // 300ms debounce
  }, [saveNote]);

  // Checklist handlers
  const handleToggleChecklist = useCallback(() => {
    if (showChecklist) {
      // Hide checklist
      setShowChecklist(false);
      setChecklistItems([]);
      // Save immediately to remove checklist
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      saveNote(title, body, selectedCategory, selectedColor, images, audioRecordings, []);
    } else {
      // Show checklist with one empty item
      setShowChecklist(true);
      const newItem: ChecklistItemType = {
        id: Date.now().toString(),
        text: '',
        completed: false,
        order: 0,
      };
      setChecklistItems([newItem]);
    }
  }, [showChecklist, title, body, selectedCategory, selectedColor, images, audioRecordings, saveNote]);

  const handleAddChecklistItem = useCallback(() => {
    const newItem: ChecklistItemType = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      order: checklistItems.length,
    };
    const newItems = [...checklistItems, newItem];
    setChecklistItems(newItems);
    debouncedSave(title, body, selectedCategory, selectedColor, images, audioRecordings, newItems);
  }, [checklistItems, title, body, selectedCategory, selectedColor, images, audioRecordings, debouncedSave]);

  const handleToggleChecklistItem = useCallback((itemId: string) => {
    const newItems = checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(newItems);
    debouncedSave(title, body, selectedCategory, selectedColor, images, audioRecordings, newItems);
  }, [checklistItems, title, body, selectedCategory, selectedColor, images, audioRecordings, debouncedSave]);

  const handleChecklistItemTextChange = useCallback((itemId: string, text: string) => {
    const newItems = checklistItems.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    setChecklistItems(newItems);
    debouncedSave(title, body, selectedCategory, selectedColor, images, audioRecordings, newItems);
  }, [checklistItems, title, body, selectedCategory, selectedColor, images, audioRecordings, debouncedSave]);

  const handleDeleteChecklistItem = useCallback((itemId: string) => {
    const newItems = checklistItems.filter((item) => item.id !== itemId);
    setChecklistItems(newItems);

    // If no items left, hide checklist
    if (newItems.length === 0) {
      setShowChecklist(false);
    }

    debouncedSave(title, body, selectedCategory, selectedColor, images, audioRecordings, newItems);
  }, [checklistItems, title, body, selectedCategory, selectedColor, images, audioRecordings, debouncedSave]);

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

  const handleMoveToCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // Save immediately when category changes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, categoryId, selectedColor);
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

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisibleRef.current = true;
    });
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);



  // Audio recording handlers
  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to record audio.');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const newRecordings = [...audioRecordings, uri];
        setAudioRecordings(newRecordings);
        debouncedSave(title, body, selectedCategory, selectedColor, images, newRecordings);
      }

      setRecording(null);
      setShowAudioRecorder(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
    } catch (error) {
      console.error('Error canceling recording:', error);
    }
    setShowAudioRecorder(false);
  };

  const handleDeleteAudio = (index: number) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newRecordings = audioRecordings.filter((_, i) => i !== index);
            setAudioRecordings(newRecordings);
            debouncedSave(title, body, selectedCategory, selectedColor, images, newRecordings);
          },
        },
      ]
    );
  };

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
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <TouchableOpacity
            style={styles.categoryDropdown}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={styles.categoryDropdownText}>
              {selectedCategoryData?.name || 'All'}
            </Text>
            <ChevronDown size={16} color={Colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <Pressable style={styles.categoryModalFullOverlay} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.categoryModalPositioner}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.categoryModal}>
            {/* Add New Category Option */}
            <TouchableOpacity
              style={styles.categoryModalAddOption}
              onPress={() => {
                setShowCategoryPicker(false);
                setShowNewCategoryModal(true);
              }}
            >
              <FolderPlus size={18} color={Colors.light.primary} />
              <Text style={styles.categoryModalAddText}>Add</Text>
            </TouchableOpacity>

            <View style={styles.categoryModalDivider} />

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
          </View>
        </Pressable>
      )}

      {/* Main Content with Background */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
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
              ref={titleInputRef}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors.light.textTertiary}
              value={title}
              onChangeText={handleTitleChange}
              multiline
            />

            {/* Checklist */}
            {showChecklist && (
              <View style={styles.checklistContainer}>
                {checklistItems.map((item, index) => (
                  <ChecklistItem
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    completed={item.completed}
                    onToggle={handleToggleChecklistItem}
                    onTextChange={handleChecklistItemTextChange}
                    onDelete={handleDeleteChecklistItem}
                    autoFocus={index === checklistItems.length - 1 && item.text === ''}
                  />
                ))}
                <TouchableOpacity onPress={handleAddChecklistItem} style={styles.addChecklistItem}>
                  <Text style={styles.addChecklistItemText}>+ Add item</Text>
                </TouchableOpacity>
              </View>
            )}

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
                  -webkit-user-select: text;
                  user-select: text;
                  -webkit-touch-callout: default;
                `,
              }}
              useContainer={true}
              initialFocus={false}
              pasteAsPlainText={false}
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

            {/* Audio Recordings Display */}
            {audioRecordings.length > 0 && (
              <View style={styles.audioContainer}>
                {audioRecordings.map((audioUri, index) => (
                  <AudioPlayer
                    key={index}
                    uri={audioUri}
                    index={index}
                    onDelete={() => handleDeleteAudio(index)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* RichToolbar - Moves with keyboard */}
        <View style={styles.toolbarContainer}>
          <RichToolbar
            editor={richTextRef}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.insertBulletsList,
              actions.insertOrderedList,
              'checklist',
              'camera',
              'gallery',
              'microphone',
              'palette',
              actions.keyboard,
              actions.removeFormat,
              actions.undo,
              actions.redo,
            ]}
            iconMap={{
              checklist: () => <CheckSquare size={20} color={showChecklist ? Colors.light.primary : Colors.light.text} />,
              camera: () => <Camera size={20} color={Colors.light.text} />,
              gallery: () => <ImageIcon size={20} color={Colors.light.text} />,
              microphone: () => <Mic size={20} color={Colors.light.text} />,
              palette: () => <Palette size={20} color={paletteIconColor} />,
            }}
            checklist={handleToggleChecklist}
            camera={handleCameraPress}
            gallery={handleImagePickerPress}
            microphone={() => setShowAudioRecorder(true)}
            palette={() => setShowColorPicker(true)}
            style={styles.richToolbar}
            selectedIconTint={Colors.light.primary}
            iconTint={Colors.light.text}
            disabledIconTint={Colors.light.textTertiary}
          />
        </View>
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
        onMoveToCategory={handleMoveToCategory}
        categories={categories}
      />

      {/* New Category Modal */}
      <Modal
        visible={showNewCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewCategoryModal(false)}
      >
        <Pressable
          style={styles.newCategoryOverlay}
          onPress={() => {
            setShowNewCategoryModal(false);
            setNewCategoryName('');
          }}
        >
          <Pressable style={styles.newCategoryModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.newCategoryHeader}>
              <Text style={styles.newCategoryTitle}>New Category</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.newCategoryInput}
              placeholder="Category name"
              placeholderTextColor={Colors.light.textTertiary}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateCategory}
            />

            <View style={styles.newCategoryActions}>
              <TouchableOpacity
                style={styles.newCategoryCancelButton}
                onPress={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.newCategoryCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.newCategoryCreateButton}
                onPress={handleCreateCategory}
              >
                <Text style={styles.newCategoryCreateText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Audio Recording Modal */}
      <Modal
        visible={showAudioRecorder}
        transparent
        animationType="fade"
        onRequestClose={cancelRecording}
      >
        <View style={styles.audioRecorderOverlay}>
          <View style={styles.audioRecorderModal}>
            <View style={styles.audioRecorderHeader}>
              <Text style={styles.audioRecorderTitle}>
                {recording ? 'Recording...' : 'Record Audio'}
              </Text>
              <TouchableOpacity onPress={cancelRecording}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.audioRecorderContent}>
              {recording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording in progress...</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recording && styles.recordButtonActive,
                ]}
                onPress={recording ? stopRecording : startRecording}
              >
                <Mic size={32} color={Colors.light.surface} />
              </TouchableOpacity>

              <Text style={styles.recordHint}>
                {recording ? 'Tap to stop recording' : 'Tap to start recording'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  categoryModalFullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  categoryModalPositioner: {
    position: 'absolute',
    top: 100,
    right: Spacing.base,
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
  categoryModalAddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  categoryModalAddText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryModalDivider: {
    height: 1,
    backgroundColor: Colors.light.borderLight,
    marginVertical: Spacing.xs,
  },
  newCategoryOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  newCategoryModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  newCategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  newCategoryTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  newCategoryInput: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  newCategoryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  newCategoryCancelButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  newCategoryCancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  newCategoryCreateButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primary,
  },
  newCategoryCreateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.surface,
    fontWeight: Typography.fontWeight.semibold,
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
  toolbarContainer: {
    backgroundColor: Colors.light.surface,
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
  audioContainer: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  audioRecorderOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  audioRecorderModal: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  audioRecorderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  audioRecorderTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
  },
  audioRecorderContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.error,
  },
  recordingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.error,
    fontWeight: Typography.fontWeight.medium,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  recordButtonActive: {
    backgroundColor: Colors.light.error,
  },
  recordHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.light.textSecondary,
  },
  checklistContainer: {
    marginBottom: Spacing.base,
  },
  addChecklistItem: {
    paddingVertical: Spacing.sm,
    paddingLeft: 28, // Align with checkbox items
  },
  addChecklistItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeight.medium,
  },
});
