package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView

data class QuickAction(
    val id: String,
    val label: String,
    val icon: String,
    val mode: String
)

class QuickActionsFragment : Fragment() {

    companion object {
        private const val ARG_PHONE = "arg_phone"

        fun newInstance(phoneNumber: String): QuickActionsFragment {
            val f = QuickActionsFragment()
            f.arguments = Bundle().apply { putString(ARG_PHONE, phoneNumber) }
            return f
        }
    }

    private lateinit var quickActionsGrid: RecyclerView
    private lateinit var actionsAdapter: QuickActionsAdapter
    private var phoneNumber: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Inflate the layout from XML
        val view = inflater.inflate(R.layout.fragment_actions, container, false)

        phoneNumber = arguments?.getString(ARG_PHONE) ?: ""

        setupViews(view)
        setupActions()

        return view
    }

    private fun setupViews(view: View) {
        // Get RecyclerView from inflated layout
        quickActionsGrid = view.findViewById(R.id.quickActionsGrid)
        quickActionsGrid.layoutManager = GridLayoutManager(requireContext(), 3) // 3 columns

        actionsAdapter = QuickActionsAdapter { action ->
            handleActionClick(action)
        }
        quickActionsGrid.adapter = actionsAdapter
    }

    private fun setupActions() {
        val actions = listOf(
            QuickAction("text", "Text Note", "📝", "text"),
            QuickAction("checklist", "Checklist", "☑️", "checklist"),
            QuickAction("audio", "Audio Note", "🎤", "audio"),
            QuickAction("photo", "Photo Note", "📷", "photo"),
            QuickAction("scan", "Scan Document", "📄", "scan"),
            QuickAction("drawing", "Drawing", "🎨", "drawing"),
            QuickAction("home", "Open App", "🏠", "home"),
            QuickAction("search", "Search Notes", "🔍", "search")
        )

        actionsAdapter.setActions(actions)
    }

    private fun handleActionClick(action: QuickAction) {
        try {
            when (action.mode) {
                "home" -> {
                    // Open main app
                    val intent = Intent(requireContext(), MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    startActivity(intent)
                    activity?.finish()
                }
                "search" -> {
                    // Open app to search screen
                    val intent = Intent(requireContext(), MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        putExtra("action", "open_search")
                    }
                    startActivity(intent)
                    activity?.finish()
                }
                else -> {
                    // Open note editor with specific mode
                    val intent = Intent(requireContext(), MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                        putExtra("action", "create_note")
                        putExtra("mode", action.mode)
                    }
                    startActivity(intent)
                    activity?.finish()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

class QuickActionsAdapter(private val onClick: (QuickAction) -> Unit) :
    RecyclerView.Adapter<QuickActionsAdapter.ActionViewHolder>() {

    private var actions = listOf<QuickAction>()

    fun setActions(newActions: List<QuickAction>) {
        actions = newActions
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ActionViewHolder {
        // Inflate the item layout from XML
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_quick_action, parent, false)
        return ActionViewHolder(view)
    }

    override fun onBindViewHolder(holder: ActionViewHolder, position: Int) {
        val action = actions[position]

        val iconView = holder.itemView.findViewById<TextView>(R.id.actionIcon)
        val labelView = holder.itemView.findViewById<TextView>(R.id.actionLabel)

        iconView.text = action.icon
        labelView.text = action.label

        holder.itemView.setOnClickListener {
            onClick(action)
        }
    }

    override fun getItemCount() = actions.size

    class ActionViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView)
}
