package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationManagerCompat

/**
 * ReminderActionReceiver - Handles notification action button clicks
 *
 * Actions:
 * - ACTION_MARK_DONE: Marks reminder as completed and dismisses notification
 * - ACTION_SNOOZE: Reschedules reminder for later and dismisses notification
 */
class ReminderActionReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ReminderActionReceiver"
        const val ACTION_MARK_DONE = "ACTION_MARK_DONE"
        const val ACTION_SNOOZE = "ACTION_SNOOZE"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getStringExtra("reminder_id") ?: return

        when (intent.action) {
            ACTION_MARK_DONE -> {
                Log.d(TAG, "✅ Mark done action for reminder: $reminderId")
                markReminderDone(context, reminderId)
            }
            ACTION_SNOOZE -> {
                val reminderTitle = intent.getStringExtra("reminder_title") ?: "Reminder"
                val snoozeMinutes = intent.getIntExtra("snooze_minutes", 10)
                Log.d(TAG, "⏰ Snooze action for reminder: $reminderId ($snoozeMinutes min)")
                snoozeReminder(context, reminderId, reminderTitle, snoozeMinutes)
            }
        }

        // Dismiss the notification
        val notificationManager = NotificationManagerCompat.from(context)
        notificationManager.cancel(reminderId.hashCode())
    }

    /**
     * Mark reminder as done in SharedPreferences
     */
    private fun markReminderDone(context: Context, reminderId: String) {
        try {
            val sp = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            val json = sp.getString("call_end_reminders", null)

            if (!json.isNullOrEmpty()) {
                val reminders = mutableListOf<Map<String, Any>>()
                val arr = org.json.JSONArray(json)

                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.getString("id")

                    // Mark the specific reminder as completed
                    val completed = if (id == reminderId) true else obj.getBoolean("completed")

                    reminders.add(mapOf(
                        "id" to id,
                        "title" to obj.getString("title"),
                        "dateTime" to obj.getLong("dateTime"),
                        "completed" to completed
                    ))
                }

                // Save updated list
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
                Log.d(TAG, "✅ Reminder marked as done in storage")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error marking reminder as done", e)
        }
    }

    /**
     * Snooze reminder by rescheduling it
     */
    private fun snoozeReminder(context: Context, reminderId: String, reminderTitle: String, minutes: Int) {
        try {
            val newTime = System.currentTimeMillis() + minutes * 60_000L

            // Update reminder time in SharedPreferences
            val sp = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            val json = sp.getString("call_end_reminders", null)

            if (!json.isNullOrEmpty()) {
                val reminders = mutableListOf<Map<String, Any>>()
                val arr = org.json.JSONArray(json)

                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.getString("id")

                    // Update the specific reminder's time
                    val dateTime = if (id == reminderId) newTime else obj.getLong("dateTime")

                    reminders.add(mapOf(
                        "id" to id,
                        "title" to obj.getString("title"),
                        "dateTime" to dateTime,
                        "completed" to obj.getBoolean("completed")
                    ))
                }

                // Save updated list
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

            // Reschedule the alarm
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val alarmIntent = Intent(context, ReminderReceiver::class.java).apply {
                putExtra("reminder_id", reminderId)
                putExtra("reminder_title", reminderTitle)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                reminderId.hashCode(),
                alarmIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, newTime, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, newTime, pendingIntent)
            }

            Log.d(TAG, "✅ Reminder snoozed for $minutes minutes")

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error snoozing reminder", e)
        }
    }
}
