import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Note, Category, CreateNoteInput } from '@/types';
import * as Storage from './storage';
import { encryptText, decryptText, isEncryptionAvailable } from './encryption';
import { authenticateWithBiometrics } from './biometric';
import inAppReviewService from '@/services/inAppReview';
import analytics from '@/services/analytics';

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

    // Track note creation for in-app review
    try {
      await inAppReviewService.trackEvent('note_created');

      // Get total note count for analytics
      const allNotes = await Storage.getAllNotes();
      const activeNotes = allNotes.filter(n => !n.is_deleted);

      // Log to analytics
      await analytics.logEvent('note_created', {
        category: input.category_id || 'none',
        has_checklist: (input.checklist_items?.length || 0) > 0,
        has_images: (input.images?.length || 0) > 0,
        has_audio: (input.audio_recordings?.length || 0) > 0,
        is_locked: false, // New notes are never locked
        total_notes: activeNotes.length,
      });

      // Smart review prompt after 10 notes created
      if (activeNotes.length === 10) {
        console.log('[NOTES] 10 notes milestone reached, checking review eligibility...');
        const shouldPrompt = await inAppReviewService.shouldPromptForReview();
        if (shouldPrompt) {
          // Delay slightly to avoid interrupting user flow
          setTimeout(() => {
            inAppReviewService.requestReview();
          }, 2000);
        }
      }
    } catch (error) {
      console.log('[NOTES] Error tracking note creation:', error);
      // Don't block note creation if tracking fails
    }

    return note;
  }, [refreshNotes]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const updatedNote = await Storage.updateNote(id, updates);
    await refreshNotes();

    // Track significant note updates
    try {
      await inAppReviewService.trackEvent('note_updated');

      // Track specific update types
      if (updates.is_favorite !== undefined) {
        await analytics.logEvent('note_favorited', { favorited: updates.is_favorite });
      }
      if (updates.is_locked !== undefined) {
        await analytics.logEvent('note_locked', { locked: updates.is_locked });
      }
      if (updates.category_id !== undefined) {
        await analytics.logEvent('note_moved_to_category');
      }
    } catch (error) {
      console.log('[NOTES] Error tracking note update:', error);
    }

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
          // If proper encryption is available, encrypt. Otherwise, fall back to biometric-gated soft lock.
          const canEncrypt = await isEncryptionAvailable();
          if (canEncrypt) {
            // Encrypt the body (handles empty strings gracefully)
            const encryptedBody = await encryptText(note.body || '');
            await Storage.updateNote(id, {
              body: encryptedBody,
              is_locked: true,
            });
            await refreshNotes();
            return { success: true };
          }

          // Soft lock fallback: keep body as-is but mark locked
          await Storage.updateNote(id, {
            is_locked: true,
          });
          await refreshNotes();
          return { success: true };
        } catch (encryptError) {
          console.error('Encryption failed:', encryptError);
          // As a resilience measure, still apply a soft lock if encryption fails unexpectedly
          try {
            await Storage.updateNote(id, { is_locked: true });
            await refreshNotes();
            return { success: true };
          } catch {
            return {
              success: false,
              error: encryptError instanceof Error ? encryptError.message : 'Failed to encrypt note'
            };
          }
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

  const value: NotesContextType = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
}
