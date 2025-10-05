package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.PendingIntent
import android.app.TaskStackBuilder
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class ReminderReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ReminderReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getStringExtra("reminder_id") ?: return
        val reminderTitle = intent.getStringExtra("reminder_title") ?: "Reminder"

        Log.d(TAG, "🔔 Reminder triggered: $reminderTitle (ID: $reminderId)")

        showNotification(context, reminderId, reminderTitle)
        deleteReminderFromStorage(context, reminderId)
    }

    private fun showNotification(context: Context, reminderId: String, reminderTitle: String) {
        try {
            val resultIntent = Intent(context, MainActivity::class.java).apply {
                putExtra("openReminders", true)
                putExtra("reminderId", reminderId)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = TaskStackBuilder.create(context).run {
                addNextIntentWithParentStack(resultIntent)
                getPendingIntent(
                    reminderId.hashCode(),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }

            val builder = NotificationCompat.Builder(context, "reminders_channel")
                .setSmallIcon(R.drawable.ic_stat_ic_notification)
                .setContentTitle("⏰ Reminder")
                .setContentText(reminderTitle)
                .setStyle(NotificationCompat.BigTextStyle().bigText(reminderTitle))
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

    private fun deleteReminderFromStorage(context: Context, reminderId: String) {
        try {
            val sp = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            val json = sp.getString("call_end_reminders", null)

            if (!json.isNullOrEmpty()) {
                val reminders = mutableListOf<Map<String, Any>>()

                val arr = org.json.JSONArray(json)
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.getString("id")

                    if (id != reminderId) {
                        reminders.add(mapOf(
                            "id" to id,
                            "title" to obj.getString("title"),
                            "dateTime" to obj.getLong("dateTime"),
                            "completed" to obj.getBoolean("completed")
                        ))
                    }
                }

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
