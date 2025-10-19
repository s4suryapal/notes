# Adding Reminder Notifications to Notes

## Overview

This document provides recommendations for integrating reminder functionality into individual notes in NotesAI. Currently, reminders exist separately in the CallEndActivity fragment. This proposal adds reminder support directly within notes for a better user experience.

## Current Architecture

### What Exists
1. **RemindersFragment.kt** - Standalone reminder management (Native Android)
2. **Note Editor** (`app/note/[id].tsx`) - Rich note editing (React Native)
3. **Note Type** (`types/index.ts`) - TypeScript note interface

### What's Missing
- Link between notes and reminders
- UI to add reminders from note editor
- Reminder field in note data model

## Proposed Implementation

### 🎯 Option 1: Add Reminder Field to Notes (Recommended)

This is the cleanest approach - add reminder functionality directly to the note data model.

#### 1.1 Update TypeScript Types

**File**: `types/index.ts`

```typescript
export interface Reminder {
  id: string;
  dateTime: number; // Unix timestamp in milliseconds
  enabled: boolean;
  title?: string; // Optional custom reminder title (defaults to note title)
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
  images?: string[];
  audio_recordings?: string[];
  ocr_data?: OCRMetadata[];
  reminder?: Reminder; // NEW: Single reminder per note
  created_at: string;
  updated_at: string;
}
```

**Why Single Reminder?**
- Keeps UX simple
- Matches user expectation ("remind me about THIS note at THIS time")
- Easier to implement and maintain
- Can expand to multiple reminders later if needed

#### 1.2 Add Reminder UI to Note Editor

**File**: `app/note/[id].tsx`

Add reminder state and UI:

```typescript
// Add to state section (around line 86)
const [reminder, setReminder] = useState<Reminder | null>(null);
const [showReminderPicker, setShowReminderPicker] = useState(false);

// Add to load note section (around line 272)
if (note.reminder) {
  setReminder(note.reminder);
}

// Add handler for reminder changes
const handleReminderChange = (newReminder: Reminder | null) => {
  setReminder(newReminder);
  setShowReminderPicker(false);

  // Schedule or cancel notification via Native Module
  if (newReminder) {
    NativeModules.ReminderModule.scheduleReminder(
      newReminder.id,
      newReminder.title || title || 'Note Reminder',
      newReminder.dateTime,
      currentNoteId.current
    );
  } else {
    NativeModules.ReminderModule.cancelReminder(reminder?.id);
  }

  // Save immediately
  immediateSave({
    title,
    body,
    categoryId: selectedCategory,
    color: selectedColor,
    images: imageManager.images,
    audioRecordings: audioRecorder.audioRecordings,
    checklistItems: checklistManager.checklistItems,
    reminder: newReminder,
  });
};
```

**Add Reminder Icon to Toolbar** (around line 845):

```typescript
<RichToolbar
  editor={richTextRef}
  actions={[
    actions.setBold,
    actions.setItalic,
    actions.setUnderline,
    actions.insertBulletsList,
    actions.insertOrderedList,
    'template',
    'smartcalc',
    'checklist',
    'reminder',     // NEW
    'scanner',
    'ocr',
    'camera',
    'gallery',
    'microphone',
    'palette',
    actions.keyboard,
    actions.removeFormat,
    actions.undo,
    actions.redo,
  ]}
  iconMap={{
    template: () => <Layout size={20} color={C.text} />,
    smartcalc: () => <Calculator size={20} color={smartCalcEnabled ? C.primary : C.text} />,
    checklist: () => <CheckSquare size={20} color={checklistManager.showChecklist ? C.primary : C.text} />,
    reminder: () => <Bell size={20} color={reminder ? C.primary : C.text} />,  // NEW
    scanner: () => <ScanText size={20} color={C.text} />,
    // ... rest of icons
  }}
  // ... other props
  reminder={() => setShowReminderPicker(true)}  // NEW
/>
```

Don't forget to import Bell from lucide-react-native:
```typescript
import { Camera, Image as ImageIcon, Palette, Check, Mic, CheckSquare, ScanText, FileText, Calculator, Layout, Bell } from 'lucide-react-native';
```

#### 1.3 Create Reminder Picker Component

**New File**: `components/NoteEditor/ReminderPickerModal.tsx`

