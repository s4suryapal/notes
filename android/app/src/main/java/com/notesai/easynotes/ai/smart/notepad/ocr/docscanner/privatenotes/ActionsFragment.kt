package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView

class ActionsFragment : Fragment() {

    companion object {
        private const val ARG_PHONE = "arg_phone"

        fun newInstance(phoneNumber: String): ActionsFragment {
            val f = ActionsFragment()
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
        val view = inflater.inflate(R.layout.fragment_actions, container, false)

        phoneNumber = arguments?.getString(ARG_PHONE) ?: ""

        setupViews(view)
        setupActions()

        return view
    }

    private fun setupViews(view: View) {
        quickActionsGrid = view.findViewById(R.id.quickActionsGrid)
        quickActionsGrid.layoutManager = GridLayoutManager(requireContext(), 3)

        actionsAdapter = QuickActionsAdapter { action ->
            handleActionClick(action)
        }
        quickActionsGrid.adapter = actionsAdapter
    }

    private fun setupActions() {
        val actions = listOf(
            QuickAction("call", "Call Back", "📞", "call"),
            QuickAction("sms", "Send SMS", "💬", "sms"),
            QuickAction("email", "Send Email", "📧", "email"),
            QuickAction("text", "Text Note", "📝", "text"),
            QuickAction("checklist", "Checklist", "☑️", "checklist"),
            QuickAction("audio", "Audio Note", "🎤", "audio"),
            QuickAction("photo", "Photo Note", "📷", "photo"),
            QuickAction("scan", "Scan Doc", "📄", "scan"),
            QuickAction("home", "Open App", "🏠", "home")
        )

        actionsAdapter.setActions(actions)
    }

    private fun handleActionClick(action: QuickAction) {
        try {
            when (action.mode) {
                "call" -> {
                    if (phoneNumber.isNotEmpty()) {
                        val intent = Intent(Intent.ACTION_DIAL)
                        intent.data = Uri.parse("tel:$phoneNumber")
                        startActivity(intent)
                    } else {
                        val intent = Intent(Intent.ACTION_DIAL)
                        startActivity(intent)
                    }
                }
                "sms" -> {
                    val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:$phoneNumber"))
                    intent.putExtra("sms_body", "")
                    startActivity(intent)
                }
                "email" -> {
                    val intent = Intent(Intent.ACTION_SENDTO)
                    intent.data = Uri.parse("mailto:")
                    intent.putExtra(Intent.EXTRA_SUBJECT, "Follow up")
                    startActivity(Intent.createChooser(intent, "Send Email"))
                }
                "home" -> {
                    val intent = Intent(requireContext(), MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
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
                        putExtra("phone_number", phoneNumber)
                    }
                    startActivity(intent)
                    activity?.finish()
                }
            }
        } catch (e: Exception) {
            Toast.makeText(requireContext(), "Unable to perform action", Toast.LENGTH_SHORT).show()
            e.printStackTrace()
        }
    }
}
