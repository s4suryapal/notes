package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray

/**
 * BootReceiver - Reschedules all active reminders after device reboot
 *
 * When the device reboots, all AlarmManager alarms are cleared by the system.
 * This receiver listens for BOOT_COMPLETED and reschedules all pending reminders
 * from SharedPreferences storage.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
        private const val SP_KEY = "call_end_reminders"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) {
            return
        }

        Log.d(TAG, "📱 Device rebooted - rescheduling reminders")

        try {
            val sp = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            val json = sp.getString(SP_KEY, null)

            if (json.isNullOrEmpty()) {
                Log.d(TAG, "No reminders to reschedule")
                return
            }

            val arr = JSONArray(json)
            var rescheduled = 0
            val currentTime = System.currentTimeMillis()

            for (i in 0 until arr.length()) {
                try {
                    val obj = arr.getJSONObject(i)
                    val id = obj.getString("id")
                    val title = obj.getString("title")
                    val dateTime = obj.getLong("dateTime")
                    val completed = obj.getBoolean("completed")

                    // Only reschedule reminders that are:
                    // 1. Not completed
                    // 2. Still in the future
                    if (!completed && dateTime > currentTime) {
                        scheduleReminder(context, id, title, dateTime)
                        rescheduled++
                        Log.d(TAG, "✅ Rescheduled reminder: $title at $dateTime")
                    } else {
                        Log.d(TAG, "⏭️ Skipped reminder: completed=$completed, past=${dateTime <= currentTime}")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ Error processing reminder at index $i", e)
                }
            }

            Log.d(TAG, "📱 Rescheduled $rescheduled reminders after boot")

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error rescheduling reminders after boot", e)
        }
    }

    private fun scheduleReminder(context: Context, id: String, title: String, dateTime: Long) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, ReminderReceiver::class.java).apply {
                putExtra("reminder_id", id)
                putExtra("reminder_title", title)
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                id.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Use setExactAndAllowWhileIdle for Android M+ to ensure alarm fires even in Doze mode
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    dateTime,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    dateTime,
                    pendingIntent
                )
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "❌ SecurityException: Unable to schedule exact alarm. Permission needed.", e)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error scheduling reminder: $id", e)
        }
    }
}
