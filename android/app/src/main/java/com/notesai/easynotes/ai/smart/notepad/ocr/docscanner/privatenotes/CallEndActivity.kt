package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import androidx.fragment.app.FragmentActivity
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.os.Build
import android.view.WindowManager
import android.widget.TextView
import android.widget.ImageView
import android.graphics.Color
import androidx.viewpager2.widget.ViewPager2
import com.google.android.material.tabs.TabLayout
import com.google.android.material.tabs.TabLayoutMediator
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.util.Locale
import java.text.SimpleDateFormat
import java.util.Date

class CallEndActivity : FragmentActivity() {

    companion object {
        private const val TAG = "CallEndActivity"
        const val EXTRA_DURATION = "duration"
        const val EXTRA_CALL_TYPE = "call_type"
        const val EXTRA_TIMESTAMP = "timestamp"

        fun createIntent(
            context: Context,
            duration: Long,
            callType: String,
            timestamp: Long
        ): Intent {
            return Intent(context, CallEndActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                       Intent.FLAG_ACTIVITY_CLEAR_TOP or
                       Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra(EXTRA_DURATION, duration)
                putExtra(EXTRA_CALL_TYPE, callType)
                putExtra(EXTRA_TIMESTAMP, timestamp)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set up activity to show over other apps
        setupOverlayActivity()

        // Configure keyboard handling
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN)

        // Set status bar color to app's primary color (modern approach)
        try {
            window.statusBarColor = Color.parseColor("#4A90E2")

            // Use WindowInsetsController for modern status bar styling
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val insetsController = WindowCompat.getInsetsController(window, window.decorView)
            insetsController?.isAppearanceLightStatusBars = false // Dark icons on light background
        } catch (e: Exception) {
        }

        // Set content view from XML layout
        setContentView(R.layout.activity_call_end)

        initializeUI()
    }

    private fun initializeUI() {
        // Get call info from intent
        val duration = intent.getLongExtra(EXTRA_DURATION, 0)
        val callType = intent.getStringExtra(EXTRA_CALL_TYPE) ?: ""
        val timestamp = intent.getLongExtra(EXTRA_TIMESTAMP, System.currentTimeMillis())

        // Update header UI
        val titleText = findViewById<TextView>(R.id.titleText)
        val timeText = findViewById<TextView>(R.id.timeText)
        val statusText = findViewById<TextView>(R.id.statusText)
        val durationText = findViewById<TextView>(R.id.durationText)
        val callStatusDot = findViewById<android.view.View>(R.id.callStatusDot)
        val appLogo = findViewById<ImageView>(R.id.appLogo)

        // Always show "Private Number" as we don't have phone number permission
        titleText.text = "Private Number"

        val dateTimeInfo = formatDateAndTime(timestamp)
        timeText.text = "${dateTimeInfo.first}, ${dateTimeInfo.second}"

        durationText.text = formatDuration(duration)

        val callTypeText = when (callType.lowercase()) {
            "incoming" -> "Incoming Call"
            "outgoing" -> "Outgoing Call"
            "missed" -> "Missed Call"
            else -> "Call"
        }
        statusText.text = callTypeText

        // Set call status dot color
        val dotColor = when (callType.lowercase()) {
            "incoming" -> Color.parseColor("#00C49A")
            "outgoing" -> Color.parseColor("#4A90E2")
            "missed" -> Color.parseColor("#FF6B6B")
            else -> Color.parseColor("#00C49A")
        }
        callStatusDot.setBackgroundTintList(android.content.res.ColorStateList.valueOf(dotColor))

        // App logo click listener to open main app
        appLogo.setOnClickListener {
            openMainApp()
        }

        // Setup tabs
        setupTabs()
    }

    private fun setupTabs() {
        try {
            val tabLayout = findViewById<TabLayout>(R.id.tabLayout)
            val viewPager = findViewById<ViewPager2>(R.id.viewPager)

            val adapter = CallEndPagerAdapter(this)
            viewPager.adapter = adapter

            TabLayoutMediator(tabLayout, viewPager) { tab, position ->
                when (position) {
                    0 -> {
                        tab.setIcon(R.drawable.ic_tab_notes)
                        tab.contentDescription = "Notes"
                    }
                    1 -> {
                        tab.setIcon(R.drawable.ic_tab_message)
                        tab.contentDescription = "Messages"
                    }
                    2 -> {
                        tab.setIcon(R.drawable.ic_tab_reminder)
                        tab.contentDescription = "Reminders"
                    }
                    3 -> {
                        tab.setIcon(R.drawable.ic_tab_actions)
                        tab.contentDescription = "Actions"
                    }
                }
            }.attach()

        } catch (e: Exception) {
        }
    }

    private fun setupOverlayActivity() {
        // Configure window to show over other apps / lock screen (modern approach)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            // Use modern methods for Android 8.1+
            try {
                setShowWhenLocked(true)
                setTurnScreenOn(true)
            } catch (_: Exception) {}
        } else {
            // Fallback for older versions
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        // Keep screen on (not deprecated)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    private fun openMainApp() {
        try {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
            finish()
        } catch (e: Exception) {
        }
    }

    private fun formatDuration(seconds: Long): String {
        val minutes = seconds / 60
        val remainingSeconds = seconds % 60
        return "%d:%02d".format(minutes, remainingSeconds)
    }

    private fun formatDateAndTime(timestamp: Long): Pair<String, String> {
        val date = java.util.Date(timestamp)

        val dayFormat = java.text.SimpleDateFormat("EEE", Locale.getDefault())
        val dayText = dayFormat.format(date)

        val timeFormat = java.text.SimpleDateFormat("h:mm a", Locale.getDefault())
        val timeText = timeFormat.format(date)

        return Pair(dayText, timeText)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
    }

    override fun onDestroy() {
        super.onDestroy()

        // Clear call info from SharedPreferences when activity is destroyed
        try {
            val sharedPrefs = getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            sharedPrefs.edit().clear().apply()
        } catch (e: Exception) {
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }
}
