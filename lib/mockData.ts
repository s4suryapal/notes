import { Note, Category } from '@/types';

export const mockCategories: Category[] = [
  {
    id: '1',
    name: 'All',
    color: '#4A90E2',
    icon: null,
    order_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Home',
    color: '#00C49A',
    icon: null,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Work',
    color: '#FF6B6B',
    icon: null,
    order_index: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Personal',
    color: '#FFD54F',
    icon: null,
    order_index: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockNotes: Note[] = [];
