export interface Note {
  id: string;
  title: string;
  body: string;
  category_id: string | null;
  color: string | null;
  is_favorite: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
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
