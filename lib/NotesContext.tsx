import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Note, Category, CreateNoteInput } from '@/types';
import * as Storage from './storage';

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
  createCategory: (name: string, color: string, icon?: string | null) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
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
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
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
