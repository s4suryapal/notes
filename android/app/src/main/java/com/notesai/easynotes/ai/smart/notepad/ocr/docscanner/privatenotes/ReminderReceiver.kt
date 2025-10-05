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
 * ReminderReceiver - Handles reminder notifications
 *
 * Following Google's notification best practices:
 * - Uses centralized NotificationChannelManager (no channel creation here)
 * - Proper navigation with TaskStackBuilder for natural back stack
 * - Deep linking to specific app screen
 * - Proper PendingIntent flags for security
 *
 * References:
 * - https://developer.android.com/develop/ui/views/notifications/navigation
 * - https://developer.android.com/develop/ui/views/notifications/channels
 */
class ReminderReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ReminderReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getStringExtra("reminder_id") ?: return
        val reminderTitle = intent.getStringExtra("reminder_title") ?: "Reminder"

        Log.d(TAG, "🔔 Reminder triggered: $reminderTitle (ID: $reminderId)")

        showNotification(context, reminderId, reminderTitle)

        // Auto-delete the reminder from storage after notification is sent
        deleteReminderFromStorage(context, reminderId)
    }

    /**
     * Show notification with proper navigation using TaskStackBuilder
     * Following Google's best practice for regular activity navigation
     */
    private fun showNotification(context: Context, reminderId: String, reminderTitle: String) {
        try {
            // Create intent to open MainActivity with deep link
            val resultIntent = Intent(context, MainActivity::class.java).apply {
                // Deep link parameters
                putExtra("openReminders", true)
                putExtra("reminderId", reminderId)
                // Clear any existing tasks
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            // Build proper back stack using TaskStackBuilder
            // This ensures user can navigate back through app's natural hierarchy
            val pendingIntent = TaskStackBuilder.create(context).run {
                // Add parent activity (MainActivity) to back stack
                addNextIntentWithParentStack(resultIntent)
                // Get PendingIntent with proper flags
                getPendingIntent(
                    reminderId.hashCode(),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }

            // Build the notification
            val builder = NotificationCompat.Builder(context, NotificationChannelManager.ChannelId.REMINDERS)
                .setSmallIcon(R.drawable.ic_stat_ic_notification)
                .setContentTitle("⏰ Reminder")
                .setContentText(reminderTitle)
                .setStyle(NotificationCompat.BigTextStyle().bigText(reminderTitle))
                .setPriority(NotificationCompat.PRIORITY_HIGH) // For Android 7.1 and lower
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setAutoCancel(true) // Dismiss when tapped
                .setContentIntent(pendingIntent)
                .setVibrate(longArrayOf(0, 250, 250, 250))
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                // Add action buttons for quick interaction
                .addAction(
                    0,
                    "Mark Done",
                    createMarkDonePendingIntent(context, reminderId)
                )
                .addAction(
                    0,
                    "Snooze 10 min",
                    createSnoozePendingIntent(context, reminderId, reminderTitle, 10)
                )

            // Show the notification
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

    /**
     * Create PendingIntent for "Mark Done" action
     */
    private fun createMarkDonePendingIntent(context: Context, reminderId: String): PendingIntent {
        val intent = Intent(context, ReminderActionReceiver::class.java).apply {
            action = "ACTION_MARK_DONE"
            putExtra("reminder_id", reminderId)
        }
        return PendingIntent.getBroadcast(
            context,
            reminderId.hashCode() + 1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /**
     * Create PendingIntent for "Snooze" action
     */
    private fun createSnoozePendingIntent(
        context: Context,
        reminderId: String,
        reminderTitle: String,
        minutes: Int
    ): PendingIntent {
        val intent = Intent(context, ReminderActionReceiver::class.java).apply {
            action = "ACTION_SNOOZE"
            putExtra("reminder_id", reminderId)
            putExtra("reminder_title", reminderTitle)
            putExtra("snooze_minutes", minutes)
        }
        return PendingIntent.getBroadcast(
            context,
            reminderId.hashCode() + 2,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun deleteReminderFromStorage(context: Context, reminderId: String) {
        try {
            val sp = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            val json = sp.getString("call_end_reminders", null)

            if (!json.isNullOrEmpty()) {
                val reminders = mutableListOf<Map<String, Any>>()

                // Parse existing reminders
                val arr = org.json.JSONArray(json)
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.getString("id")

                    // Keep all reminders except the one that just fired
                    if (id != reminderId) {
                        reminders.add(mapOf(
                            "id" to id,
                            "title" to obj.getString("title"),
                            "dateTime" to obj.getLong("dateTime"),
                            "completed" to obj.getBoolean("completed")
                        ))
                    }
                }

                // Save updated list back to SharedPreferences
                val newArr = org.json.JSONArray()
                reminders.forEach { reminder ->
                    newArr.put(
                        org.json.JSONObject().apply {
                            put("id", reminder["id"])
                            put("title", reminder["title"])
                            put("dateTime", reminder["dateTime"])
                            put("completed", reminder["completed"])
                        }
                    )
                }

                sp.edit().putString("call_end_reminders", newArr.toString()).apply()
            }
        } catch (e: Exception) {
        }
    }
}
