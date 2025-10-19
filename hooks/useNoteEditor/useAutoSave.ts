import { useCallback, useRef } from 'react';
import { NativeModules } from 'react-native';
import { Note, ChecklistItem as ChecklistItemType, CreateNoteInput } from '@/types';

const { FirebaseAIModule } = NativeModules;

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

    // Generate title if empty but has content
    let finalTitle = title;
    if (!hasTitleContent && (hasBodyContent || hasImages || hasAudio || hasChecklist)) {
      try {
        // Strip HTML and get plain text
        const plainText = body.replace(/<[^>]*>/g, ' ').trim();

        if (plainText.length > 0 && FirebaseAIModule) {
          console.log('Generating auto-title with Firebase AI...');
          const contentPreview = plainText.substring(0, 500);
          const prompt = `Generate a concise, descriptive title (maximum 50 characters) for this note content. Return ONLY the title, no quotes or extra text:\n\n${contentPreview}`;

          const generatedTitle = await FirebaseAIModule.generateText('gemini-2.0-flash-exp', prompt);
          finalTitle = generatedTitle.trim().replace(/^["']|["']$/g, '');

          // Ensure title doesn't exceed max length
          if (finalTitle.length > 50) {
            finalTitle = finalTitle.substring(0, 47) + '...';
          }
          console.log('Generated title:', finalTitle);
        } else {
          // Fallback: use first line
          const firstLine = plainText.split('\n')[0] || 'Untitled Note';
          finalTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
        }
      } catch (error) {
        console.error('Error generating title:', error);
        // Fallback to simple extraction
        const plainText = body.replace(/<[^>]*>/g, ' ').trim();
        const firstLine = plainText.split('\n')[0] || 'Untitled Note';
        finalTitle = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
      }
    }

    try {
      if (currentNoteId.current) {
        // Update existing note
        console.log('Updating note:', currentNoteId.current);
        await updateNote(currentNoteId.current, {
          title: finalTitle,
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
          title: finalTitle,
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
