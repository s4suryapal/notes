package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*

data class ReminderItem(
    val id: String,
    val title: String,
    val dateTime: Long,
    val completed: Boolean
)

class ReminderAdapter(
    private val items: MutableList<ReminderItem>,
    private val onComplete: (ReminderItem) -> Unit,
    private val onDelete: (ReminderItem) -> Unit,
    private val onEdit: (ReminderItem) -> Unit,
    private val onSnooze: (ReminderItem, Int) -> Unit
) : RecyclerView.Adapter<ReminderAdapter.Holder>() {

    inner class Holder(view: View) : RecyclerView.ViewHolder(view) {
        val title = view.findViewById<TextView>(R.id.reminderTitle)
        val dateTime = view.findViewById<TextView>(R.id.reminderDateTime)
        val btnComplete = view.findViewById<Button>(R.id.btnComplete)
        val btnDelete = view.findViewById<Button>(R.id.btnDelete)
        val btnSnooze = view.findViewById<Button>(R.id.btnSnooze)
        val menuOptions = view.findViewById<ImageView>(R.id.menuOptions)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): Holder {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_reminder, parent, false)
        return Holder(v)
    }

    override fun onBindViewHolder(holder: Holder, position: Int) {
        val item = items[position]
        holder.title.text = item.title

        val dateFormat = SimpleDateFormat("dd-MM-yyyy HH:mm", Locale.getDefault())
        holder.dateTime.text = dateFormat.format(Date(item.dateTime))

        // Visual state for completed reminders
        if (item.completed) {
            holder.title.alpha = 0.5f
            holder.dateTime.alpha = 0.5f
            holder.btnComplete.text = "Completed"
            holder.btnComplete.isEnabled = false
            holder.btnComplete.alpha = 0.5f
        } else {
            holder.title.alpha = 1.0f
            holder.dateTime.alpha = 1.0f
            holder.btnComplete.text = "Complete"
            holder.btnComplete.isEnabled = true
            holder.btnComplete.alpha = 1.0f
        }

        holder.btnComplete.setOnClickListener { onComplete(item) }
        holder.btnDelete.setOnClickListener { onDelete(item) }

        // Allow editing by tapping the date/time text
        holder.dateTime.setOnClickListener { onEdit(item) }
        holder.title.setOnClickListener { onEdit(item) }

        // Snooze options via popup menu
        holder.btnSnooze.setOnClickListener { v ->
            try {
                val popup = android.widget.PopupMenu(v.context, v)
                popup.menu.add(0, 10, 0, "Snooze 10 min")
                popup.menu.add(0, 30, 1, "Snooze 30 min")
                popup.menu.add(0, 60, 2, "Snooze 1 hour")
                popup.setOnMenuItemClickListener { mi ->
                    onSnooze(item, mi.itemId)
                    true
                }
                popup.show()
            } catch (_: Exception) {
                onSnooze(item, 10)
            }
        }

        // Overflow menu for edit and delete
        holder.menuOptions.setOnClickListener { v ->
            try {
                val popup = android.widget.PopupMenu(v.context, v)
                popup.menu.add("Edit")
                popup.menu.add("Snooze 30 min")
                popup.menu.add("Delete")
                popup.setOnMenuItemClickListener { mi ->
                    when (mi.title?.toString()) {
                        "Edit" -> onEdit(item)
                        "Snooze 30 min" -> onSnooze(item, 30)
                        "Delete" -> onDelete(item)
                    }
                    true
                }
                popup.show()
            } catch (_: Exception) {
                onEdit(item)
            }
        }
    }

    override fun getItemCount(): Int = items.size
}

class RemindersFragment : Fragment() {

    companion object {
        private const val SP_KEY = "call_end_reminders"
        fun newInstance() = RemindersFragment()
    }

