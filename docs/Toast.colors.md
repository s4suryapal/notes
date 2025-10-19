# Toast Component - Color Reference

This document provides a visual reference for all toast types and their corresponding colors in the NotesAI app.

## Toast Types & Colors

### 🟢 Success Toast
- **Type**: `success`
- **Color**: `#10B981` (Green-500)
- **Icon**: CheckCircle2
- **Use Cases**:
  - Note created successfully
  - Note saved
  - Settings updated
  - Sync completed

### 🔴 Error Toast
- **Type**: `error`
- **Color**: Theme error color (typically red)
- **Icon**: XCircle
- **Use Cases**:
  - Failed to save note
  - Network error
  - Database error
  - Permission denied

### 🟠 Warning Toast
- **Type**: `warning`
- **Color**: Theme warning color (typically orange/yellow)
- **Icon**: AlertCircle
- **Use Cases**:
  - Note not synced
  - Low storage warning
  - Network connection unstable
  - Feature limitation

### 🔵 Info Toast
- **Type**: `info`
- **Color**: Theme primary color (typically blue)
- **Icon**: Info
- **Use Cases**:
  - General information
  - Tips and hints
  - Feature announcements
  - Tutorial messages

### 🗑️ Deleted Toast
- **Type**: `deleted`
- **Color**: `#EF4444` (Red-500)
- **Icon**: Trash2
- **Use Cases**:
  - Note deleted (with undo)
  - Category deleted
  - Batch delete completed

### 🟣 Archived Toast
- **Type**: `archived`
- **Color**: `#8B5CF6` (Violet-500)
- **Icon**: Archive
- **Use Cases**:
  - Note archived (with undo)
  - Multiple notes archived
  - Auto-archive completed

### 💚 Restored Toast
- **Type**: `restored`
- **Color**: `#10B981` (Green-500)
- **Icon**: ArchiveRestore
- **Use Cases**:
  - Note restored from trash
  - Note unarchived
  - Undo delete/archive

### ⚪ Exit Toast
- **Type**: `exit`
- **Color**: `#64748B` (Slate-500)
- **Icon**: LogOut
- **Use Cases**:
  - Press back again to exit
  - Session timeout warning
  - Logout confirmation

## Custom Colors

You can use any custom hex color by passing the `customColor` prop:

```tsx
<Toast
  visible={true}
  message="Custom colored toast"
  type="info"
  customColor="#FF6B9D"
  onDismiss={() => {}}
/>
```

### Suggested Custom Colors:

- **Pink**: `#FF6B9D` - For favorite/like actions
- **Cyan**: `#00BCD4` - For sync/cloud actions
- **Amber**: `#F59E0B` - For premium features
- **Teal**: `#14B8A6` - For collaboration actions
- **Indigo**: `#6366F1` - For AI features
- **Rose**: `#F43F5E` - For important notices

## Accessibility

All toasts include:
- White text (`#FFFFFF`) for maximum contrast
- White icons (`#FFFFFF`) for consistency
- Semi-transparent white icon backgrounds (`#FFFFFF40`)
- 90% opacity backgrounds (`E6` hex) for visibility
- ARIA roles (`alert`) for screen readers
- Live region announcements (`polite`)

## Design Details

- **Border Radius**: Extra large (`BorderRadius.xl`)
- **Shadow**: Elevation 12 with deep shadow
- **Progress Bar**: 4px height with semi-transparent white
- **Icon Container**: 36x36px circular background
- **Padding**: Large spacing for comfortable touch targets
- **Animation**: Smooth slide-up with fade effect
