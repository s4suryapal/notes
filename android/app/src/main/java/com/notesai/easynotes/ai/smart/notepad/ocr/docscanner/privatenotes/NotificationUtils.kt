package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

object NotificationUtils {
    const val CHANNEL_ID = "call_end_reminders"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (mgr.getNotificationChannel(CHANNEL_ID) == null) {
                val ch = NotificationChannel(CHANNEL_ID, "Call End Reminders", NotificationManager.IMPORTANCE_HIGH)
                ch.description = "Reminders scheduled from call end actions"
                mgr.createNotificationChannel(ch)
            }
        }
    }
}
