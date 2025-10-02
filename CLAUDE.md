# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NotesAI is a React Native mobile notes application built with Expo, featuring a Google Keep-inspired interface. The app uses Supabase for backend storage and follows a file-based routing pattern via Expo Router.

## Development Commands

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for web
npm run build:web
```

## Architecture

### Routing Structure
- Uses Expo Router with file-based routing
- Root layout at `app/_layout.tsx` uses Stack navigation
- Tab navigation at `app/(tabs)/_layout.tsx` contains:
  - `index.tsx` - Home/Notes list screen
  - `folders.tsx` - Folders/Categories screen
  - `search.tsx` - Search screen
  - `more.tsx` - Menu/Settings screen
- Dynamic route `app/note/[id].tsx` for note creation/editing (modal presentation)

### Data Layer
- **Database**: Supabase (PostgreSQL) via `lib/supabase.ts`
- **Environment variables**:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Mock data**: Available in `lib/mockData.ts` for development
- **Types**: Defined in `types/index.ts` - includes `Note`, `Category`, `NoteFilter`

### Database Schema
- **notes** table: id, title, body, category_id, color, is_favorite, is_archived, is_deleted, created_at, updated_at
- **categories** table: id, name, color, icon, order_index, created_at, updated_at

### Design System
Located in `constants/theme.ts`:
- 8px base spacing system (xs: 4px to xxxl: 40px)
- Color palette with primary (#4A90E2), secondary (#FFD54F), accent (#00C49A), warning (#FF6B6B)
- Typography scale (xs: 11px to huge: 40px)
- Border radius tokens (sm: 4px to round: 9999px)
- Shadow elevation system

### Reusable Components
Located in `components/`:
- `NoteCard.tsx` - Note preview cards for list/grid views
- `CategoryChip.tsx` - Category filter pills with active states
- `CategoryCard.tsx` - Folder cards with colored accents and count badges
- `FAB.tsx` - Floating action button
- `EmptyState.tsx` - Empty state illustrations and messages
- Barrel exports via `components/index.ts`

## Key Implementation Details

### Path Aliases
- `@/*` resolves to project root (configured in `tsconfig.json`)

### TypeScript
- Strict mode enabled
- Typed routes enabled via Expo Router experiments

### Platform Support
- iOS, Android, and Web (Metro bundler for web)
- New Architecture enabled in `app.json`

## Notes for AI Assistants

When working with navigation, remember that Expo Router uses file-based routing - file location determines the route path. The `(tabs)` directory uses parentheses to create a route group without adding to the URL path.

The app currently uses mock data. When implementing database features, ensure Supabase client is properly configured with environment variables before attempting CRUD operations.
