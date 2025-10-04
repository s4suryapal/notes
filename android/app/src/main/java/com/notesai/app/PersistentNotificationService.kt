package com.notesai.app

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class PersistentNotificationService : Service() {

    companion object {
        private const val CHANNEL_ID = "persistent_notes_channel"
        private const val NOTIFICATION_ID = 1001

        const val ACTION_TEXT_NOTE = "com.notesai.app.ACTION_TEXT_NOTE"
        const val ACTION_PHOTO_NOTE = "com.notesai.app.ACTION_PHOTO_NOTE"
        const val ACTION_AUDIO_NOTE = "com.notesai.app.ACTION_AUDIO_NOTE"

        fun start(context: Context) {
            val intent = Intent(context, PersistentNotificationService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, PersistentNotificationService::class.java)
            context.stopService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Quick Notes",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent notification for quick note actions"
                setShowBadge(false)
                setSound(null, null)
                enableLights(false)
                enableVibration(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        // Create pending intents for actions
        val textNoteIntent = Intent(this, MainActivity::class.java).apply {
            action = ACTION_TEXT_NOTE
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val textNotePendingIntent = PendingIntent.getActivity(
            this, 0, textNoteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val photoNoteIntent = Intent(this, MainActivity::class.java).apply {
            action = ACTION_PHOTO_NOTE
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val photoNotePendingIntent = PendingIntent.getActivity(
            this, 1, photoNoteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val audioNoteIntent = Intent(this, MainActivity::class.java).apply {
            action = ACTION_AUDIO_NOTE
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val audioNotePendingIntent = PendingIntent.getActivity(
            this, 2, audioNoteIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Main tap intent
        val mainIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val mainPendingIntent = PendingIntent.getActivity(
            this, 3, mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("NotesAI")
            .setContentText("Quick note actions")
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(mainPendingIntent)
            .addAction(
                android.R.drawable.ic_menu_edit,
                "📝 Note",
                textNotePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_camera,
                "📷 Photo",
                photoNotePendingIntent
            )
            .addAction(
                android.R.drawable.ic_btn_speak_now,
                "🎤 Audio",
                audioNotePendingIntent
            )
            .build()
    }
}