```typescript
import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X, Check, Calendar, Clock, Bell } from 'lucide-react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface Reminder {
  id: string;
  dateTime: number;
  enabled: boolean;
  title?: string;
}

interface ReminderPickerModalProps {
  visible: boolean;
  currentReminder: Reminder | null;
  noteTitle: string;
  onClose: () => void;
  onSave: (reminder: Reminder | null) => void;
}

export function ReminderPickerModal({
  visible,
  currentReminder,
  noteTitle,
  onClose,
  onSave,
}: ReminderPickerModalProps) {
  const { colorScheme } = useTheme();
  const C = Colors[colorScheme];

  const [selectedDate, setSelectedDate] = useState(() => {
    if (currentReminder) return new Date(currentReminder.dateTime);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    if (selectedDate.getTime() <= Date.now()) {
      alert('Please select a future date and time');
      return;
    }

    const reminder: Reminder = {
      id: currentReminder?.id || `reminder_${Date.now()}`,
      dateTime: selectedDate.getTime(),
      enabled: true,
      title: noteTitle,
    };

    onSave(reminder);
  };

  const handleRemove = () => {
    onSave(null);
  };

  const quickActions = [
    { label: 'Later Today', hours: 4 },
    { label: 'Tomorrow Morning', hours: 24, setTime: [9, 0] },
    { label: 'Tomorrow Evening', hours: 24, setTime: [18, 0] },
    { label: 'Next Week', days: 7, setTime: [9, 0] },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    const date = new Date();
    if (action.hours) {
      date.setHours(date.getHours() + action.hours);
    }
    if (action.days) {
      date.setDate(date.getDate() + action.days);
    }
    if (action.setTime) {
      date.setHours(action.setTime[0], action.setTime[1], 0, 0);
    }
    setSelectedDate(date);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: C.overlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.modal, { backgroundColor: C.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={24} color={C.primary} />
              <Text style={[styles.title, { color: C.text }]}>
                Set Reminder
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickActionButton, { backgroundColor: C.backgroundSecondary }]}
                  onPress={() => handleQuickAction(action)}
                >
                  <Text style={[styles.quickActionText, { color: C.text }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date & Time Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>
              Custom Date & Time
            </Text>

            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: C.backgroundSecondary }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={C.primary} />
              <Text style={[styles.dateTimeText, { color: C.text }]}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: C.backgroundSecondary }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color={C.primary} />
              <Text style={[styles.dateTimeText, { color: C.text }]}>
                {selectedDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (date) setSelectedDate(date);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="time"
              display="default"
              onChange={(event, date) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (date) {
                  const newDate = new Date(selectedDate);
                  newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
                  setSelectedDate(newDate);
                }
              }}
            />
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            {currentReminder && (
              <TouchableOpacity
                style={[styles.button, styles.removeButton, { backgroundColor: C.error + '15' }]}
                onPress={handleRemove}
              >
                <Text style={[styles.buttonText, { color: C.error }]}>
                  Remove Reminder
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: C.primary }]}
              onPress={handleSave}
            >
              <Check size={20} color="#FFFFFF" />
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                Save Reminder
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  dateTimeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  saveButton: {},
  removeButton: {},
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
```

**Install dependency**:
```bash
npm install @react-native-community/datetimepicker
```

#### 1.4 Create Native Reminder Module (React Native Bridge)

**New File**: `android/app/src/main/java/com/notesai/.../ReminderModule.kt`

```kotlin
package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class ReminderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "ReminderModule"
    }

    override fun getName(): String {
        return "ReminderModule"
    }

    @ReactMethod
    fun scheduleReminder(
        reminderId: String,
        reminderTitle: String,
        dateTimeMillis: Double,
        noteId: String,
        promise: Promise
    ) {
        try {
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactApplicationContext, NoteReminderReceiver::class.java).apply {
                putExtra("reminder_id", reminderId)
                putExtra("reminder_title", reminderTitle)
                putExtra("note_id", noteId)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                reminderId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerTime = dateTimeMillis.toLong()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    triggerTime,
                    pendingIntent
                )
            }

            Log.d(TAG, "✅ Scheduled reminder: $reminderTitle at $triggerTime")
            promise.resolve(true)

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error scheduling reminder", e)
            promise.reject("SCHEDULE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun cancelReminder(reminderId: String, promise: Promise) {
        try {
            val alarmManager = reactApplicationContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(reactApplicationContext, NoteReminderReceiver::class.java)
            val pendingIntent = PendingIntent.getBroadcast(
                reactApplicationContext,
                reminderId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            alarmManager.cancel(pendingIntent)
            Log.d(TAG, "🗑️ Cancelled reminder: $reminderId")
            promise.resolve(true)

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error cancelling reminder", e)
            promise.reject("CANCEL_ERROR", e.message, e)
        }
    }
}
```

**New File**: `android/app/src/main/java/com/notesai/.../ReminderPackage.kt`

