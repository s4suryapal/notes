/**
 * Toast Component - Usage Examples
 *
 * This file demonstrates how to use the enhanced Toast component with different types
 * and custom colors for various actions in the NotesAI app.
 */

import { Toast } from './Toast';

// Example 1: Deleted Note Toast
<Toast
  visible={showToast}
  message="Note deleted"
  type="deleted"
  onDismiss={() => setShowToast(false)}
  action={{
    label: 'Undo',
    onPress: () => restoreNote(),
  }}
/>

// Example 2: Archived Note Toast
<Toast
  visible={showToast}
  message="Note archived"
  type="archived"
  onDismiss={() => setShowToast(false)}
  action={{
    label: 'Undo',
    onPress: () => unarchiveNote(),
  }}
/>

// Example 3: Restored Note Toast
<Toast
  visible={showToast}
  message="Note restored"
  type="restored"
  onDismiss={() => setShowToast(false)}
/>

// Example 4: Exit App Warning Toast
<Toast
  visible={showToast}
  message="Press back again to exit"
  type="exit"
  duration={2000}
  onDismiss={() => setShowToast(false)}
/>

// Example 5: Success Toast (Note Created)
<Toast
  visible={showToast}
  message="Note created successfully"
  type="success"
  onDismiss={() => setShowToast(false)}
/>

// Example 6: Error Toast
<Toast
  visible={showToast}
  message="Failed to save note"
  type="error"
  onDismiss={() => setShowToast(false)}
  action={{
    label: 'Retry',
    onPress: () => saveNote(),
  }}
/>

// Example 7: Warning Toast
<Toast
  visible={showToast}
  message="Note not synced"
  type="warning"
  onDismiss={() => setShowToast(false)}
/>

// Example 8: Info Toast
<Toast
  visible={showToast}
  message="Swipe to see more options"
  type="info"
  onDismiss={() => setShowToast(false)}
/>

// Example 9: Custom Color Toast
<Toast
  visible={showToast}
  message="Note color changed"
  type="info"
  customColor="#FF6B9D" // Pink color
  onDismiss={() => setShowToast(false)}
/>

// Example 10: Custom Color with Long Duration
<Toast
  visible={showToast}
  message="Changes auto-saved"
  type="info"
  customColor="#00BCD4" // Cyan color
  duration={5000}
  onDismiss={() => setShowToast(false)}
/>

/**
 * TOAST TYPES & COLORS:
 *
 * - 'success' (Green): #10B981 - For successful operations
 * - 'error' (Red): theme.colors.error - For errors and failures
 * - 'warning' (Orange): theme.colors.warning - For warnings and cautions
 * - 'info' (Blue): theme.colors.primary - For general information
 * - 'deleted' (Red): #EF4444 - Specifically for delete operations with undo
 * - 'archived' (Violet): #8B5CF6 - For archiving notes with undo
 * - 'restored' (Green): #10B981 - For restoring notes from archive/trash
 * - 'exit' (Slate): #64748B - For app exit warnings
 *
 * CUSTOM COLOR:
 * You can override any toast's color by passing the customColor prop
 * with a hex color code (e.g., "#FF6B9D")
 */
