import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, MoveVertical as MoreVertical, Camera, Image as ImageIcon, SquareCheck as CheckSquare, Mic, PenTool, Palette, Undo, Redo, ChevronDown } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useNotes } from '@/lib/NotesContext';
import { Note } from '@/types';

export default function NoteEditorScreen() {
  const { id } = useLocalSearchParams();
  const isNewNote = id === 'new';

  const { notes, categories, createNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(!isNewNote);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const currentNoteId = useRef<string | null>(isNewNote ? null : id as string);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDone = useRef(false);

  // Load existing note
  useEffect(() => {
    if (!isNewNote && id && !initialLoadDone.current) {
      const note = notes.find((n) => n.id === id);
      if (note) {
        setTitle(note.title);
        setBody(note.body);
        setSelectedCategory(note.category_id);
        currentNoteId.current = note.id;
      }
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [id, isNewNote, notes]);

  // Auto-save function with debouncing
  const saveNote = useCallback(async (titleText: string, bodyText: string, categoryId: string | null) => {
    // Don't save if both title and body are empty
    if (!titleText.trim() && !bodyText.trim()) {
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
        });
      } else {
        // Create new note
        const newNote = await createNote(titleText, bodyText, categoryId);
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
  const debouncedSave = useCallback((titleText: string, bodyText: string, categoryId: string | null) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveNote(titleText, bodyText, categoryId);
    }, 300); // 300ms debounce
  }, [saveNote]);

  // Handle text changes
  const handleTitleChange = (text: string) => {
    setTitle(text);
    debouncedSave(text, body, selectedCategory);
  };

  const handleBodyChange = (text: string) => {
    setBody(text);
    debouncedSave(title, text, selectedCategory);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowCategoryPicker(false);
    // Save immediately when category changes
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveNote(title, body, categoryId);
  };

  // Handle back button
  const handleBack = async () => {
    // Clear any pending save
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      // Do final save if there's content
      if (title.trim() || body.trim()) {
        await saveNote(title, body, selectedCategory);
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <TextInput
            style={styles.bodyInput}
            placeholder="Note here"
            placeholderTextColor={Colors.light.textTertiary}
            value={body}
            onChangeText={handleBodyChange}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolbarButton}>
            <Camera size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <CheckSquare size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <ImageIcon size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <PenTool size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Palette size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Undo size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarButton}>
            <Redo size={24} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  toolbarButton: {
    padding: Spacing.xs,
  },
});
