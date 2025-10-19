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
import { Camera, Image as ImageIcon, Palette, Check, Mic, CheckSquare, ScanText, FileText, Calculator, Layout, Bell } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNotes } from '@/lib/NotesContext';
import { useToast } from '@/lib/ToastContext';
import { useFeatureTour } from '@/lib/FeatureTourContext';
import { BackgroundPicker, getBackgroundById, NoteActionsSheet, ChecklistItem, DocumentScanner, TextExtractor, FeatureTour, TemplatePicker } from '@/components';
import { SmartCalculationPanel } from '@/components/SmartCalculationPanel';
import type { DocumentScanResult, OCRResult } from '@/components';
import { Note } from '@/types';
import AudioPlayer from '@/components/AudioPlayer';
import {
  NoteEditorHeader,
  CategoryPickerDropdown,
  NewCategoryModal,
  AudioRecorderModal,
  ImagePreviewModal,
  BackgroundWrapper,
} from '@/components/NoteEditor';
import {
  useAutoSave,
  useImageManager,
  useAudioRecorder,
  useChecklistManager,
} from '@/hooks/useNoteEditor';
import { authenticateWithBiometrics } from '@/lib/biometric';
import { getEditorTourSteps } from '@/components/tours/editorTourSteps';
import { detectNumbers, calculateStats, shouldShowCalculation, formatNumber } from '@/lib/smartCalculation';
import type { CalculationStats } from '@/lib/smartCalculation';
import { storage } from '@/lib/mmkvStorage';

