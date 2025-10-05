package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.LinearLayout
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.json.JSONArray
import org.json.JSONObject
import com.tencent.mmkv.MMKV
import android.graphics.drawable.GradientDrawable

data class NoteItem(
    val id: String,
    val title: String,
    val body: String,
    val updatedAt: Long,
    val color: String?
)

class NotesFragment : Fragment() {

    companion object {
        private const val ARG_PHONE = "arg_phone"

        fun newInstance(phoneNumber: String): NotesFragment {
            val f = NotesFragment()
            f.arguments = Bundle().apply { putString(ARG_PHONE, phoneNumber) }
            return f
        }
    }

    private lateinit var notesRecyclerView: RecyclerView
    private lateinit var notesAdapter: NotesAdapter
    private var phoneNumber: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout from XML
        val view = inflater.inflate(R.layout.fragment_notes, container, false)

        phoneNumber = arguments?.getString(ARG_PHONE) ?: ""

        setupViews(view)
        loadNotes()

        return view
    }

    private fun setupViews(view: View) {
        // Get RecyclerView from inflated layout
        notesRecyclerView = view.findViewById(R.id.recyclerNotes)
        notesRecyclerView.layoutManager = LinearLayoutManager(requireContext())

        notesAdapter = NotesAdapter { noteId ->
            openNoteInMainApp(noteId)
        }
        notesRecyclerView.adapter = notesAdapter
    }

    private fun loadNotes() {
        try {
            MMKV.initialize(requireContext())
            val mmkv = MMKV.mmkvWithID("notesai-storage")
            val notesJson = mmkv.decodeString("notes")

            if (notesJson.isNullOrEmpty()) {
                showEmptyState()
                return
            }

            val notesArray = JSONArray(notesJson)
            val notesList = mutableListOf<NoteItem>()

            for (i in 0 until notesArray.length()) {
                val noteObj = notesArray.getJSONObject(i)
                notesList.add(
                    NoteItem(
                        id = noteObj.optString("id", ""),
                        title = noteObj.optString("title", "Untitled"),
                        body = noteObj.optString("body", ""),
                        updatedAt = noteObj.optLong("updatedAt", 0),
                        color = noteObj.optString("color", null)
                    )
                )
            }

            // Sort by updated time (most recent first) and take 10
            val recentNotes = notesList
                .sortedByDescending { it.updatedAt }
                .take(10)

            if (recentNotes.isEmpty()) {
                showEmptyState()
            } else {
                notesAdapter.setNotes(recentNotes)
            }

        } catch (e: Exception) {
            showEmptyState()
        }
    }

    private fun showEmptyState() {
        // Show empty state - you could add a TextView to the layout for this
        notesAdapter.setNotes(emptyList())
    }

    private fun openNoteInMainApp(noteId: String) {
        try {
            val intent = Intent(requireContext(), MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("noteId", noteId)
                putExtra("action", "open_note")
            }
            startActivity(intent)
            activity?.finish()
        } catch (e: Exception) {
        }
    }
}

class NotesAdapter(private val onClick: (String) -> Unit) : RecyclerView.Adapter<NotesAdapter.NoteViewHolder>() {

    private var notes = listOf<NoteItem>()

    fun setNotes(newNotes: List<NoteItem>) {
        notes = newNotes
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NoteViewHolder {
        val layout = LinearLayout(parent.context).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = RecyclerView.LayoutParams(
                RecyclerView.LayoutParams.MATCH_PARENT,
                RecyclerView.LayoutParams.WRAP_CONTENT
            )
            val padding = (12 * resources.displayMetrics.density).toInt()
            setPadding(padding, padding, padding, padding)
            val margin = (8 * resources.displayMetrics.density).toInt()
            (layoutParams as ViewGroup.MarginLayoutParams).setMargins(margin, margin, margin, margin)
            setBackgroundColor(Color.parseColor("#F5F5F5"))
            val cornerRadius = (8 * resources.displayMetrics.density)
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#F5F5F5"))
                setCornerRadius(cornerRadius)
            }
            isClickable = true
            isFocusable = true
        }

        val titleView = TextView(parent.context).apply {
            id = View.generateViewId()
            textSize = 16f
            setTextColor(Color.parseColor("#000000"))
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
        }

        val bodyView = TextView(parent.context).apply {
            id = View.generateViewId()
            textSize = 14f
            setTextColor(Color.parseColor("#666666"))
            maxLines = 2
            ellipsize = android.text.TextUtils.TruncateAt.END
        }

        layout.addView(titleView)
        layout.addView(bodyView)

        return NoteViewHolder(layout, titleView, bodyView)
    }

    override fun onBindViewHolder(holder: NoteViewHolder, position: Int) {
        val note = notes[position]
        holder.titleView.text = note.title
        holder.bodyView.text = note.body.replace(Regex("<[^>]*>"), "").trim() // Strip HTML

        holder.itemView.setOnClickListener {
            onClick(note.id)
        }
    }

    override fun getItemCount() = notes.size

    class NoteViewHolder(
        itemView: View,
        val titleView: TextView,
        val bodyView: TextView
    ) : RecyclerView.ViewHolder(itemView)
}
