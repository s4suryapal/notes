import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Note, Category, CreateNoteInput } from '@/types';
import * as Storage from './storage';
import { encryptText, decryptText } from './encryption';
import { authenticateWithBiometrics } from './biometric';

interface NotesContextType {
  notes: Note[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  toggleLock: (id: string) => Promise<{ success: boolean; error?: string }>;
  unlockNote: (id: string) => Promise<{ success: boolean; decryptedBody?: string; error?: string }>;
  createCategory: (name: string, color: string, icon?: string | null) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  getCategoryNoteCounts: () => Promise<Record<string, number>>;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Storage.initializeStorage();
      await Promise.all([refreshNotes(), refreshCategories()]);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retry = useCallback(async () => {
    await initializeData();
  }, []);

  const refreshNotes = useCallback(async () => {
    try {
      const allNotes = await Storage.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const allCategories = await Storage.getAllCategories();
      // Ensure deterministic order by order_index
      setCategories([...allCategories].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)));
    } catch (error) {
      console.error('Error refreshing categories:', error);
    }
  }, []);

  // Note operations
  const createNote = useCallback(async (input: CreateNoteInput) => {
    const note = await Storage.createNote(input);
    await refreshNotes();
    return note;
  }, [refreshNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const updatedNote = await Storage.updateNote(id, updates);
    await refreshNotes();
    return updatedNote;
  }, [refreshNotes]);

  const deleteNote = useCallback(async (id: string) => {
    await Storage.deleteNote(id);
    await refreshNotes();
  }, [refreshNotes]);

  const permanentlyDeleteNote = useCallback(async (id: string) => {
    await Storage.permanentlyDeleteNote(id);
    await refreshNotes();
  }, [refreshNotes]);

  const restoreNote = useCallback(async (id: string) => {
    await Storage.restoreNote(id);
    await refreshNotes();
  }, [refreshNotes]);

  const toggleFavorite = useCallback(async (id: string) => {
    await Storage.toggleFavorite(id);
    await refreshNotes();
  }, [refreshNotes]);

  const toggleArchive = useCallback(async (id: string) => {
    await Storage.toggleArchive(id);
    await refreshNotes();
  }, [refreshNotes]);

  const toggleLock = useCallback(async (id: string) => {
    try {
      const note = await Storage.getNoteById(id);
      if (!note) {
        return { success: false, error: 'Note not found' };
      }

      if (note.is_locked) {
        // Unlock: decrypt the body
        const authResult = await authenticateWithBiometrics('Authenticate to unlock note');
        if (!authResult.success) {
          return { success: false, error: authResult.error };
        }

        try {
          const decryptedBody = await decryptText(note.body);
          await Storage.updateNote(id, {
            body: decryptedBody,
            is_locked: false,
          });
          await refreshNotes();
          return { success: true };
        } catch (decryptError) {
          console.error('Decryption failed, note may not be properly encrypted:', decryptError);
          // If decryption fails, just unlock without decrypting (body might be plain text)
          await Storage.updateNote(id, {
            is_locked: false,
          });
          await refreshNotes();
          return { success: true };
        }
      } else {
        // Lock: encrypt the body
        const authResult = await authenticateWithBiometrics('Authenticate to lock note');
        if (!authResult.success) {
          return { success: false, error: authResult.error };
        }

        try {
          // Encrypt the body (handles empty strings gracefully)
          const encryptedBody = await encryptText(note.body || '');
          await Storage.updateNote(id, {
            body: encryptedBody,
            is_locked: true,
          });
          await refreshNotes();
          return { success: true };
        } catch (encryptError) {
          console.error('Encryption failed:', encryptError);
          return {
            success: false,
            error: encryptError instanceof Error ? encryptError.message : 'Failed to encrypt note'
          };
        }
      }
    } catch (error: any) {
      console.error('Error toggling lock:', error);
      return { success: false, error: error?.message || 'Failed to toggle lock' };
    }
  }, [refreshNotes]);

  const unlockNote = useCallback(async (id: string) => {
    try {
      const note = await Storage.getNoteById(id);
      if (!note || !note.is_locked) {
        return { success: false, error: 'Note not locked' };
      }

      const authResult = await authenticateWithBiometrics('Authenticate to view note');
      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }

      try {
        const decryptedBody = await decryptText(note.body);
        return { success: true, decryptedBody };
      } catch (decryptError) {
        console.error('Decryption failed, returning original body:', decryptError);
        // If decryption fails, return the original body (might be plain text)
        return { success: true, decryptedBody: note.body };
      }
    } catch (error: any) {
      console.error('Error unlocking note:', error);
      return { success: false, error: error?.message || 'Failed to unlock note' };
    }
  }, []);

  // Category operations
  const createCategory = useCallback(async (name: string, color: string, icon?: string | null) => {
    const category = await Storage.createCategory(name, color, icon);
    await refreshCategories();
    return category;
  }, [refreshCategories]);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    const updatedCategory = await Storage.updateCategory(id, updates);
    await refreshCategories();
    return updatedCategory;
  }, [refreshCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    await Storage.deleteCategory(id);
    await refreshCategories();
    await refreshNotes(); // Refresh notes because category_id might have changed
  }, [refreshCategories, refreshNotes]);

  const reorderCategories = useCallback(async (orderedIds: string[]) => {
    await Storage.updateCategoriesOrder(orderedIds);
    await refreshCategories();
  }, [refreshCategories]);

  const getCategoryNoteCounts = useCallback(async () => {
    return await Storage.getCategoryNoteCounts();
  }, []);

  const value: NotesContextType = {
    notes,
    categories,
    loading,
    error,
    retry,
    refreshNotes,
    refreshCategories,
    createNote,
    updateNote,
    deleteNote,
    permanentlyDeleteNote,
    restoreNote,
    toggleFavorite,
    toggleArchive,
    toggleLock,
    unlockNote,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    getCategoryNoteCounts,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}
