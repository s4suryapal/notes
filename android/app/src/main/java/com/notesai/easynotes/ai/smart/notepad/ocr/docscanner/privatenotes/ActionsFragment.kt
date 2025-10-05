package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.*
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.provider.AlarmClock
import android.content.ComponentName
import org.json.JSONArray
import org.json.JSONObject

enum class ActionCategory {
    COMMUNICATION,
    SOCIAL,
    PRODUCTIVITY,
    SYSTEM,
    PROMOTION
}

data class QuickAction(
    val id: String,
    val icon: String,
    val label: String,
    val category: ActionCategory,
    val action: () -> Unit
)

class ActionsFragment : Fragment() {

    companion object {
        private const val ARG_PHONE = "arg_phone"
        private const val PREFS_KEY = "quick_actions_prefs"
        
        fun newInstance(phoneNumber: String): ActionsFragment {
            val f = ActionsFragment()
            f.arguments = Bundle().apply { putString(ARG_PHONE, phoneNumber) }
            return f
        }
    }

    private lateinit var quickActionsGrid: RecyclerView
    private lateinit var actionsAdapter: QuickActionsAdapter
    private var phoneNumber: String = ""
    private val allActions = mutableMapOf<String, QuickAction>()
    private var selectedActionIds = mutableListOf<String>()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_actions, container, false)
        phoneNumber = arguments?.getString(ARG_PHONE) ?: ""
        
        setupViews(view)
        initializeActions()
        loadSelectedActions()
        setupQuickActionsGrid()
        
        return view
    }

    private fun setupViews(view: View) {
        quickActionsGrid = view.findViewById(R.id.quickActionsGrid)
        
        // Setup RecyclerView with 3-column grid
        val layoutManager = GridLayoutManager(requireContext(), 3)
        quickActionsGrid.layoutManager = layoutManager
        
        actionsAdapter = QuickActionsAdapter { action ->
            action.action.invoke()
        }
        quickActionsGrid.adapter = actionsAdapter
        
        // Customize button
        view.findViewById<ImageView>(R.id.btnCustomize).setOnClickListener {
            showCustomizeDialog()
        }
    }

    private fun initializeActions() {
        // COMMUNICATION Category
        allActions["open_dialer"] = QuickAction(
            id = "open_dialer",
            icon = "📞",
            label = "Open Dialer",
            category = ActionCategory.COMMUNICATION
        ) { executeOpenDialer() }
        
        allActions["send_sms"] = QuickAction(
            id = "send_sms",
            icon = "💬",
            label = "Send SMS",
            category = ActionCategory.COMMUNICATION
        ) { executeSendSMS() }
        
        allActions["send_whatsapp"] = QuickAction(
            id = "send_whatsapp",
            icon = "📱",
            label = "Wh4t54pp",
            category = ActionCategory.COMMUNICATION
        ) { executeSendWhatsApp() }

        allActions["open_telegram"] = QuickAction(
            id = "open_telegram",
            icon = "📨",
            label = "T3l3gr4m",
            category = ActionCategory.COMMUNICATION
        ) { executeOpenTelegram() }
        
        allActions["send_email"] = QuickAction(
            id = "send_email",
            icon = "📧",
            label = "Send Email",
            category = ActionCategory.COMMUNICATION
        ) { executeSendEmail() }
        
        // SOCIAL Category
        allActions["snapchat"] = QuickAction(
            id = "snapchat",
            icon = "👻",
            label = "5n4pch4t",
            category = ActionCategory.SOCIAL
        ) { executeSocialMediaApp("snapchat") }
        
        allActions["instagram"] = QuickAction(
            id = "instagram",
            icon = "📷",
            label = "1n5t4gr4m",
            category = ActionCategory.SOCIAL
        ) { executeSocialMediaApp("instagram") }
        
        allActions["facebook"] = QuickAction(
            id = "facebook",
            icon = "📘",
            label = "F4c3b00k",
            category = ActionCategory.SOCIAL
        ) { executeSocialMediaApp("facebook") }
        
        allActions["youtube"] = QuickAction(
            id = "youtube",
            icon = "📺",
            label = "Y0uTub3",
            category = ActionCategory.SOCIAL
        ) { executeSocialMediaApp("youtube") }
        
        allActions["tiktok"] = QuickAction(
            id = "tiktok",
            icon = "🎵",
            label = "T1kT0k",
            category = ActionCategory.SOCIAL
        ) { executeSocialMediaApp("tiktok") }
        
        allActions["twitter"] = QuickAction(
            id = "twitter",
            icon = "❌",
            label = "X",
            category = ActionCategory.SOCIAL
        ) { executeSocialMediaApp("twitter") }
        
        // PRODUCTIVITY Category
        allActions["set_reminder"] = QuickAction(
            id = "set_reminder",
            icon = "⏰",
            label = "Reminder",
            category = ActionCategory.PRODUCTIVITY
        ) { executeSetReminder() }
        
        allActions["schedule_meeting"] = QuickAction(
            id = "schedule_meeting",
            icon = "📅",
            label = "Meeting",
            category = ActionCategory.PRODUCTIVITY
        ) { executeScheduleMeeting() }

        allActions["set_alarm"] = QuickAction(
            id = "set_alarm",
            icon = "⏲️",
            label = "Set Alarm",
            category = ActionCategory.PRODUCTIVITY
        ) { executeSetAlarm() }

        allActions["open_browser"] = QuickAction(
            id = "open_browser",
            icon = "🌐",
            label = "Browser",
            category = ActionCategory.PRODUCTIVITY
        ) { executeOpenBrowser() }
        
        // SYSTEM Category
        allActions["add_contact"] = QuickAction(
            id = "add_contact",
            icon = "👤",
            label = "Add Contact",
            category = ActionCategory.SYSTEM
        ) { executeAddContact() }
        
        // PROMOTION Category
        allActions["share_app"] = QuickAction(
            id = "share_app",
            icon = "📤",
            label = "Share App",
            category = ActionCategory.PROMOTION
        ) { executeShareApp() }
        
        allActions["rate_app"] = QuickAction(
            id = "rate_app",
            icon = "⭐",
            label = "Rate App",
            category = ActionCategory.PROMOTION
        ) { executeRateApp() }
        
    }

    private fun loadSelectedActions() {
        val prefs = requireContext().getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
        val json = prefs.getString(PREFS_KEY, null)
        
        selectedActionIds.clear()
        
        if (!json.isNullOrEmpty()) {
            try {
                val array = JSONArray(json)
                for (i in 0 until array.length()) {
                    selectedActionIds.add(array.getString(i))
                }
            } catch (_: Exception) {}
        }
        
        // Default actions if none selected (prioritizing social apps and communication)
        if (selectedActionIds.isEmpty()) {
            selectedActionIds.addAll(listOf(
                // Communication (3)
                "open_dialer", "send_sms", "send_whatsapp",
                // Social (4) - prioritized grouping
                "instagram", "snapchat", "youtube", "facebook",
                // Productivity (1)
                "open_browser"
            ))
        }
    }

    private fun saveSelectedActions() {
        val prefs = requireContext().getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
        val array = JSONArray()
        selectedActionIds.forEach { array.put(it) }
        prefs.edit().putString(PREFS_KEY, array.toString()).apply()
    }

    private fun setupQuickActionsGrid() {
        // Get the first 8 selected actions (excluding share_app and rate_app)
        val filteredSelectedIds = selectedActionIds.filter { it != "share_app" && it != "rate_app" }
        val selectedActions = filteredSelectedIds.take(8).mapNotNull { actionId ->
            allActions[actionId]
        }.toMutableList()
        
        // Randomly choose between Share App and Rate App for the last position
        val randomLastAction = if (Math.random() < 0.5) {
            allActions["share_app"]
        } else {
            allActions["rate_app"]
        }
        
        // Add the random last action
        randomLastAction?.let { selectedActions.add(it) }
        
        actionsAdapter.updateActions(selectedActions)
    }

    private fun showCustomizeDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_customize_actions, null)
        val selectionCount = dialogView.findViewById<TextView>(R.id.tvSelectionCount)
        
        // Group actions by category for better organization
        val actionsByCategory = allActions.values.groupBy { it.category }
        
        val checkBoxes = mapOf(
            // COMMUNICATION Category
            "open_dialer" to dialogView.findViewById<CheckBox>(R.id.cbCallBack),
            "send_sms" to dialogView.findViewById<CheckBox>(R.id.cbSendSMS),
            "send_whatsapp" to dialogView.findViewById<CheckBox>(R.id.cbSendWhatsApp),
            "open_telegram" to dialogView.findViewById<CheckBox>(R.id.cbTelegram),
            "send_email" to dialogView.findViewById<CheckBox>(R.id.cbSendEmail),
            
            // SOCIAL Category (grouped together)
            "snapchat" to dialogView.findViewById<CheckBox>(R.id.cbBlockNumber),
            "instagram" to dialogView.findViewById<CheckBox>(R.id.cbShareContact),
            "facebook" to dialogView.findViewById<CheckBox>(R.id.cbFacebook),
            "youtube" to dialogView.findViewById<CheckBox>(R.id.cbYoutube),
            "tiktok" to dialogView.findViewById<CheckBox>(R.id.cbTiktok),
            "twitter" to dialogView.findViewById<CheckBox>(R.id.cbTwitter),
            
            // PRODUCTIVITY Category
            "set_reminder" to dialogView.findViewById<CheckBox>(R.id.cbSetReminder),
            "schedule_meeting" to dialogView.findViewById<CheckBox>(R.id.cbScheduleMeeting),
            "set_alarm" to dialogView.findViewById<CheckBox>(R.id.cbSetAlarm),
            "open_browser" to dialogView.findViewById<CheckBox>(R.id.cbOpenBrowser),
            
            // SYSTEM Category
            "add_contact" to dialogView.findViewById<CheckBox>(R.id.cbAddContact)
        )
        
        // Set current selections
        checkBoxes.forEach { (actionId, checkBox) ->
            checkBox.isChecked = selectedActionIds.contains(actionId)
        }
        
        // Update checkbox labels to show category organization
        updateCheckBoxLabelsWithCategories(checkBoxes)
        
        fun updateSelectionCount() {
            val selectedCount = checkBoxes.values.count { it.isChecked }
            val socialSelected = checkBoxes.filter { (actionId, checkBox) -> 
                allActions[actionId]?.category == ActionCategory.SOCIAL && checkBox.isChecked
            }.size
            selectionCount.text = "$selectedCount/8 actions selected (Social: $socialSelected) + 1 fixed Share/Rate App"
        }
        
        // Add listeners to checkboxes
        checkBoxes.values.forEach { checkBox ->
            checkBox.setOnCheckedChangeListener { _, _ ->
                val selectedCount = checkBoxes.values.count { it.isChecked }
                if (selectedCount > 8) {
                    checkBox.isChecked = false
                    Toast.makeText(requireContext(), "Maximum 8 actions allowed (9th position is fixed for Share/Rate App)", Toast.LENGTH_SHORT).show()
                } else {
                    updateSelectionCount()
                }
            }
        }
        
        updateSelectionCount()
        
        AlertDialog.Builder(requireContext())
            .setTitle("Customize Quick Actions by Category")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                selectedActionIds.clear()
                checkBoxes.forEach { (actionId, checkBox) ->
                    if (checkBox.isChecked) {
                        selectedActionIds.add(actionId)
                    }
                }
                // Don't save share_app and rate_app as they're automatically handled
                selectedActionIds.removeAll(listOf("share_app", "rate_app"))
                saveSelectedActions()
                setupQuickActionsGrid()
                
                val socialCount = selectedActionIds.count { allActions[it]?.category == ActionCategory.SOCIAL }
                Toast.makeText(requireContext(), "Quick actions updated! ($socialCount social apps selected)", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancel", null)
            .create()
            .show()
    }
    
    private fun updateCheckBoxLabelsWithCategories(checkBoxes: Map<String, CheckBox>) {
        checkBoxes.forEach { (actionId, checkBox) ->
            val action = allActions[actionId]
            if (action != null) {
                val categoryPrefix = when (action.category) {
                    ActionCategory.SOCIAL -> "📱 "
                    ActionCategory.COMMUNICATION -> "💬 "
                    ActionCategory.PRODUCTIVITY -> "⚡ "
                    ActionCategory.SYSTEM -> "⚙️ "
                    ActionCategory.PROMOTION -> "🎯 "
                }
                checkBox.text = "$categoryPrefix${action.label}"
            }
        }
    }

    private fun executeAction(actionId: String) {
        allActions[actionId]?.action?.invoke()
    }

    // Action implementations
    private fun executeOpenDialer() {
        try {
            val intent = Intent(Intent.ACTION_DIAL)
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Unable to open dialer", Toast.LENGTH_SHORT).show()
        }
    }

    private fun executeSendSMS() {
        try {
            val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:"))
            intent.putExtra("sms_body", "Hi, ")
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Unable to open SMS app", Toast.LENGTH_SHORT).show()
        }
    }

    private fun executeSendWhatsApp() {
        try {
            val pm = requireContext().packageManager
            val waPackage = when {
                pm.getLaunchIntentForPackage("com.whatsapp") != null -> "com.whatsapp"
                pm.getLaunchIntentForPackage("com.whatsapp.w4b") != null -> "com.whatsapp.w4b"
                else -> null
            }

            if (waPackage != null) {
                val launchIntent = pm.getLaunchIntentForPackage(waPackage)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(launchIntent)
                } else {
                    Toast.makeText(requireContext(), "Failed to open WhatsApp", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(requireContext(), "WhatsApp is not installed", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Failed to open WhatsApp", Toast.LENGTH_SHORT).show()
        }
    }

    private fun executeSendEmail() {
        try {
            val intent = Intent(Intent.ACTION_SENDTO)
            intent.data = Uri.parse("mailto:")
            intent.putExtra(Intent.EXTRA_SUBJECT, "Follow up call")
            intent.putExtra(Intent.EXTRA_TEXT, "Hi,\n\nFollowing up on our call.\n\nBest regards")
            startActivity(Intent.createChooser(intent, "Send Email"))
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "No email app available", Toast.LENGTH_SHORT).show()
        }
    }

    private fun executeOpenTelegram() {
        try {
            val candidates = listOf(
                "org.telegram.messenger",
                "org.telegram.messenger.web",
                "org.thunderdog.challegram"
            )
            for (pkg in candidates) {
                if (openAppByPackage(pkg)) return
            }
            Toast.makeText(requireContext(), "Telegram is not installed", Toast.LENGTH_SHORT).show()
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Failed to open Telegram", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openAppByPackage(pkg: String): Boolean {
        return try {
            val pm = requireContext().packageManager
            pm.getLaunchIntentForPackage(pkg)?.let { intent ->
                intent.addCategory(Intent.CATEGORY_LAUNCHER)
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(intent)
                return true
            }
            // Try building explicit MAIN/LAUNCHER intent
            val main = Intent(Intent.ACTION_MAIN).apply {
                addCategory(Intent.CATEGORY_LAUNCHER)
                setPackage(pkg)
            }
            val matches = pm.queryIntentActivities(main, 0)
            if (!matches.isNullOrEmpty()) {
                val ri = matches[0]
                val comp = ComponentName(ri.activityInfo.packageName, ri.activityInfo.name)
                val launch = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_LAUNCHER)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    component = comp
                }
                startActivity(launch)
                true
            } else {
                false
            }
        } catch (_: Exception) { false }
    }

    private fun executeOpenBrowser() {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com"))
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "No browser available", Toast.LENGTH_SHORT).show()
        }
    }

    private fun executeSetAlarm(minutesFromNow: Int = 15) {
        // Prefer default handler and let users choose if multiple handlers exist
        val cal = java.util.Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis() + minutesFromNow * 60_000L
        }
        val hour = cal.get(java.util.Calendar.HOUR_OF_DAY)
        val minute = cal.get(java.util.Calendar.MINUTE)

        val setIntent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, "Call back reminder")
            putExtra(AlarmClock.EXTRA_SKIP_UI, false) // open UI; safer across OEMs
        }

        val pm = requireContext().packageManager
        if (setIntent.resolveActivity(pm) != null) {
            // Show chooser so the user can pick their preferred Clock app if multiple exist
            startActivity(Intent.createChooser(setIntent, "Set alarm"))
            return
        }

        val showIntent = Intent(AlarmClock.ACTION_SHOW_ALARMS)
        if (showIntent.resolveActivity(pm) != null) {
            startActivity(showIntent)
            return
        }

        Toast.makeText(requireContext(), "No compatible clock app found", Toast.LENGTH_SHORT).show()
    }

    private fun executeAddContact() {
        try {
            val intent = Intent(Intent.ACTION_INSERT)
            intent.type = "vnd.android.cursor.dir/contact"
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Unable to open contacts", Toast.LENGTH_SHORT).show()
        }
    }

    // Removed executeCallHistory as call_history action was removed

    private fun executeShareApp() {
        try {
            val intent = Intent(Intent.ACTION_SEND)
            intent.type = "text/plain"
            intent.putExtra(Intent.EXTRA_TEXT, "Check out this awesome app: NotesAI Anywhere Inbox")
            intent.putExtra(Intent.EXTRA_SUBJECT, "NotesAI App Recommendation")
            startActivity(Intent.createChooser(intent, "Share App"))
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "Unable to share", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun executeRateApp() {
        try {
            val packageName = requireContext().packageName
            val uri = Uri.parse("market://details?id=$packageName")
            val intent = Intent(Intent.ACTION_VIEW, uri)
            intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY or Intent.FLAG_ACTIVITY_NEW_DOCUMENT or Intent.FLAG_ACTIVITY_MULTIPLE_TASK)
            startActivity(intent)
        } catch (_: Exception) {
            // Play Store not available, try web browser
            try {
                val packageName = requireContext().packageName
                val uri = Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
                val intent = Intent(Intent.ACTION_VIEW, uri)
                startActivity(intent)
            } catch (_: Exception) {
                Toast.makeText(requireContext(), "Unable to open Play Store", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun executeSetReminder() {
        // Open the reminders tab
        Toast.makeText(requireContext(), "Switch to Reminders tab to set a reminder", Toast.LENGTH_SHORT).show()
    }


    private fun executeScheduleMeeting() {
        try {
            val intent = Intent(Intent.ACTION_INSERT)
            intent.data = Uri.parse("content://com.android.calendar/events")
            intent.putExtra("title", "Follow-up Meeting")
            intent.putExtra("description", "Meeting scheduled from call")
            startActivity(intent)
        } catch (_: Exception) {
            Toast.makeText(requireContext(), "No calendar app available", Toast.LENGTH_SHORT).show()
        }
    }

    private fun executeSocialMediaApp(appType: String) {
        try {
            val intent = when (appType) {
                "snapchat" -> {
                    // Try generic intent first
                    Intent().apply {
                        action = Intent.ACTION_MAIN
                        addCategory(Intent.CATEGORY_LAUNCHER)
                        type = "vnd.android.cursor.dir/person"
                        // Use action that Snapchat typically handles
                        data = Uri.parse("https://www.snapchat.com")
                    }
                }
                "instagram" -> {
                    Intent().apply {
                        action = Intent.ACTION_VIEW
                        data = Uri.parse("https://www.instagram.com")
                    }
                }
                "facebook" -> {
                    Intent().apply {
                        action = Intent.ACTION_VIEW
                        data = Uri.parse("https://www.facebook.com")
                    }
                }
                "youtube" -> {
                    Intent().apply {
                        action = Intent.ACTION_VIEW
                        data = Uri.parse("https://www.youtube.com")
                    }
                }
                "tiktok" -> {
                    Intent().apply {
                        action = Intent.ACTION_VIEW
                        data = Uri.parse("https://www.tiktok.com")
                    }
                }
                "twitter" -> {
                    Intent().apply {
                        action = Intent.ACTION_VIEW
                        data = Uri.parse("https://twitter.com")
                    }
                }
                else -> null
            }
            
            intent?.let { 
                // First try to find app-specific handler
                val pm = requireContext().packageManager
                val resolveInfos = pm.queryIntentActivities(it, 0)
                
                // Look for actual app (not browser)
                val appIntent = resolveInfos.find { info ->
                    !info.activityInfo.packageName.contains("browser") &&
                    !info.activityInfo.packageName.contains("chrome") &&
                    info.activityInfo.packageName.contains(appType, ignoreCase = true)
                }
                
                if (appIntent != null) {
                    // Launch the actual app
                    val launchIntent = Intent(it).apply {
                        setPackage(appIntent.activityInfo.packageName)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(launchIntent)
                } else {
                    // Fallback to browser/web version
                    startActivity(Intent.createChooser(it, "Open ${appType.capitalize()}"))
                }
            } ?: run {
                Toast.makeText(requireContext(), "Unable to open $appType", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Unable to open $appType", Toast.LENGTH_SHORT).show()
        }
    }
    
    // Removed deprecated actions: app settings, take note, feedback, help
}

class QuickActionsAdapter(
    private val onActionClick: (QuickAction) -> Unit
) : RecyclerView.Adapter<QuickActionsAdapter.ActionViewHolder>() {
    
    private var actions = listOf<QuickAction>()
    
    fun updateActions(newActions: List<QuickAction>) {
        actions = newActions
        notifyDataSetChanged()
    }
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ActionViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_quick_action, parent, false)
        return ActionViewHolder(view)
    }
    
    override fun onBindViewHolder(holder: ActionViewHolder, position: Int) {
        holder.bind(actions[position])
    }
    
    override fun getItemCount() = actions.size
    
    inner class ActionViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val iconText: TextView = itemView.findViewById(R.id.actionIcon)
        private val labelText: TextView = itemView.findViewById(R.id.actionLabel)
        
        fun bind(action: QuickAction) {
            iconText.text = action.icon
            labelText.text = action.label
            
            itemView.setOnClickListener {
                onActionClick(action)
            }
        }
    }
}
