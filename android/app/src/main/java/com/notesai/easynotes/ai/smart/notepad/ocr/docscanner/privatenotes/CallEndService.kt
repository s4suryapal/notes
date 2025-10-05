package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.Service
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class CallEndService : Service() {

    companion object {
        private const val TAG = "CallEndService"
        const val ACTION_SHOW_CALL_END = "show_call_end"
        const val EXTRA_PHONE_NUMBER = "phone_number"
        const val EXTRA_DURATION = "duration"
        const val EXTRA_CALL_TYPE = "call_type"
        const val EXTRA_TIMESTAMP = "timestamp"

        fun createIntent(
            context: Context,
            phoneNumber: String?,
            duration: Long,
            callType: String,
            timestamp: Long
        ): Intent {
            return Intent(context, CallEndService::class.java).apply {
                action = ACTION_SHOW_CALL_END
                putExtra(EXTRA_PHONE_NUMBER, phoneNumber ?: "")
                putExtra(EXTRA_DURATION, duration)
                putExtra(EXTRA_CALL_TYPE, callType)
                putExtra(EXTRA_TIMESTAMP, timestamp)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {

        if (intent?.action == ACTION_SHOW_CALL_END) {
            val phoneNumber = intent.getStringExtra(EXTRA_PHONE_NUMBER) ?: ""
            val duration = intent.getLongExtra(EXTRA_DURATION, 0)
            val callType = intent.getStringExtra(EXTRA_CALL_TYPE) ?: "unknown"
            val timestamp = intent.getLongExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())

            launchCallEndScreen(phoneNumber, duration, callType, timestamp)
        }

        return START_NOT_STICKY
    }

    private fun launchCallEndScreen(phoneNumber: String, duration: Long, callType: String, timestamp: Long) {
        try {
            // Launch native CallEndActivity
            val intent = CallEndActivity.createIntent(this, phoneNumber, duration, callType, timestamp).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            }
            startActivity(intent)

        } catch (e: Exception) {
            // Fallback: show notification
            try {
                showHeadsUpFallbackNotification(phoneNumber, duration, callType, timestamp)
            } catch (ne: Exception) {
            }
        }

        // Always stop service immediately
        stopSelf()
    }

    private fun showHeadsUpFallbackNotification(phoneNumber: String, duration: Long, callType: String, timestamp: Long) {
        val channelId = "call_end_alert"
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Call End Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Immediate call end alerts"
                enableVibration(true)
            }
            manager.createNotificationChannel(channel)
        }

        val intent = CallEndActivity.createIntent(this, phoneNumber, duration, callType, timestamp).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val pi = android.app.PendingIntent.getActivity(
            this,
            2002,
            intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Call ended: ${if (phoneNumber.isNotEmpty()) phoneNumber else "Unknown"}")
            .setContentText("Tap to open notes")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(pi)
            .setFullScreenIntent(pi, true)
            .build()

        NotificationManagerCompat.from(this).notify(2002, notif)

        // Auto-cancel after a few seconds
        Handler(Looper.getMainLooper()).postDelayed({
            try { NotificationManagerCompat.from(this).cancel(2002) } catch (_: Exception) {}
        }, 6000)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
    }
}
