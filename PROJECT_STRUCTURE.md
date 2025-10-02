# NotesAI - Project Structure

## Overview
NotesAI is a modern, mobile-first notes application built with React Native and Expo, inspired by Google Keep, Samsung Notes, and Notion.

## Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based routing)
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React Native
- **Styling**: StyleSheet API with custom design system

## Design System

### Colors
- **Primary**: #4A90E2 (Blue)
- **Secondary**: #FFD54F (Yellow)
- **Accent**: #00C49A (Green)
- **Warning**: #FF6B6B (Red)
- **Background**: #F9FAFB (Light) / #121212 (Dark)

### Typography
- **Font Family**: System default (Inter/Roboto)
- **Sizes**: xs(11) to huge(40)
- **Weights**: regular(400) to bold(700)

### Spacing
- 8px base unit system
- xs(4) to xxxl(40)

### Border Radius
- sm(4) to round(9999)

## Project Structure

```
/app
  /(tabs)
    _layout.tsx       # Tab navigation configuration
    index.tsx         # Home screen (Notes list)
    folders.tsx       # Folders/Categories screen
    search.tsx        # Search screen
    more.tsx          # More/Menu screen
  /note
    [id].tsx          # Note editor (create/edit)
  _layout.tsx         # Root layout with Stack navigation

/components
  NoteCard.tsx        # Individual note card component
  CategoryChip.tsx    # Category filter chip
  CategoryCard.tsx    # Folder card for grid layout
  FAB.tsx            # Floating action button
  EmptyState.tsx     # Empty state with illustration
  index.ts           # Barrel exports

/constants
  theme.ts           # Design tokens and theme configuration

/types
  index.ts           # TypeScript interfaces

/lib
  supabase.ts        # Supabase client configuration
  mockData.ts        # Mock data for development

/hooks
  useFrameworkReady.ts  # Required framework hook
```

## Features Implemented

### ✅ Core UI Screens
1. **Home Screen**
   - Notes list with card layout
   - Category filtering with chips
   - Grid/List view toggle
   - FAB for creating notes
   - Empty state with illustration

2. **Note Editor**
   - Full-screen editing experience
   - Title and body inputs
   - Category selector dropdown
   - Bottom toolbar with actions:
     - Camera
     - Checklist
     - Image attachment
     - Drawing/Pen
     - Color palette
     - Undo/Redo

3. **Folders Screen**
   - Grid layout (2 columns)
   - Category cards with:
     - Colored accent tab
     - Note count badge
     - Category name
   - Summary header (folder count, total notes)

4. **Search Screen**
   - Live search across notes
   - Search by title or body content
   - Results count display
   - Filter button (placeholder)

5. **More/Menu Screen**
   - Organized sections:
     - Organize (All Notes, Folders, Favorites, Reminders, Tags)
     - Storage (Archive, Trash)
     - Premium upgrade section
     - Settings
   - Count badges for each item

### ✅ UI Components
- **NoteCard**: Displays note preview with title, body excerpt, date, and menu
- **CategoryChip**: Pill-shaped category selector with active state
- **CategoryCard**: Folder card with colored accent and count badge
- **FAB**: Floating action button with elevation shadow
- **EmptyState**: Friendly empty state with custom illustrations

### ✅ Design System
- Complete color palette with light/dark mode support
- Typography scale with consistent sizing
- 8px spacing system
- Border radius tokens
- Shadow elevation system
- Layout constants

## Database Schema (Ready to Implement)

### Categories Table
- id (uuid, primary key)
- name (text)
- color (text)
- icon (text, optional)
- order_index (integer)
- created_at (timestamptz)
- updated_at (timestamptz)

### Notes Table
- id (uuid, primary key)
- title (text)
- body (text)
- category_id (uuid, foreign key)
- color (text, optional)
- is_favorite (boolean)
- is_archived (boolean)
- is_deleted (boolean)
- created_at (timestamptz)
- updated_at (timestamptz)

## Navigation Structure

```
Stack Navigator (Root)
├── Tabs Navigator
│   ├── Notes (index)
│   ├── Folders
│   ├── Search
│   └── More
└── Note Editor (Modal)
    └── [id] - Dynamic route for edit/create
```

## Next Steps (Future Enhancements)

1. **Database Integration**
   - Connect to Supabase
   - Implement CRUD operations
   - Add real-time subscriptions

2. **Advanced Features**
   - Rich text formatting (bold, italic, lists)
   - Image attachments
   - Checklist functionality
   - Voice notes
   - Drawing/sketching
   - Note colors
   - Tags system

3. **User Experience**
   - Animations and transitions
   - Pull-to-refresh
   - Swipe gestures (delete, archive)
   - Dark mode toggle
   - Haptic feedback

4. **AI Features**
   - Smart suggestions
   - Auto-categorization
   - OCR for images
   - Text summarization

5. **Collaboration**
   - Share notes
   - Real-time collaboration
   - Comments

## Running the App

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Type checking
npm run typecheck

# Build for web
npm run build:web
```

## Design Inspiration
- Google Keep: Card-based layout, category chips
- Samsung Notes: Toolbar design, folder organization
- Notion: Clean UI, hierarchical structure
- EasyNotes: Color-coded categories, simple UX
