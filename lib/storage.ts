import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, Category } from '@/types';

// Storage Keys
const KEYS = {
  NOTES_LIST: 'notes:list',
  NOTE_PREFIX: 'note:',
  CATEGORIES_LIST: 'categories:list',
  TRASH_LIST: 'trash:list',
  SETTINGS: 'settings',
} as const;

// UUID Generation (simple timestamp-based for now)
export function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== NOTES CRUD ====================

/**
 * Get all note IDs
 */
async function getNotesList(): Promise<string[]> {
  try {
    const listStr = await AsyncStorage.getItem(KEYS.NOTES_LIST);
    return listStr ? JSON.parse(listStr) : [];
  } catch (error) {
    console.error('Error getting notes list:', error);
    return [];
  }
}

/**
 * Save notes list
 */
async function saveNotesList(noteIds: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.NOTES_LIST, JSON.stringify(noteIds));
  } catch (error) {
    console.error('Error saving notes list:', error);
    throw error;
  }
}

/**
 * Get all notes
 */
export async function getAllNotes(): Promise<Note[]> {
  try {
    const noteIds = await getNotesList();
    const notes: Note[] = [];

    for (const id of noteIds) {
      const noteStr = await AsyncStorage.getItem(`${KEYS.NOTE_PREFIX}${id}`);
      if (noteStr) {
        notes.push(JSON.parse(noteStr));
      }
    }

    // Sort by updated_at desc (newest first)
    return notes.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (error) {
    console.error('Error getting all notes:', error);
    return [];
  }
}

/**
 * Get single note by ID
 */
export async function getNoteById(id: string): Promise<Note | null> {
  try {
    const noteStr = await AsyncStorage.getItem(`${KEYS.NOTE_PREFIX}${id}`);
    return noteStr ? JSON.parse(noteStr) : null;
  } catch (error) {
    console.error('Error getting note:', error);
    return null;
  }
}

/**
 * Create new note
 */
export async function createNote(
  title: string,
  body: string,
  category_id: string | null = null,
  color: string | null = null
): Promise<Note> {
  try {
    const now = new Date().toISOString();
    const note: Note = {
      id: generateUUID(),
      title,
      body,
      category_id,
      color,
      is_favorite: false,
      is_archived: false,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    // Save note
    await AsyncStorage.setItem(
      `${KEYS.NOTE_PREFIX}${note.id}`,
      JSON.stringify(note)
    );

    // Add to notes list
    const noteIds = await getNotesList();
    noteIds.push(note.id);
    await saveNotesList(noteIds);

    return note;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * Update existing note
 */
export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'created_at'>>
): Promise<Note | null> {
  try {
    const existingNote = await getNoteById(id);
    if (!existingNote) {
      throw new Error(`Note ${id} not found`);
    }

    const updatedNote: Note = {
      ...existingNote,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      `${KEYS.NOTE_PREFIX}${id}`,
      JSON.stringify(updatedNote)
    );

    return updatedNote;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * Delete note (move to trash)
 */
export async function deleteNote(id: string): Promise<void> {
  try {
    // Mark as deleted
    await updateNote(id, { is_deleted: true });

    // Add to trash list with deletion date
    const trashStr = await AsyncStorage.getItem(KEYS.TRASH_LIST);
    const trash = trashStr ? JSON.parse(trashStr) : {};
    trash[id] = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.TRASH_LIST, JSON.stringify(trash));
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * Permanently delete note
 */
export async function permanentlyDeleteNote(id: string): Promise<void> {
  try {
    // Remove from storage
    await AsyncStorage.removeItem(`${KEYS.NOTE_PREFIX}${id}`);

    // Remove from notes list
    const noteIds = await getNotesList();
    const filtered = noteIds.filter((noteId) => noteId !== id);
    await saveNotesList(filtered);

    // Remove from trash list
    const trashStr = await AsyncStorage.getItem(KEYS.TRASH_LIST);
    if (trashStr) {
      const trash = JSON.parse(trashStr);
      delete trash[id];
      await AsyncStorage.setItem(KEYS.TRASH_LIST, JSON.stringify(trash));
    }
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    throw error;
  }
}

/**
 * Restore note from trash
 */
export async function restoreNote(id: string): Promise<void> {
  try {
    await updateNote(id, { is_deleted: false });

    // Remove from trash list
    const trashStr = await AsyncStorage.getItem(KEYS.TRASH_LIST);
    if (trashStr) {
      const trash = JSON.parse(trashStr);
      delete trash[id];
      await AsyncStorage.setItem(KEYS.TRASH_LIST, JSON.stringify(trash));
    }
  } catch (error) {
    console.error('Error restoring note:', error);
    throw error;
  }
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(id: string): Promise<Note | null> {
  try {
    const note = await getNoteById(id);
    if (!note) return null;

    return await updateNote(id, { is_favorite: !note.is_favorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

/**
 * Toggle archive status
 */
export async function toggleArchive(id: string): Promise<Note | null> {
  try {
    const note = await getNoteById(id);
    if (!note) return null;

    return await updateNote(id, { is_archived: !note.is_archived });
  } catch (error) {
    console.error('Error toggling archive:', error);
    throw error;
  }
}

// ==================== CATEGORIES CRUD ====================

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const listStr = await AsyncStorage.getItem(KEYS.CATEGORIES_LIST);
    return listStr ? JSON.parse(listStr) : [];
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

/**
 * Create new category
 */
export async function createCategory(
  name: string,
  color: string,
  icon: string | null = null
): Promise<Category> {
  try {
    const categories = await getAllCategories();
    const now = new Date().toISOString();

    const category: Category = {
      id: generateUUID(),
      name,
      color,
      icon,
      order_index: categories.length,
      created_at: now,
      updated_at: now,
    };

    categories.push(category);
    await AsyncStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(categories));

    return category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

/**
 * Update category
 */
export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id' | 'created_at'>>
): Promise<Category | null> {
  try {
    const categories = await getAllCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error(`Category ${id} not found`);
    }

    categories[index] = {
      ...categories[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(categories));
    return categories[index];
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Delete category
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    const categories = await getAllCategories();
    const filtered = categories.filter((c) => c.id !== id);

    // Update order indices
    filtered.forEach((cat, index) => {
      cat.order_index = index;
    });

    await AsyncStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(filtered));

    // Update all notes in this category to null
    const notes = await getAllNotes();
    for (const note of notes) {
      if (note.category_id === id) {
        await updateNote(note.id, { category_id: null });
      }
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// ==================== INITIALIZATION ====================

/**
 * Initialize storage with default categories
 */
export async function initializeStorage(): Promise<void> {
  try {
    const categories = await getAllCategories();

    // If no categories exist, create defaults
    if (categories.length === 0) {
      const defaultCategories: Omit<Category, 'id' | 'created_at' | 'updated_at'>[] = [
        { name: 'Personal', color: '#00C49A', icon: null, order_index: 0 },
        { name: 'Work', color: '#FF6B6B', icon: null, order_index: 1 },
        { name: 'Ideas', color: '#FFD54F', icon: null, order_index: 2 },
      ];

      for (const cat of defaultCategories) {
        await createCategory(cat.name, cat.color, cat.icon);
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

/**
 * Export all data as JSON (for backup)
 */
export async function exportAllData(): Promise<{
  notes: Note[];
  categories: Category[];
  version: string;
  exported_at: string;
}> {
  try {
    const notes = await getAllNotes();
    const categories = await getAllCategories();

    return {
      notes,
      categories,
      version: '1.0.0',
      exported_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Import data from JSON (for restore)
 */
export async function importAllData(data: {
  notes: Note[];
  categories: Category[];
  version?: string;
}): Promise<void> {
  try {
    // Clear existing data
    await clearAllData();

    // Import categories
    if (data.categories) {
      await AsyncStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(data.categories));
    }

    // Import notes
    if (data.notes && Array.isArray(data.notes)) {
      const noteIds: string[] = [];

      for (const note of data.notes) {
        await AsyncStorage.setItem(`${KEYS.NOTE_PREFIX}${note.id}`, JSON.stringify(note));
        noteIds.push(note.id);
      }

      await saveNotesList(noteIds);
    }

    // Re-initialize storage to ensure defaults exist
    await initializeStorage();
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}
