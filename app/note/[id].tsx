import { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, MoveVertical as MoreVertical, Camera, Image as ImageIcon, SquareCheck as CheckSquare, Mic, PenTool, Palette, Undo, Redo, ChevronDown, X, Trash2, Bold, Italic, List, ListOrdered } from 'lucide-react-native';
import * as ExpoCamera from 'expo-camera';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { ColorPicker, ChecklistItemComponent } from '@/components';
import { Note, ChecklistItem } from '@/types';
import { generateUUID } from '@/lib/storage';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams();
  const isNewNote = id === 'new';

  const { notes, categories, createNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isChecklistMode, setIsChecklistMode] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [loading, setLoading] = useState(!isNewNote);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentNoteId = useRef<string | null>(isNewNote ? null : id as string);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);
  const bodyInputRef = useRef<TextInput>(null);
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });

  // Load existing note
  useEffect(() => {
    if (!isNewNote && id && !initialLoadDone.current) {
      const note = notes.find((n) => n.id === id);
      if (note) {
        setTitle(note.title);
        setBody(note.body);
        setSelectedCategory(note.category_id);
        setSelectedColor(note.color);
        setChecklistItems(note.checklist_items || []);
        setIsChecklistMode((note.checklist_items || []).length > 0);
        currentNoteId.current = note.id;
      }
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [id, isNewNote, notes]);

  // Auto-save function with debouncing
  const saveNote = useCallback(async (
    titleText: string,
    bodyText: string,
    categoryId: string | null,
    color: string | null = null,
    checklist: ChecklistItem[] = []
  ) => {
    // Don't save if both title and body are empty and no checklist items
    if (!titleText.trim() && !bodyText.trim() && checklist.length === 0) {
      return;
    }

    try {
      setSaving(true);

      if (currentNoteId.current) {
        // Update existing note
        await updateNote(currentNoteId.current, {
          title: titleText,
          body: bodyText,
          category_id: categoryId,
          color: color,
          checklist_items: checklist.length > 0 ? checklist : undefined,
        });
      } else {
        // Create new note - need to update createNote to support checklist_items
        const newNote = await createNote(titleText, bodyText, categoryId, color);
        // Update with checklist items if any
        if (checklist.length > 0) {
          await updateNote(newNote.id, { checklist_items: checklist });
        }
        currentNoteId.current = newNote.id;
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  }, [createNote, updateNote]);

  // Debounced save
  const debouncedSave = useCallback((titleText: string, bodyText: string, categoryId: string | null, color: string | null, checklist: ChecklistItem[]) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveNote(titleText, bodyText, categoryId, color, checklist);
    }, 300) as any; // 300ms debounce
  }, [saveNote]);

  // Handle text changes
  const handleTitleChange = (text: string) => {
    setTitle(text);
    debouncedSave(text, body, selectedCategory, selectedColor, checklistItems);
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    debouncedSave(title, text, selectedCategory, selectedColor, checklistItems);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryPicker(false);
    // Save immediately when category changes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, categoryId, selectedColor, checklistItems);
  };

  const handleColorChange = (color: string | null) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    // Save immediately when color changes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, selectedCategory, color, checklistItems);
  };

  // Checklist handlers
  const handleToggleChecklistMode = () => {
    setIsChecklistMode(!isChecklistMode);
    if (!isChecklistMode && checklistItems.length === 0) {
      // Add first item when enabling checklist mode
      const newItem: ChecklistItem = {
        id: generateUUID(),
        text: '',
        completed: false,
        order: 0,
      };
      setChecklistItems([newItem]);
    }
  };

  const handleAddChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: generateUUID(),
      text: '',
      completed: false,
      order: checklistItems.length,
    };
    const updatedItems = [...checklistItems, newItem];
    setChecklistItems(updatedItems);
    debouncedSave(title, body, selectedCategory, selectedColor, updatedItems);
  };

  const handleToggleChecklistItem = (id: string) => {
    const updatedItems = checklistItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(updatedItems);
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, selectedCategory, selectedColor, updatedItems);
  };

  const handleUpdateChecklistItem = (id: string, text: string) => {
    const updatedItems = checklistItems.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    setChecklistItems(updatedItems);
    debouncedSave(title, body, selectedCategory, selectedColor, updatedItems);
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updatedItems = checklistItems.filter((item) => item.id !== id);
    setChecklistItems(updatedItems);
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, selectedCategory, selectedColor, updatedItems);
  };

  // Text formatting handlers
  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    const { start, end } = textSelection;
    const selectedText = body.substring(start, end);
    const beforeText = body.substring(0, start);
    const afterText = body.substring(end);

    const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
    setBody(newText);
    debouncedSave(title, newText, selectedCategory, selectedColor, checklistItems);

    // Refocus and adjust selection
    setTimeout(() => {
      bodyInputRef.current?.focus();
      const newCursorPos = start + prefix.length + selectedText.length + suffix.length;
      bodyInputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos },
      });
    }, 100);
  };

  const handleBold = () => {
    applyFormatting('**');
  };

  const handleItalic = () => {
    applyFormatting('*');
  };

  const handleBulletList = () => {
    const { start } = textSelection;
    const beforeText = body.substring(0, start);
    const afterText = body.substring(start);

    // Add bullet at start of line
    const newText = `${beforeText}${beforeText && !beforeText.endsWith('\n') ? '\n' : ''}• ${afterText}`;
    setBody(newText);
    debouncedSave(title, newText, selectedCategory, selectedColor, checklistItems);
  };

  const handleNumberedList = () => {
    const { start } = textSelection;
    const beforeText = body.substring(0, start);
    const afterText = body.substring(start);

    // Count existing numbered items
    const lines = beforeText.split('\n');
    let number = 1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].match(/^\d+\.\s/)) {
        number = parseInt(lines[i].match(/^(\d+)/)?.[1] || '0') + 1;
        break;
      }
    }

    const newText = `${beforeText}${beforeText && !beforeText.endsWith('\n') ? '\n' : ''}${number}. ${afterText}`;
    setBody(newText);
    debouncedSave(title, newText, selectedCategory, selectedColor, checklistItems);
  };

  // Handle back button
  const handleBack = async () => {
    // Clear any pending save
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      // Do final save if there's content
      if (title.trim() || body.trim() || checklistItems.length > 0) {
        await saveNote(title, body, selectedCategory, selectedColor, checklistItems);
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

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  const getSaveStatusText = () => {
    if (saving) return 'Saving...';
    if (lastSaved) {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      if (seconds < 5) return 'Saved';
      if (seconds < 60) return `Saved ${seconds}s ago`;
      return 'Saved';
    }
    return '';
  };

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

  return (
    <SafeAreaView style={[styles.container, selectedColor && { backgroundColor: selectedColor }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
              <ArrowLeft size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {getSaveStatusText()}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
              <MoreVertical size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        </View>

        {categories.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={styles.categoryText}>
                {selectedCategoryData?.name || 'No category'}
              </Text>
              <ChevronDown size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryPicker}>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    !selectedCategory && styles.categoryOptionActive,
                  ]}
                  onPress={() => handleCategoryChange(null as any)}
                >
                  <View style={[styles.categoryColor, { backgroundColor: Colors.light.textTertiary }]} />
                  <Text style={styles.categoryOptionText}>No category</Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id && styles.categoryOptionActive,
                    ]}
                    onPress={() => handleCategoryChange(category.id)}
                  >
                    <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryOptionText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <ScrollView
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
          {isChecklistMode ? (
            <View style={styles.checklistContainer}>
              {checklistItems.map((item) => (
                <ChecklistItemComponent
                  key={item.id}
                  item={item}
                  onToggle={handleToggleChecklistItem}
                  onUpdate={handleUpdateChecklistItem}
                  onDelete={handleDeleteChecklistItem}
                />
              ))}
              <TouchableOpacity style={styles.addChecklistButton} onPress={handleAddChecklistItem}>
                <Text style={styles.addChecklistText}>+ Add item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              ref={bodyInputRef}
              style={styles.bodyInput}
              placeholder="Note here"
              placeholderTextColor={Colors.light.textTertiary}
              value={body}
              onChangeText={handleBodyChange}
              onSelectionChange={(e) => setTextSelection(e.nativeEvent.selection)}
              multiline
              textAlignVertical="top"
            />
          )}
        </ScrollView>

        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContent}>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleToggleChecklistMode}>
              <CheckSquare size={22} color={isChecklistMode ? Colors.light.primary : Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleBold} disabled={isChecklistMode}>
              <Bold size={22} color={isChecklistMode ? Colors.light.borderLight : Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleItalic} disabled={isChecklistMode}>
              <Italic size={22} color={isChecklistMode ? Colors.light.borderLight : Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleBulletList} disabled={isChecklistMode}>
              <List size={22} color={isChecklistMode ? Colors.light.borderLight : Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={handleNumberedList} disabled={isChecklistMode}>
              <ListOrdered size={22} color={isChecklistMode ? Colors.light.borderLight : Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowColorPicker(true)}>
              <Palette size={22} color={selectedColor || Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton}>
              <Camera size={22} color={Colors.light.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarButton}>
              <ImageIcon size={22} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </View>

        <Modal
          visible={showColorPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowColorPicker(false)}
          statusBarTranslucent
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowColorPicker(false)}>
            <Pressable style={styles.colorPickerModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Color</Text>
                <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                  <X size={24} color={Colors.light.textSecondary} />
                </TouchableOpacity>
              </View>
              <ColorPicker selectedColor={selectedColor} onColorSelect={handleColorChange} />
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
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
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.light.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  categoryText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryPicker: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingVertical: Spacing.xs,
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  categoryOptionActive: {
    backgroundColor: Colors.light.borderLight,
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryOptionText: {
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
    minHeight: 400,
  },
  toolbar: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  toolbarContent: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  toolbarButton: {
    padding: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'flex-end',
  },
  colorPickerModal: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingBottom: Spacing.xxxl,
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
  checklistContainer: {
    paddingVertical: Spacing.sm,
  },
  addChecklistButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  addChecklistText: {
    fontSize: Typography.fontSize.base,
    color: Colors.light.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
});