    private lateinit var recycler: RecyclerView
    private lateinit var adapter: ReminderAdapter
    private val items: MutableList<ReminderItem> = mutableListOf()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_reminders, container, false)

        setupRecyclerView(view)
        setupAddButton(view)
        loadReminders()
        updateEmptyState()

        return view
    }

    override fun onResume() {
        super.onResume()
        loadReminders()
    }

    private fun setupRecyclerView(view: View) {
        recycler = view.findViewById(R.id.recyclerReminders)
        recycler.layoutManager = LinearLayoutManager(requireContext())

        adapter = ReminderAdapter(
            items,
            onComplete = { item -> completeReminder(item) },
            onDelete = { item -> deleteReminder(item) },
            onEdit = { item -> editReminder(item) },
            onSnooze = { item, minutes -> snoozeReminder(item, minutes) }
        )
        recycler.adapter = adapter
    }

    private fun setupAddButton(view: View) {
        view.findViewById<View>(R.id.btnAddReminder)?.setOnClickListener {
            showAddReminderDialog()
        }
        view.findViewById<View>(R.id.btnCreateFirst)?.setOnClickListener {
            showAddReminderDialog()
        }
        view.findViewById<View>(R.id.cardCallBack)?.setOnClickListener {
            addReminderQuick("Call back", minutesFromNow = 15)
        }
        view.findViewById<View>(R.id.cardFollowUp)?.setOnClickListener {
            addReminderQuick("Follow up", minutesFromNow = 30)
        }
        view.findViewById<View>(R.id.cardMeeting)?.setOnClickListener {
            addReminderQuick("Schedule meeting", minutesFromNow = 60)
        }
    }

    private fun addReminderQuick(title: String, minutesFromNow: Int) {
        val whenMs = System.currentTimeMillis() + minutesFromNow * 60_000L
        val item = ReminderItem(UUID.randomUUID().toString(), title, whenMs, false)
        items.add(0, item)
        if (::adapter.isInitialized) adapter.notifyItemInserted(0)
        recycler.scrollToPosition(0)
        scheduleNotification(item)
        persistReminders()
        Toast.makeText(requireContext(), "Reminder added for $minutesFromNow min", Toast.LENGTH_SHORT).show()
    }

    private fun showAddReminderDialog() {
        showReminderDialog(existing = null)
    }

    private fun showReminderDialog(existing: ReminderItem?) {
        val context = requireContext()

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24.dp(), 16.dp(), 24.dp(), 8.dp())
        }

        val titleInput = EditText(context).apply {
            hint = "What should we remind you about?"
            setText(existing?.title ?: "")
        }
        container.addView(titleInput)

        val cal = Calendar.getInstance().apply {
            timeInMillis = existing?.dateTime ?: (System.currentTimeMillis() + 60 * 60 * 1000)
        }

        val dateRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 16.dp(), 0, 8.dp())
        }
        val dateLabel = TextView(context).apply { text = "Date:" }
        val dateValue = TextView(context).apply {
            setPadding(16.dp(), 0, 0, 0)
            text = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault()).format(Date(cal.timeInMillis))
        }
        dateRow.addView(dateLabel)
        dateRow.addView(dateValue)
        container.addView(dateRow)

        val timeRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 8.dp(), 0, 8.dp())
        }
        val timeLabel = TextView(context).apply { text = "Time:" }
        val timeValue = TextView(context).apply {
            setPadding(16.dp(), 0, 0, 0)
            text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(cal.timeInMillis))
        }
        timeRow.addView(timeLabel)
        timeRow.addView(timeValue)
        container.addView(timeRow)

        fun pickDate() {
            val dp = DatePickerDialog(
                context,
                { _, y, m, d ->
                    cal.set(Calendar.YEAR, y)
                    cal.set(Calendar.MONTH, m)
                    cal.set(Calendar.DAY_OF_MONTH, d)
                    dateValue.text = SimpleDateFormat("EEE, dd MMM yyyy", Locale.getDefault()).format(Date(cal.timeInMillis))
                },
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH),
                cal.get(Calendar.DAY_OF_MONTH)
            )
            dp.show()
        }

        fun pickTime() {
            val tp = TimePickerDialog(
                context,
                { _, h, min ->
                    cal.set(Calendar.HOUR_OF_DAY, h)
                    cal.set(Calendar.MINUTE, min)
                    cal.set(Calendar.SECOND, 0)
                    cal.set(Calendar.MILLISECOND, 0)
                    timeValue.text = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date(cal.timeInMillis))
                },
                cal.get(Calendar.HOUR_OF_DAY),
                cal.get(Calendar.MINUTE),
                android.text.format.DateFormat.is24HourFormat(context)
            )
            tp.show()
        }

        dateRow.setOnClickListener { pickDate() }
        dateValue.setOnClickListener { pickDate() }
        timeRow.setOnClickListener { pickTime() }
        timeValue.setOnClickListener { pickTime() }

        val dialog = AlertDialog.Builder(context)
            .setTitle(if (existing == null) "Create reminder" else "Edit reminder")
            .setView(container)
            .setNegativeButton("Cancel", null)
            .setPositiveButton("Save", null)
            .create()

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val title = titleInput.text?.toString()?.trim().orEmpty()
                if (title.isEmpty()) {
                    Toast.makeText(context, "Please enter a reminder title", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                if (cal.timeInMillis <= System.currentTimeMillis()) {
                    Toast.makeText(context, "Please select a future date and time", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                if (existing == null) {
                    addReminder(title, cal.timeInMillis)
                } else {
                    updateReminder(existing.copy(title = title, dateTime = cal.timeInMillis))
                }
                dialog.dismiss()
            }
        }

        dialog.show()
    }

    private fun editReminder(item: ReminderItem) {
        showReminderDialog(existing = item)
    }

    private fun snoozeReminder(item: ReminderItem, minutes: Int) {
        val newTime = System.currentTimeMillis() + minutes * 60_000L
        updateReminder(item.copy(dateTime = newTime, completed = false))
        Toast.makeText(requireContext(), "Snoozed for $minutes min", Toast.LENGTH_SHORT).show()
    }

    private fun updateReminder(updated: ReminderItem) {
        val idx = items.indexOfFirst { it.id == updated.id }
        if (idx >= 0) {
            items[idx] = updated
            adapter.notifyItemChanged(idx)
        }
        cancelNotification(updated.id)
        if (!updated.completed && updated.dateTime > System.currentTimeMillis()) {
            scheduleNotification(updated)
        }
        persistReminders()
        updateEmptyState()
    }

    private fun Int.dp(): Int = (this * resources.displayMetrics.density).toInt()

    private fun addReminder(title: String, dateTime: Long) {
        val reminder = ReminderItem(
            id = UUID.randomUUID().toString(),
            title = title,
            dateTime = dateTime,
            completed = false
        )

        items.add(0, reminder)
        adapter.notifyItemInserted(0)
        recycler.scrollToPosition(0)

        scheduleNotification(reminder)
        persistReminders()

        Toast.makeText(requireContext(), "Reminder set!", Toast.LENGTH_SHORT).show()
        updateEmptyState()
    }

    private fun completeReminder(item: ReminderItem) {
        val idx = items.indexOfFirst { it.id == item.id }
        if (idx >= 0) {
            items[idx] = item.copy(completed = true)
            adapter.notifyItemChanged(idx)

            cancelNotification(item.id)
            persistReminders()
            updateEmptyState()
        }
    }

    private fun deleteReminder(item: ReminderItem) {
        val idx = items.indexOfFirst { it.id == item.id }
        if (idx >= 0) {
            items.removeAt(idx)
            adapter.notifyItemRemoved(idx)

            cancelNotification(item.id)
            persistReminders()
            updateEmptyState()
        }
    }

    private fun scheduleNotification(reminder: ReminderItem) {
        val alarmManager = requireContext().getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(requireContext(), ReminderReceiver::class.java).apply {
            putExtra("reminder_id", reminder.id)
            putExtra("reminder_title", reminder.title)
        }

        val pendingIntent = PendingIntent.getBroadcast(
            requireContext(),
            reminder.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, reminder.dateTime, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, reminder.dateTime, pendingIntent)
            }
        } catch (e: SecurityException) {
            Toast.makeText(requireContext(), "Unable to schedule exact alarm. Please enable permission in settings.", Toast.LENGTH_LONG).show()
        }
    }

    private fun cancelNotification(reminderId: String) {
        val alarmManager = requireContext().getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(requireContext(), ReminderReceiver::class.java)
        val pendingIntent = PendingIntent.getBroadcast(
            requireContext(),
            reminderId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        alarmManager.cancel(pendingIntent)
    }

    private fun loadReminders() {
        items.clear()
        val sp = requireContext().getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
        val json = sp.getString(SP_KEY, null)
        if (!json.isNullOrEmpty()) {
            try {
                val arr = JSONArray(json)
                val validReminders = mutableListOf<ReminderItem>()

                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    val reminder = ReminderItem(
                        id = o.getString("id"),
                        title = o.getString("title"),
                        dateTime = o.getLong("dateTime"),
                        completed = o.getBoolean("completed")
                    )

                    if (reminder.completed || reminder.dateTime > System.currentTimeMillis()) {
                        validReminders.add(reminder)

                        if (!reminder.completed && reminder.dateTime > System.currentTimeMillis()) {
                            scheduleNotification(reminder)
                        }
                    }
                }

                items.addAll(validReminders)
                items.sortWith(compareBy<ReminderItem> { it.completed }.thenBy { it.dateTime })

                if (::adapter.isInitialized) {
                    adapter.notifyDataSetChanged()
                }

                if (validReminders.size < arr.length()) {
                    persistReminders()
                }
            } catch (_: Exception) {}
        }
        updateEmptyState()
    }

    private fun updateEmptyState() {
        try {
            val empty = view?.findViewById<View>(R.id.emptyState)
            val list = view?.findViewById<View>(R.id.recyclerReminders)
            if (items.isEmpty()) {
                empty?.visibility = View.VISIBLE
                list?.visibility = View.GONE
            } else {
                empty?.visibility = View.GONE
                list?.visibility = View.VISIBLE
            }
        } catch (_: Exception) {}
    }

    private fun persistReminders() {
        try {
            val arr = JSONArray()
            items.forEach { reminder ->
                arr.put(
                    JSONObject().apply {
                        put("id", reminder.id)
                        put("title", reminder.title)
                        put("dateTime", reminder.dateTime)
                        put("completed", reminder.completed)
                    }
                )
            }
            val sp = requireContext().getSharedPreferences("NotesAICallPrefs", Context.MODE_PRIVATE)
            sp.edit().putString(SP_KEY, arr.toString()).apply()
        } catch (_: Exception) {}
    }
}