export default function NoteEditorScreen() {
  const { id, mode, category } = useLocalSearchParams();
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
  const { showInfo } = useToast();
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];
  const { shouldShowEditorTour, setEditorTourCompleted } = useFeatureTour();

  // State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);
  const [showTextExtractor, setShowTextExtractor] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [loading, setLoading] = useState(!isNewNote);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);

  // Feature Tour state
  const [showEditorTour, setShowEditorTour] = useState(false);
  const [editorTourStepIndex, setEditorTourStepIndex] = useState(0);
  const toolbarRef = useRef<View>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const editorTourSteps = useMemo(() => {
    if (!toolbarPosition) return [];
    return getEditorTourSteps(toolbarPosition);
  }, [toolbarPosition]);

  // Smart Calculation state
  const [smartCalcEnabled, setSmartCalcEnabled] = useState(() => {
    return storage.getBoolean('smartCalcEnabled') ?? false;
  });
  const [calculationStats, setCalculationStats] = useState<CalculationStats | null>(null);
  const [showCalculationPanel, setShowCalculationPanel] = useState(false);

  // Refs
  const richTextRef = useRef<RichEditor>(null);
  const scrollRef = useRef<ScrollView>(null);
  const initialLoadDone = useRef(false);
  const [editorReady, setEditorReady] = useState(false);
  const focusAttemptsRef = useRef(0);

  const focusEditorSafely = useCallback(() => {
    const tryFocus = () => {
      try {
        richTextRef.current?.focusContentEditor?.();
      } catch (e) {
        // ignore
      }
      // Retry a few times to ensure keyboard opens
      focusAttemptsRef.current += 1;
      if (focusAttemptsRef.current < 4) {
        setTimeout(() => {
          try { richTextRef.current?.focusContentEditor?.(); } catch {}
        }, 60);
      }
    };
    requestAnimationFrame(tryFocus);
  }, []);

  // Auto-save hook
  const { currentNoteId, debouncedSave, immediateSave, cleanup, hasActualContent } = useAutoSave({
    createNote,
    updateNote,
  });

  // Image manager hook
  const imageManager = useImageManager({
    onImagesChange: (newImages) => {
      debouncedSave({
        title,
        body,
        categoryId: selectedCategory,
        color: selectedColor,
        images: newImages,
        audioRecordings: audioRecorder.audioRecordings,
        checklistItems: checklistManager.checklistItems,
      });
    },
    onImageAdded: () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    },
  });

  // Audio recorder hook
  const audioRecorder = useAudioRecorder({
    onAudioRecordingsChange: (newRecordings) => {
      debouncedSave({
        title,
        body,
        categoryId: selectedCategory,
        color: selectedColor,
        images: imageManager.images,
        audioRecordings: newRecordings,
        checklistItems: checklistManager.checklistItems,
      });
    },
    onAudioAdded: () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    },
  });

  // Checklist manager hook
  const checklistManager = useChecklistManager({
    onChecklistChange: (newItems) => {
      debouncedSave({
        title,
        body,
        categoryId: selectedCategory,
        color: selectedColor,
        images: imageManager.images,
        audioRecordings: audioRecorder.audioRecordings,
        checklistItems: newItems,
      });
    },
  });

  // Computed values
  const currentBackground = useMemo(() => getBackgroundById(selectedColor), [selectedColor]);

  const paletteIconColor = useMemo(() => {
    if (!currentBackground) return C.textSecondary;
    if (currentBackground.type === 'gradient' && currentBackground.gradient) {
      return currentBackground.gradient[0];
    }
    return currentBackground.value || C.primary;
  }, [currentBackground, C]);

  const actionNote = useMemo<Note | null>(() => {
    if (!actionNoteId) return null;

    const persisted = notes.find((note) => note.id === actionNoteId);
    if (persisted) return persisted;

    if (actionNoteId !== currentNoteId.current) return null;

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
      images: imageManager.images.length > 0 ? imageManager.images : undefined,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }, [actionNoteId, notes, title, body, selectedCategory, selectedColor, imageManager.images]);

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  // Reset state when changing to a different note id (new or existing)
  useEffect(() => {
    initialLoadDone.current = false;
    // Reset editor state; we'll repopulate below
    setTitle('');
    setBody('');
    setSelectedCategory(null);
    setSelectedColor(null);
    imageManager.setImages([]);
    audioRecorder.setAudioRecordings([]);
    checklistManager.setChecklistItems([]);
    checklistManager.setShowChecklist(false);
    currentNoteId.current = null;
    setLoading(!isNewNote);
  }, [id, isNewNote]);

  // Load note content once per id
  useEffect(() => {
    const run = async () => {
      if (initialLoadDone.current) return;
      if (!isNewNote && id) {
        const note = notes.find((n) => n.id === id);
        if (note) {
          setTitle(note.title);
          if (note.is_locked) {
            const result = await unlockNote(id as string);
            if (result.success && typeof result.decryptedBody === 'string') {
              setBody(result.decryptedBody);
            } else {
              const err = (result.error || '').toLowerCase();
              const cancelled = err.includes('cancel');
              if (cancelled) {
                showInfo('Unlock cancelled');
                router.back();
                return;
              }
              Alert.alert('Could not unlock', 'Please try again.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
              return;
            }
          } else {
            setBody(note.body);
          }
          setSelectedCategory(note.category_id);
          setSelectedColor(note.color);
          imageManager.setImages(note.images || []);
          audioRecorder.setAudioRecordings(note.audio_recordings || []);
          checklistManager.setChecklistItems(note.checklist_items || []);
          checklistManager.setShowChecklist((note.checklist_items || []).length > 0);
          currentNoteId.current = note.id;
        }
        setLoading(false);
        initialLoadDone.current = true;
      }

      if (isNewNote && !initialLoadDone.current) {
        // Preselect category if provided
        if (typeof category === 'string' && category !== 'all') {
          const exists = categories.some(c => c.id === category);
          setSelectedCategory(exists ? category : null);
        }
        setLoading(false);
        initialLoadDone.current = true;
      }
    };
    run();
  }, [id, isNewNote, notes, unlockNote, category, categories]);

  // Focus editor when it is ready
  useEffect(() => {
    if (!loading && editorReady) {
      focusAttemptsRef.current = 0;
      focusEditorSafely();
    }
  }, [loading, editorReady, focusEditorSafely]);

  // Handle optional mode actions for new notes after initial load
  useEffect(() => {
    if (!isNewNote) return;
    if (!initialLoadDone.current) return;
    if (mode === 'photo') {
      setTimeout(() => imageManager.handleImagePickerPress(), 200);
    } else if (mode === 'audio') {
      setTimeout(() => audioRecorder.openRecorder(), 200);
    } else if (mode === 'checklist') {
      setTimeout(() => checklistManager.handleToggleChecklist(), 200);
    } else if (mode === 'scan') {
      setShowDocumentScanner(true);
    } else if (mode === 'ocr') {
      setShowTextExtractor(true);
    }
  }, [isNewNote, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Measure toolbar position for tour
  useEffect(() => {
    if (!loading && editorReady && toolbarRef.current) {
      const timer = setTimeout(() => {
        toolbarRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
          setToolbarPosition({ x, y, width, height });
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, editorReady]);

  // Show editor tour for new notes if needed
  useEffect(() => {
    if (!loading && editorReady && isNewNote && shouldShowEditorTour() && toolbarPosition) {
      // Delay to let toolbar render
      const timer = setTimeout(() => setShowEditorTour(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, editorReady, isNewNote, shouldShowEditorTour, toolbarPosition]);

  const handleEditorTourNext = () => {
    setEditorTourStepIndex((prev) => prev + 1);
  };

  const handleEditorTourSkip = () => {
    setShowEditorTour(false);
    setEditorTourStepIndex(0);
    setEditorTourCompleted();
  };

  const handleEditorTourComplete = () => {
    setShowEditorTour(false);
    setEditorTourStepIndex(0);
    setEditorTourCompleted();
  };

  // Smart Calculation Functions
  const updateCalculation = useCallback((text: string) => {
    if (!text) {
      setCalculationStats(null);
      setShowCalculationPanel(false);
      return;
    }

    const numbers = detectNumbers(text);
    const stats = calculateStats(numbers);

    if (stats && shouldShowCalculation(text)) {
      setCalculationStats(stats);
      setShowCalculationPanel(true);
    } else {
      setCalculationStats(null);
      setShowCalculationPanel(false);
    }
  }, []);

  const toggleSmartCalc = useCallback(() => {
    const newValue = !smartCalcEnabled;
    setSmartCalcEnabled(newValue);
    storage.set('smartCalcEnabled', newValue);

    if (newValue) {
      // Enabled - calculate immediately
      updateCalculation(body);
      showInfo('Smart calculation enabled');
    } else {
      // Disabled - hide panel
      setCalculationStats(null);
      setShowCalculationPanel(false);
      showInfo('Smart calculation disabled');
    }
  }, [smartCalcEnabled, body, updateCalculation, showInfo]);

  const handleCalculationCopy = useCallback(() => {
    showInfo('Calculation copied to clipboard');
  }, [showInfo]);

  const handleCalculationDismiss = useCallback(() => {
    setShowCalculationPanel(false);
  }, []);

  const handleInsertTotal = useCallback(() => {
    if (!calculationStats) return;

    // Format the total line
    const totalLine = `\n<p><strong>Total: ${formatNumber(calculationStats.sum)}</strong></p>`;
    const newBody = body + totalLine;

    // Update body
    setBody(newBody);
    richTextRef.current?.setContentHTML(newBody);

    // Save immediately
    immediateSave({
      title,
      body: newBody,
      categoryId: selectedCategory,
      color: selectedColor,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });

    // Scroll to end to show the added total
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);

    // Show feedback
    showInfo('Total added to note');
  }, [calculationStats, body, title, selectedCategory, selectedColor, imageManager.images, audioRecorder.audioRecordings, checklistManager.checklistItems, immediateSave, showInfo]);

  // Update calculation when smart calc is enabled and body changes
  useEffect(() => {
    if (smartCalcEnabled && body) {
      updateCalculation(body);
    }
  }, [smartCalcEnabled, body, updateCalculation]);

  // Handlers
  const handleTitleChange = (text: string) => {
    setTitle(text);
    debouncedSave({
      title: text,
      body,
      categoryId: selectedCategory,
      color: selectedColor,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });
  };

  const handleBodyChange = (html: string) => {
    setBody(html);

    // Update smart calculation if enabled
    if (smartCalcEnabled) {
      updateCalculation(html);
    }

    debouncedSave({
      title,
      body: html,
      categoryId: selectedCategory,
      color: selectedColor,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setShowCategoryPicker(false);
    immediateSave({
      title,
      body,
      categoryId,
      color: selectedColor,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });
  };

  const handleColorChange = (color: string | null) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    immediateSave({
      title,
      body,
      categoryId: selectedCategory,
      color,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });
  };

  const handleBack = async () => {
    // Try to fetch freshest HTML from editor to avoid losing last keystrokes
    let latestBody = body;
    try {
      const anyRef: any = richTextRef.current as any;
      if (anyRef?.getContentHtml) {
        const html = await anyRef.getContentHtml();
        if (typeof html === 'string') latestBody = html;
      }
    } catch {}

    // Always attempt an immediate save; saveNote will skip if truly empty
    await immediateSave({
      title,
      body: latestBody,
      categoryId: selectedCategory,
      color: selectedColor,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });

    router.back();
  };

  const handleOpenActionsSheet = useCallback(() => {
    if (currentNoteId.current) {
      setActionNoteId(currentNoteId.current);
      setShowActionsSheet(true);
    }
  }, []);

  const handleCloseActionsSheet = useCallback(() => {
    setShowActionsSheet(false);
    setActionNoteId(null);
  }, []);

  const handleFavoriteAction = useCallback(async () => {
    if (currentNoteId.current) {
      await toggleFavorite(currentNoteId.current);
    }
  }, [toggleFavorite]);

  const handleArchiveAction = useCallback(async () => {
    if (currentNoteId.current) {
      await toggleArchive(currentNoteId.current);
      router.back();
    }
  }, [toggleArchive]);

  const handleDeleteAction = useCallback(() => {
    if (!currentNoteId.current) return;

    const noteId = currentNoteId.current;
    const persisted = notes.find(n => n.id === noteId);

    const proceed = () => {
      Alert.alert('Delete note', 'Move this note to trash?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(noteId);
            handleCloseActionsSheet();
            router.back();
          },
        },
      ]);
    };

    const maybeAuth = async () => {
      if (persisted?.is_locked) {
        const auth = await authenticateWithBiometrics('Authenticate to delete note');
        if (!auth.success) {
          const err = (auth.error || '').toLowerCase();
          if (err.includes('cancel')) {
            showInfo('Delete cancelled');
            handleCloseActionsSheet();
            return;
          }
          Alert.alert('Authentication required', 'Could not verify identity.');
          return;
        }
      }
      proceed();
    };

    void maybeAuth();
  }, [deleteNote, handleCloseActionsSheet, notes, showInfo]);

  const handleCreateCategory = useCallback(async (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newCategory = await createCategory(name, randomColor);
    setSelectedCategory(newCategory.id);
    setShowNewCategoryModal(false);
  }, [createCategory]);

  const handleDocumentScanComplete = (result: DocumentScanResult) => {
    const newImages = [...imageManager.images, result.imageUri];
    imageManager.setImages(newImages);
    immediateSave({
      title,
      body,
      categoryId: selectedCategory,
      color: selectedColor,
      images: newImages,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const handleTextExtractComplete = (result: OCRResult) => {
    const newImages = [...imageManager.images, result.imageUri];
    const extractedText = `\n\n<p><strong>Extracted Text:</strong></p>\n<p>${result.text.replace(/\n/g, '<br>')}</p>`;
    const newBody = body + extractedText;

    imageManager.setImages(newImages);
    setBody(newBody);
    richTextRef.current?.setContentHTML(newBody);

    immediateSave({
      title,
      body: newBody,
      categoryId: selectedCategory,
      color: selectedColor,
      images: newImages,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  const handleTemplateSelect = (templateContent: string) => {
    // Replace existing body with template
    setBody(templateContent);
    richTextRef.current?.setContentHTML(templateContent);

    // Save immediately
    immediateSave({
      title,
      body: templateContent,
      categoryId: selectedCategory,
      color: selectedColor,
      images: imageManager.images,
      audioRecordings: audioRecorder.audioRecordings,
      checklistItems: checklistManager.checklistItems,
    });

    showInfo('Template applied');
  };

  const handleOpenTemplatePicker = () => {
    Keyboard.dismiss();
    // Wait for keyboard to dismiss before showing modal
    setTimeout(() => {
      setShowTemplatePicker(true);
    }, 300);
  };

  const handleOpenReminderPicker = () => {
    Keyboard.dismiss();
    // Wait for keyboard to dismiss before showing modal
    setTimeout(() => {
      setShowReminderPicker(true);
    }, 300);
  };

  const handleToggleChecklistWithSave = useCallback(() => {
    checklistManager.handleToggleChecklist();
    if (checklistManager.showChecklist) {
      // Hiding checklist - save immediately with empty array
      immediateSave({
        title,
        body,
        categoryId: selectedCategory,
        color: selectedColor,
        images: imageManager.images,
        audioRecordings: audioRecorder.audioRecordings,
        checklistItems: [],
      });
    }
  }, [checklistManager, title, body, selectedCategory, selectedColor, imageManager.images, audioRecorder.audioRecordings, immediateSave]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <NoteEditorHeader
        onBack={handleBack}
        onSearch={() => router.push('/search')}
        onMore={handleOpenActionsSheet}
        categoryName={selectedCategoryData?.name || null}
        onCategoryPress={() => setShowCategoryPicker(!showCategoryPicker)}
        hasNoteId={!!currentNoteId.current}
      />

      {/* Category Picker */}
      <CategoryPickerDropdown
        visible={showCategoryPicker}
        categories={categories}
        selectedCategory={selectedCategory}
        onClose={() => setShowCategoryPicker(false)}
        onSelectCategory={handleCategoryChange}
        onAddCategory={() => {
          setShowCategoryPicker(false);
          setShowNewCategoryModal(true);
        }}
      />

      {/* Main Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <BackgroundWrapper background={currentBackground}>
          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={[styles.titleInput, { color: C.text }]}
              placeholder="Title"
              placeholderTextColor={C.textTertiary}
              value={title}
              onChangeText={handleTitleChange}
              multiline
            />

            {/* Checklist */}
            {checklistManager.showChecklist && (
              <View style={styles.checklistContainer}>
                {checklistManager.checklistItems.map((item, index) => (
                  <ChecklistItem
                    key={item.id}
                    id={item.id}
                    text={item.text}
                    completed={item.completed}
                    onToggle={checklistManager.handleToggleChecklistItem}
                    onTextChange={checklistManager.handleChecklistItemTextChange}
                    onDelete={checklistManager.handleDeleteChecklistItem}
                    autoFocus={index === checklistManager.checklistItems.length - 1 && item.text === ''}
                  />
                ))}
                <TouchableOpacity onPress={checklistManager.handleAddChecklistItem} style={styles.addChecklistItem}>
                  <Text style={styles.addChecklistItemText}>+ Add item</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Rich Text Editor */}
            {!loading && (
              <RichEditor
                ref={richTextRef}
                style={styles.richEditor}
                placeholder="Note here..."
                initialContentHTML={body}
                onChange={handleBodyChange}
                editorInitializedCallback={() => setEditorReady(true)}
                onCursorPosition={(scrollY) => {
                  scrollRef.current?.scrollTo({ y: scrollY - 30, animated: true });
                }}
                editorStyle={{
                  backgroundColor: 'transparent',
                  placeholderColor: C.textTertiary,
                  color: C.text,
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
            )}

            {/* Images Display */}
            {imageManager.images.length > 0 && (
              <View style={styles.imagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesScrollContent}>
                  {imageManager.images.map((imageUri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <TouchableOpacity onPress={() => imageManager.handleImagePress(index)} activeOpacity={0.8}>
                        <Image source={{ uri: imageUri }} style={styles.noteImage} resizeMode="cover" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteImageButton} onPress={() => imageManager.handleDeleteImage(index)}>
                        <Text style={styles.deleteImageButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Audio Recordings */}
            {audioRecorder.audioRecordings.length > 0 && (
              <View style={styles.audioContainer}>
                {audioRecorder.audioRecordings.map((audioUri, index) => (
                  <AudioPlayer key={index} uri={audioUri} index={index} onDelete={() => audioRecorder.handleDeleteAudio(index)} />
                ))}
              </View>
            )}
          </ScrollView>
        </BackgroundWrapper>

        {/* Smart Calculation Panel - positioned above toolbar */}
        <SmartCalculationPanel
          stats={calculationStats}
          visible={showCalculationPanel}
          onDismiss={handleCalculationDismiss}
          onCopy={handleCalculationCopy}
          onInsertTotal={handleInsertTotal}
        />

        {/* Toolbar */}
        <View ref={toolbarRef} style={styles.toolbarContainer} collapsable={false}>
          <RichToolbar
            editor={richTextRef}
            actions={[
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.insertBulletsList,
              actions.insertOrderedList,
              'template',
              'smartcalc',
              'checklist',
              'reminder',
              'scanner',
              'ocr',
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
              template: () => <Layout size={20} color={C.text} />,
              smartcalc: () => <Calculator size={20} color={smartCalcEnabled ? C.primary : C.text} />,
              checklist: () => <CheckSquare size={20} color={checklistManager.showChecklist ? C.primary : C.text} />,
              reminder: () => <Bell size={20} color={C.text} />,
              scanner: () => <ScanText size={20} color={C.text} />,
              ocr: () => <FileText size={20} color={C.text} />,
              camera: () => <Camera size={20} color={C.text} />,
              gallery: () => <ImageIcon size={20} color={C.text} />,
              microphone: () => <Mic size={20} color={C.text} />,
              palette: () => <Palette size={20} color={paletteIconColor} />,
            }}
            template={handleOpenTemplatePicker}
            smartcalc={toggleSmartCalc}
            checklist={handleToggleChecklistWithSave}
            reminder={handleOpenReminderPicker}
            scanner={() => setShowDocumentScanner(true)}
            ocr={() => setShowTextExtractor(true)}
            camera={imageManager.handleCameraPress}
            gallery={imageManager.handleImagePickerPress}
            microphone={audioRecorder.openRecorder}
            palette={() => setShowColorPicker(true)}
            style={styles.richToolbar}
            selectedIconTint={C.primary}
            iconTint={C.text}
            disabledIconTint={C.textTertiary}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      <Modal visible={showColorPicker} transparent animationType="slide" onRequestClose={() => setShowColorPicker(false)} statusBarTranslucent>
        <Pressable style={[styles.modalOverlay, { backgroundColor: C.overlay }]} onPress={() => setShowColorPicker(false)}>
          <Pressable style={[styles.backgroundPickerModal, { backgroundColor: C.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Choose Background</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Check size={24} color={C.primary} />
              </TouchableOpacity>
            </View>
            <BackgroundPicker selectedBackground={selectedColor} onBackgroundSelect={handleColorChange} />
          </Pressable>
        </Pressable>
      </Modal>

      <NoteActionsSheet
        visible={showActionsSheet && !!actionNote}
        note={actionNote}
        onClose={handleCloseActionsSheet}
        onFavorite={handleFavoriteAction}
        onArchive={handleArchiveAction}
        onDelete={handleDeleteAction}
        onColorChange={handleColorChange}
        onMoveToCategory={handleCategoryChange}
        categories={categories}
      />

      <NewCategoryModal visible={showNewCategoryModal} onClose={() => setShowNewCategoryModal(false)} onCreate={handleCreateCategory} />

      <AudioRecorderModal
        visible={audioRecorder.showAudioRecorder}
        recording={audioRecorder.recording}
        onClose={audioRecorder.cancelRecording}
        onStartRecording={audioRecorder.startRecording}
        onStopRecording={audioRecorder.stopRecording}
      />

      <DocumentScanner visible={showDocumentScanner} onClose={() => setShowDocumentScanner(false)} onScanComplete={handleDocumentScanComplete} />

      <TextExtractor visible={showTextExtractor} onClose={() => setShowTextExtractor(false)} onExtractComplete={handleTextExtractComplete} />

      <ImagePreviewModal
        visible={imageManager.previewImageUri !== null}
        images={imageManager.images}
        currentIndex={imageManager.previewImageIndex}
        flatListRef={imageManager.imagePreviewFlatListRef}
        onClose={imageManager.handleClosePreview}
        onDelete={imageManager.handleDeleteImageFromPreview}
        onCrop={imageManager.handleCropImage}
        onSwipe={imageManager.handleImageSwipe}
      />

      {/* Feature Tour */}
      <FeatureTour
        visible={showEditorTour}
        steps={editorTourSteps}
        currentStepIndex={editorTourStepIndex}
        onNext={handleEditorTourNext}
        onSkip={handleEditorTourSkip}
        onComplete={handleEditorTourComplete}
      />

      {/* Template Picker */}
      <TemplatePicker
        visible={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Reminder Picker - Placeholder */}
      <Modal
        visible={showReminderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReminderPicker(false)}
        statusBarTranslucent
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: C.overlay }]}
          onPress={() => setShowReminderPicker(false)}
        >
          <Pressable
            style={[styles.backgroundPickerModal, { backgroundColor: C.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Bell size={24} color={C.primary} />
                <Text style={[styles.modalTitle, { color: C.text }]}>Set Reminder</Text>
              </View>
              <TouchableOpacity onPress={() => setShowReminderPicker(false)}>
                <Check size={24} color={C.primary} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
              <Bell size={64} color={C.textTertiary} style={{ marginBottom: Spacing.lg }} />
              <Text style={[styles.modalTitle, { color: C.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
                Reminder Feature Coming Soon
              </Text>
              <Text style={{ color: C.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }}>
                Set reminders for your notes to get notified at the right time.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: C.primary,
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.md,
                  borderRadius: BorderRadius.lg,
                }}
                onPress={() => setShowReminderPicker(false)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: Typography.fontWeight.semibold }}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.base,
    paddingBottom: 80,
  },
  titleInput: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.base,
    paddingVertical: Spacing.xs,
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
  },
  deleteImageButtonText: {
    color: Colors.light.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  audioContainer: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  checklistContainer: {
    marginBottom: Spacing.base,
  },
  addChecklistItem: {
    paddingVertical: Spacing.sm,
    paddingLeft: 28,
  },
  addChecklistItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.primary,
    fontWeight: Typography.fontWeight.medium,
  },
});
