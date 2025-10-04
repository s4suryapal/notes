import { MMKVStorage } from './mmkvStorage';
import { Note, Category, CreateNoteInput } from '@/types';

// Storage Keys
const KEYS = {
  NOTES_LIST: 'notes:list',
  NOTE_PREFIX: 'note:',
  CATEGORIES_LIST: 'categories:list',
  TRASH_LIST: 'trash:list',
  SETTINGS: 'settings',
  ONBOARDING_COMPLETED: 'onboarding:completed',
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
    const listStr = MMKVStorage.getItem(KEYS.NOTES_LIST);
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
    MMKVStorage.setItem(KEYS.NOTES_LIST, JSON.stringify(noteIds));
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
      const noteStr = MMKVStorage.getItem(`${KEYS.NOTE_PREFIX}${id}`);
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
    const noteStr = MMKVStorage.getItem(`${KEYS.NOTE_PREFIX}${id}`);
    return noteStr ? JSON.parse(noteStr) : null;
  } catch (error) {
    console.error('Error getting note:', error);
    return null;
  }
}

/**
 * Create new note
 */
export async function createNote({
  title,
  body,
  category_id = null,
  color = null,
  checklist_items,
  images,
  audio_recordings,
}: CreateNoteInput): Promise<Note> {
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

    if (checklist_items?.length) {
      note.checklist_items = checklist_items;
    }

    if (images?.length) {
      note.images = images;
    }

    if (audio_recordings?.length) {
      note.audio_recordings = audio_recordings;
    }

    // Save note
    MMKVStorage.setItem(
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

    MMKVStorage.setItem(
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
    const trashStr = MMKVStorage.getItem(KEYS.TRASH_LIST);
    const trash = trashStr ? JSON.parse(trashStr) : {};
    trash[id] = new Date().toISOString();
    MMKVStorage.setItem(KEYS.TRASH_LIST, JSON.stringify(trash));
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
    MMKVStorage.removeItem(`${KEYS.NOTE_PREFIX}${id}`);

    // Remove from notes list
    const noteIds = await getNotesList();
    const filtered = noteIds.filter((noteId) => noteId !== id);
    await saveNotesList(filtered);

    // Remove from trash list
    const trashStr = MMKVStorage.getItem(KEYS.TRASH_LIST);
    if (trashStr) {
      const trash = JSON.parse(trashStr);
      delete trash[id];
      MMKVStorage.setItem(KEYS.TRASH_LIST, JSON.stringify(trash));
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
    const trashStr = MMKVStorage.getItem(KEYS.TRASH_LIST);
    if (trashStr) {
      const trash = JSON.parse(trashStr);
      delete trash[id];
      MMKVStorage.setItem(KEYS.TRASH_LIST, JSON.stringify(trash));
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
    const listStr = MMKVStorage.getItem(KEYS.CATEGORIES_LIST);
    const cats: Category[] = listStr ? JSON.parse(listStr) : [];
    // Always return sorted by order_index ascending
    return cats.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
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
    MMKVStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(categories));

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

    MMKVStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(categories));
    return categories[index];
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

/**
 * Reorder categories by an array of IDs
 */
export async function updateCategoriesOrder(orderedIds: string[]): Promise<void> {
  try {
    const existing = await getAllCategories();
    const byId = new Map(existing.map((c) => [c.id, c]));

    const reordered: Category[] = [];
    const now = new Date().toISOString();

    // Apply provided order first
    orderedIds.forEach((id, idx) => {
      const cat = byId.get(id);
      if (cat) {
        reordered.push({ ...cat, order_index: idx, updated_at: now });
        byId.delete(id);
      }
    });

    // Append any categories not included in orderedIds, preserving relative order
    const remaining = Array.from(byId.values()).sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );
    remaining.forEach((cat, i) => {
      reordered.push({ ...cat, order_index: reordered.length + i, updated_at: now });
    });

    MMKVStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(reordered));
  } catch (error) {
    console.error('Error updating categories order:', error);
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

    MMKVStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(filtered));

    // Delete all notes in this category (soft delete - move to trash)
    const notes = await getAllNotes();
    for (const note of notes) {
      if (note.category_id === id) {
        await deleteNote(note.id);
      }
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

/**
 * Get note counts per category
 */
export async function getCategoryNoteCounts(): Promise<Record<string, number>> {
  try {
    const notes = await getAllNotes();
    const counts: Record<string, number> = {};

    // Count notes that are not deleted or archived
    notes.forEach((note) => {
      if (!note.is_deleted && !note.is_archived) {
        const categoryId = note.category_id || 'none';
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      }
    });

    return counts;
  } catch (error) {
    console.error('Error getting category note counts:', error);
    return {};
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
    MMKVStorage.clear();
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
      MMKVStorage.setItem(KEYS.CATEGORIES_LIST, JSON.stringify(data.categories));
    }

    // Import notes
    if (data.notes && Array.isArray(data.notes)) {
      const noteIds: string[] = [];

      for (const note of data.notes) {
        MMKVStorage.setItem(`${KEYS.NOTE_PREFIX}${note.id}`, JSON.stringify(note));
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

// ==================== ONBOARDING ====================

/**
 * Check if onboarding has been completed
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = MMKVStorage.getItem(KEYS.ONBOARDING_COMPLETED);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding:', error);
    return false;
  }
}

/**
 * Mark onboarding as completed
 */
export async function completeOnboarding(): Promise<void> {
  try {
    MMKVStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}

/**
 * Reset onboarding (for testing)
 */
export async function resetOnboarding(): Promise<void> {
  try {
    MMKVStorage.removeItem(KEYS.ONBOARDING_COMPLETED);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    throw error;
  }
}
