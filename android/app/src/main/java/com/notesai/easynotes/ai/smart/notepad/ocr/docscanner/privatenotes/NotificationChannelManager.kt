package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi

/**
 * NotificationChannelManager - Centralized notification channel management
 *
 * Following Google's best practices:
 * - Create channels once at app startup (not in BroadcastReceiver)
 * - Provide clear channel names and descriptions
 * - Set appropriate importance levels
 * - Allow users to customize channel settings
 *
 * Reference: https://developer.android.com/develop/ui/views/notifications/channels
 */
object NotificationChannelManager {

    /**
     * Notification Channel IDs
     */
    object ChannelId {
        const val REMINDERS = "note_reminders"
        const val CALL_ALERTS = "call_alerts"
        const val GENERAL = "general_notifications"
        const val FCM = "fcm_notifications"  // Firebase Cloud Messaging
    }

    /**
     * Channel Names (user-visible)
     */
    object ChannelName {
        const val REMINDERS = "Note Reminders"
        const val CALL_ALERTS = "Call Alerts"
        const val GENERAL = "General Notifications"
        const val FCM = "Push Notifications"
    }

    /**
     * Channel Descriptions (user-visible)
     */
    object ChannelDescription {
        const val REMINDERS = "Notifications for scheduled note reminders"
        const val CALL_ALERTS = "Quick access to notes after phone calls"
        const val GENERAL = "General app notifications and updates"
        const val FCM = "Important updates and notifications from NotesAI"
    }

    /**
     * Initialize all notification channels
     * Call this once in Application.onCreate() or MainActivity.onCreate()
     */
    fun createNotificationChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Create all channels
            createReminderChannel(notificationManager)
            createCallAlertsChannel(notificationManager)
            createGeneralChannel(notificationManager)
            createFCMChannel(notificationManager)
        }
    }

    /**
     * Create Note Reminders Channel
     * High importance: Shows heads-up notification, makes sound
     */
    @RequiresApi(Build.VERSION_CODES.O)
    private fun createReminderChannel(notificationManager: NotificationManager) {
        val channel = NotificationChannel(
            ChannelId.REMINDERS,
            ChannelName.REMINDERS,
            NotificationManager.IMPORTANCE_HIGH // Heads-up notification
        ).apply {
            description = ChannelDescription.REMINDERS
            enableVibration(true)
            vibrationPattern = longArrayOf(0, 250, 250, 250)
            setShowBadge(true)
            enableLights(true)
            lightColor = 0xFF4A90E2.toInt() // NotesAI blue
        }

        notificationManager.createNotificationChannel(channel)
    }

    /**
     * Create Call Alerts Channel
     * High importance: Shows heads-up notification, makes sound
     */
    @RequiresApi(Build.VERSION_CODES.O)
    private fun createCallAlertsChannel(notificationManager: NotificationManager) {
        val channel = NotificationChannel(
            ChannelId.CALL_ALERTS,
            ChannelName.CALL_ALERTS,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = ChannelDescription.CALL_ALERTS
            enableVibration(true)
            setShowBadge(true)
            enableLights(true)
            lightColor = 0xFF00C49A.toInt() // NotesAI accent green
        }

        notificationManager.createNotificationChannel(channel)
    }

    /**
     * Create General Notifications Channel
     * Default importance: Shows notification, makes sound
     */
    @RequiresApi(Build.VERSION_CODES.O)
    private fun createGeneralChannel(notificationManager: NotificationManager) {
        val channel = NotificationChannel(
            ChannelId.GENERAL,
            ChannelName.GENERAL,
            NotificationManager.IMPORTANCE_DEFAULT // Standard notification
        ).apply {
            description = ChannelDescription.GENERAL
            setShowBadge(true)
        }

        notificationManager.createNotificationChannel(channel)
    }

    /**
     * Create Firebase Cloud Messaging Channel
     * High importance for important push notifications
     */
    @RequiresApi(Build.VERSION_CODES.O)
    private fun createFCMChannel(notificationManager: NotificationManager) {
        val channel = NotificationChannel(
            ChannelId.FCM,
            ChannelName.FCM,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = ChannelDescription.FCM
            enableVibration(true)
            setShowBadge(true)
            enableLights(true)
            lightColor = 0xFFFFD54F.toInt() // NotesAI secondary yellow
        }

        notificationManager.createNotificationChannel(channel)
    }

    /**
     * Open notification channel settings for user customization
     * Following Google's best practice: Allow users to easily access channel settings
     */
    fun openChannelSettings(context: Context, channelId: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val intent = android.content.Intent(android.provider.Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).apply {
                putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, context.packageName)
                putExtra(android.provider.Settings.EXTRA_CHANNEL_ID, channelId)
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } else {
            // For older Android versions, open app notification settings
            val intent = android.content.Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, context.packageName)
                flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    /**
     * Check if notifications are enabled for a specific channel
     */
    fun areNotificationsEnabled(context: Context, channelId: String): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channel = notificationManager.getNotificationChannel(channelId)
            return channel?.importance != NotificationManager.IMPORTANCE_NONE
        }
        return true // Pre-O always enabled
    }

    /**
     * Check if notifications are enabled at app level
     */
    fun areAppNotificationsEnabled(context: Context): Boolean {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            notificationManager.areNotificationsEnabled()
        } else {
            true
        }
    }
}
