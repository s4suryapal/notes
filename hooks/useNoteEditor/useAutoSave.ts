import { useCallback, useRef } from 'react';
import { Note, ChecklistItem as ChecklistItemType, CreateNoteInput } from '@/types';

interface UseAutoSaveProps {
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note | null>;
}

interface SaveNoteParams {
  title: string;
  body: string;
  categoryId: string | null;
  color: string | null;
  images?: string[];
  audioRecordings?: string[];
  checklistItems?: ChecklistItemType[];
}

export function useAutoSave({ createNote, updateNote }: UseAutoSaveProps) {
  const currentNoteId = useRef<string | null>(null);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper to strip HTML and check for actual content
  const hasActualContent = (html: string): boolean => {
    const stripped = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace nbsp with space
      .replace(/\s+/g, '') // Remove all whitespace
      .trim();
    return stripped.length > 0;
  };

  // Save function
  const saveNote = useCallback(async (params: SaveNoteParams) => {
    const {
      title,
      body,
      categoryId,
      color,
      images = [],
      audioRecordings = [],
      checklistItems = [],
    } = params;

    const hasTitleContent = title.trim().length > 0;
    const hasBodyContent = hasActualContent(body);
    const hasImages = images.length > 0;
    const hasAudio = audioRecordings.length > 0;
    const hasChecklist = checklistItems.length > 0;

    console.log('saveNote called:', {
      hasTitleContent,
      hasBodyContent,
      hasImages,
      hasAudio,
      hasChecklist,
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
          title,
          body,
          category_id: categoryId,
          color,
          images: images.length > 0 ? images : undefined,
          audio_recordings: audioRecordings.length > 0 ? audioRecordings : undefined,
          checklist_items: checklistItems.length > 0 ? checklistItems : undefined,
        });
        console.log('Note updated successfully');
      } else {
        // Create new note
        console.log('Creating new note');
        const newNote = await createNote({
          title,
          body,
          category_id: categoryId,
          color,
          images: images.length > 0 ? images : undefined,
          audio_recordings: audioRecordings.length > 0 ? audioRecordings : undefined,
          checklist_items: checklistItems.length > 0 ? checklistItems : undefined,
        });
        currentNoteId.current = newNote.id;
        console.log('New note created:', newNote.id);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [createNote, updateNote]);

  // Debounced save (300ms)
  const debouncedSave = useCallback((params: SaveNoteParams) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveNote(params);
    }, 300) as any;
  }, [saveNote]);

  // Immediate save (clears debounce)
  const immediateSave = useCallback(async (params: SaveNoteParams) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    await saveNote(params);
  }, [saveNote]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
  }, []);

  return {
    currentNoteId,
    saveNote,
    debouncedSave,
    immediateSave,
    cleanup,
    hasActualContent,
  };
}
