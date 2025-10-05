package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.preference.PreferenceManager

class CallReceiver : BroadcastReceiver() {

    companion object {
        private var wasCallActive = false
        private var incomingNumber: String? = ""
        private var callStartTime: Long = 0
    }

    override fun onReceive(context: Context, intent: Intent) {

        if (intent.action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)

            when (state) {
                TelephonyManager.EXTRA_STATE_RINGING -> {
                    incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
                    callStartTime = System.currentTimeMillis()
                    wasCallActive = false
                }

                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                    if (incomingNumber == null) {
                        incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
                    }
                    if (callStartTime == 0L) {
                        callStartTime = System.currentTimeMillis()
                    }
                    wasCallActive = true
                }

                TelephonyManager.EXTRA_STATE_IDLE -> {

                    if (wasCallActive) {
                        wasCallActive = false

                        val duration = if (callStartTime > 0) {
                            (System.currentTimeMillis() - callStartTime) / 1000
                        } else {
                            0
                        }

                        try {
                            val callType = if (incomingNumber != null && incomingNumber!!.isNotEmpty()) "incoming" else "outgoing"
                            val sharedPrefs = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
                            sharedPrefs.edit().apply {
                                putString("lastCallNumber", incomingNumber ?: "")
                                putString("lastCallType", callType)
                                putLong("lastCallDuration", duration)
                                putLong("lastCallTime", System.currentTimeMillis())
                                putBoolean("showCallEndScreen", true)
                                apply()
                            }
                        } catch (e: Exception) {
                            // Silent failure
                        }

                        val defaultSharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
                        val showAfterCallScreen = defaultSharedPreferences.getBoolean("prefAfterCallScreen", true)

                        if (showAfterCallScreen) {
                            val callType = if (incomingNumber != null && incomingNumber!!.isNotEmpty()) "incoming" else "outgoing"

                            try {
                                val activityIntent = CallEndActivity.createIntent(
                                    context,
                                    incomingNumber,
                                    duration,
                                    callType,
                                    System.currentTimeMillis()
                                )
                                try {
                                    context.startActivity(activityIntent)
                                } catch (ae: Exception) {
                                    val serviceIntent = CallEndService.createIntent(
                                        context,
                                        incomingNumber,
                                        duration,
                                        callType,
                                        System.currentTimeMillis()
                                    )
                                    context.startService(serviceIntent)
                                }
                            } catch (e: Exception) {
                                try {
                                    Thread.sleep(500)
                                    val retryIntent = CallEndService.createIntent(
                                        context,
                                        incomingNumber,
                                        duration,
                                        callType,
                                        System.currentTimeMillis()
                                    )
                                    context.startService(retryIntent)
                                } catch (retryException: Exception) {
                                    // Silent failure
                                }
                            }
                        }

                        callStartTime = 0
                        incomingNumber = null
                    } else {
                        try {
                            if (callStartTime > 0) {
                                val duration = 0L
                                val callType = "incoming"
                                val sharedPrefs = context.getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
                                sharedPrefs.edit().apply {
                                    putString("lastCallNumber", incomingNumber ?: "")
                                    putString("lastCallType", callType)
                                    putLong("lastCallDuration", duration)
                                    putLong("lastCallTime", System.currentTimeMillis())
                                    putBoolean("showCallEndScreen", true)
                                    apply()
                                }
                                val defaultSharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
                                val showAfterCallScreen = defaultSharedPreferences.getBoolean("prefAfterCallScreen", true)
                                if (showAfterCallScreen) {
                                    try {
                                        val activityIntent = CallEndActivity.createIntent(
                                            context,
                                            incomingNumber,
                                            duration,
                                            callType,
                                            System.currentTimeMillis()
                                        )
                                        context.startActivity(activityIntent)
                                    } catch (e: Exception) {
                                        val serviceIntent = CallEndService.createIntent(
                                            context,
                                            incomingNumber,
                                            duration,
                                            callType,
                                            System.currentTimeMillis()
                                        )
                                        context.startService(serviceIntent)
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            // Silent failure
                        }
                    }
                }
            }
        }
    }

}