```kotlin
package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class ReminderPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(ReminderModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

**Register Package** in `MainApplication.kt` (around line 46):

```kotlin
add(ReminderPackage())
```

**New File**: `android/app/src/main/java/com/notesai/.../NoteReminderReceiver.kt`

```kotlin
package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.PendingIntent
import android.app.TaskStackBuilder
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * Note-specific reminder receiver
 * Shows notification and opens the specific note when tapped
 */
class NoteReminderReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "NoteReminderReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getStringExtra("reminder_id") ?: return
        val reminderTitle = intent.getStringExtra("reminder_title") ?: "Note Reminder"
        val noteId = intent.getStringExtra("note_id") ?: return

        Log.d(TAG, "🔔 Note reminder triggered: $reminderTitle (Note: $noteId)")

        showNotification(context, reminderId, reminderTitle, noteId)
    }

    private fun showNotification(context: Context, reminderId: String, reminderTitle: String, noteId: String) {
        try {
            // Create intent to open the specific note
            val resultIntent = Intent(context, MainActivity::class.java).apply {
                putExtra("openNote", true)
                putExtra("noteId", noteId)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = TaskStackBuilder.create(context).run {
                addNextIntentWithParentStack(resultIntent)
                getPendingIntent(
                    reminderId.hashCode(),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }

            val builder = NotificationCompat.Builder(context, NotificationChannelManager.ChannelId.REMINDERS)
                .setSmallIcon(R.drawable.ic_stat_ic_notification)
                .setContentTitle("📝 $reminderTitle")
                .setContentText("Tap to open note")
                .setStyle(NotificationCompat.BigTextStyle().bigText("Tap to open note"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setVibrate(longArrayOf(0, 250, 250, 250))
                .setCategory(NotificationCompat.CATEGORY_REMINDER)

            val notificationManager = NotificationManagerCompat.from(context)
            try {
                notificationManager.notify(reminderId.hashCode(), builder.build())
                Log.d(TAG, "✅ Notification shown successfully")
            } catch (e: SecurityException) {
                Log.e(TAG, "❌ Notification permission not granted", e)
            }

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error showing notification", e)
        }
    }
}
```

**Register Receiver** in `AndroidManifest.xml`:

```xml
<!-- Note Reminder Receiver for note-specific reminders -->
<receiver
    android:name=".NoteReminderReceiver"
    android:exported="false" />
```

#### 1.5 Update Note Editor to Use Reminder Picker

**File**: `app/note/[id].tsx` (add to modals section around line 940)

```typescript
import { ReminderPickerModal } from '@/components/NoteEditor/ReminderPickerModal';

// In the render section, add after TemplatePicker
<ReminderPickerModal
  visible={showReminderPicker}
  currentReminder={reminder}
  noteTitle={title || 'Note'}
  onClose={() => setShowReminderPicker(false)}
  onSave={handleReminderChange}
/>
```

#### 1.6 Export Reminder Picker from Index

**File**: `components/NoteEditor/index.ts`

```typescript
export { ReminderPickerModal } from './ReminderPickerModal';
```

### 🎯 Option 2: Link Notes to Existing Reminders

Alternative approach - create relationships between existing reminders and notes (more complex).

**Pros**:
- Reuses existing RemindersFragment UI
- Separation of concerns

**Cons**:
- More complex data flow
- Requires syncing between native and React Native
- Harder to maintain consistency

**Recommendation**: Use Option 1 for simpler implementation.

## User Experience Flow

### Creating a Reminder for a Note:

1. User opens/creates a note
2. User taps **Bell icon** in toolbar
3. **ReminderPickerModal** appears with:
   - Quick actions (Later Today, Tomorrow Morning, etc.)
   - Custom date/time picker
4. User selects time and taps **Save**
5. Reminder is scheduled natively
6. **Bell icon** turns blue to indicate active reminder

### When Reminder Fires:

1. System triggers `NoteReminderReceiver` at scheduled time
2. Notification appears with note title
3. User taps notification
4. App opens directly to the specific note

### Managing Reminders:

- **Edit reminder**: Tap bell icon again, change time
- **Remove reminder**: Tap bell icon, tap "Remove Reminder"
- **Auto-remove**: Reminder auto-removes after notification fires

## Data Storage

### Local Storage (MMKV/AsyncStorage)

Notes are stored with reminder field:

```typescript
{
  id: "note-123",
  title: "Call dentist",
  body: "<p>Schedule checkup</p>",
  reminder: {
    id: "reminder-456",
    dateTime: 1729450800000,
    enabled: true,
    title: "Call dentist"
  }
}
```

### Supabase Schema Update

Add optional reminder column to notes table:

```sql
ALTER TABLE notes
ADD COLUMN reminder JSONB NULL;

-- Add index for querying notes with reminders
CREATE INDEX idx_notes_reminder ON notes USING GIN (reminder);

-- Example queries
-- Get all notes with active reminders:
SELECT * FROM notes
WHERE reminder IS NOT NULL
AND (reminder->>'enabled')::boolean = true;

-- Get notes with reminders due today:
SELECT * FROM notes
WHERE reminder IS NOT NULL
AND (reminder->>'dateTime')::bigint < EXTRACT(EPOCH FROM NOW() + INTERVAL '1 day') * 1000;
```

## Testing Checklist

- [ ] Add reminder to new note
- [ ] Add reminder to existing note
- [ ] Edit existing reminder
- [ ] Remove reminder
- [ ] Notification appears at correct time
- [ ] Tapping notification opens correct note
- [ ] Reminder persists across app restarts
- [ ] Reminder persists after device reboot (via BootReceiver)
- [ ] Bell icon visual state (active/inactive)
- [ ] Quick actions work correctly
- [ ] Custom date/time picker works
- [ ] Cannot set past date/time
- [ ] Reminder removed after notification fires
- [ ] Works with locked notes (biometric auth first)
- [ ] Works with archived notes
- [ ] Reminder cancelled when note deleted

## Implementation Steps

### Phase 1: Data Model (1 day)
1. Update `types/index.ts` with Reminder interface
2. Update note storage/retrieval logic
3. Test data persistence

### Phase 2: UI Components (2 days)
1. Create ReminderPickerModal component
2. Add bell icon to toolbar
3. Integrate with note editor
4. Test UI interactions

### Phase 3: Native Module (1 day)
1. Create ReminderModule (React Native bridge)
2. Create ReminderPackage
3. Create NoteReminderReceiver
4. Register in AndroidManifest
5. Test alarm scheduling

### Phase 4: Integration (1 day)
1. Connect UI to Native Module
2. Handle reminder save/cancel
3. Update bell icon state
4. Test end-to-end flow

### Phase 5: Testing & Polish (1 day)
1. Test all user flows
2. Test edge cases
3. Add error handling
4. Polish UI/UX
5. Documentation

**Total Estimate**: 5-6 days

## Benefits

✅ **Better UX**: Reminder attached to note context
✅ **Quick Access**: One tap from note editor
✅ **Visual Indicator**: Bell icon shows reminder status
✅ **Smart Defaults**: Quick actions for common times
✅ **Native Reliability**: Uses AlarmManager for guaranteed delivery
✅ **Deep Linking**: Notification opens specific note
✅ **Consistent**: Reuses existing NotificationChannelManager

## Future Enhancements

1. **Multiple Reminders**: Support multiple reminders per note
2. **Recurring Reminders**: Daily, weekly, monthly options
3. **Location-based**: Remind when arriving at location
4. **Smart Suggestions**: AI-suggested reminder times based on note content
5. **Reminder Templates**: Pre-configured reminder sets
6. **Snooze from Notification**: Add snooze action button
7. **Reminder List View**: See all note reminders in one place
8. **Calendar Integration**: Export to system calendar
9. **Voice Input**: "Remind me about this tomorrow at 9 AM"
10. **Sharing**: Share note with reminder

## Code References

**Key Files to Create**:
- `components/NoteEditor/ReminderPickerModal.tsx` (New, 300+ lines)
- `android/.../ReminderModule.kt` (New, 100 lines)
- `android/.../ReminderPackage.kt` (New, 20 lines)
- `android/.../NoteReminderReceiver.kt` (New, 100 lines)

**Key Files to Modify**:
- `types/index.ts` - Add Reminder interface (5 lines)
- `app/note/[id].tsx` - Add reminder state and UI (50 lines)
- `android/.../MainApplication.kt` - Register package (1 line)
- `android/app/src/main/AndroidManifest.xml` - Register receiver (5 lines)

**Dependencies to Install**:
```json
{
  "@react-native-community/datetimepicker": "^8.0.1"
}
```

## Summary

Adding reminder notifications to notes is straightforward and builds on the existing reminder infrastructure. The recommended approach is to:

1. **Add reminder field to Note type**
2. **Create ReminderPickerModal component**
3. **Create Native Module bridge**
4. **Create NoteReminderReceiver**
5. **Integrate into note editor**

This provides a seamless user experience where reminders are contextually attached to notes, making it easy to set and manage reminders without leaving the note editor.

**Estimated Complexity**: Medium (5-6 days)
**Value**: High (frequently requested feature)
**Risk**: Low (builds on proven reminder infrastructure)

---

**Ready to implement?** Follow the steps above sequentially, and you'll have working note reminders in about a week! 🚀
