export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface OCRMetadata {
  text: string;
  imageUri: string;
  confidence?: number;
  timestamp: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  category_id: string | null;
  color: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  is_locked?: boolean;
  checklist_items?: ChecklistItem[];
  images?: string[]; // Array of base64 encoded images or URIs
  audio_recordings?: string[]; // Array of audio file URIs
  ocr_data?: OCRMetadata[]; // Array of OCR scanned data
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  title: string;
  body: string;
  category_id?: string | null;
  color?: string | null;
  checklist_items?: ChecklistItem[];
  images?: string[];
  audio_recordings?: string[];
  ocr_data?: OCRMetadata[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export type ViewMode = 'grid' | 'list';

export type SortBy = 'created' | 'updated' | 'title';

export interface NoteFilter {
  category_id?: string | null;
  is_favorite?: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
  search?: string;
}
