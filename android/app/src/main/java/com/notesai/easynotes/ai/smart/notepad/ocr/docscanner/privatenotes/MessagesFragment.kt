package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class MessagesFragment : Fragment() {

    companion object {
        private const val VIEW_TYPE_QUICK = 0
        private const val VIEW_TYPE_CUSTOM = 1

        fun newInstance(): MessagesFragment {
            return MessagesFragment()
        }
    }

    private var selectedPosition = -1
    private var customMessageText = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_messages, container, false)

        val recycler = view.findViewById<RecyclerView>(R.id.rcvQuickResponse)

        val quickResponses = listOf(
            "Can't talk right now.",
            "Message me.",
            "I'm on my way.",
            "Call you later."
        )

        recycler.layoutManager = LinearLayoutManager(requireContext())
        val adapter = object : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

            override fun getItemViewType(position: Int): Int {
                return if (position < quickResponses.size) VIEW_TYPE_QUICK else VIEW_TYPE_CUSTOM
            }

            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
                return if (viewType == VIEW_TYPE_QUICK) {
                    val v = LayoutInflater.from(parent.context).inflate(R.layout.item_quick_response, parent, false)
                    val tv = v.findViewById<TextView>(R.id.tvQuickText)
                    val radioButton = v.findViewById<View>(R.id.radioButton)
                    val sendArrow = v.findViewById<ImageView>(R.id.ivSendArrow)
                    QuickHolder(v, tv, radioButton, sendArrow)
                } else {
                    val v = LayoutInflater.from(parent.context).inflate(R.layout.item_custom_message, parent, false)
                    val editText = v.findViewById<EditText>(R.id.etCustomMessage)
                    val radioButton = v.findViewById<View>(R.id.radioButton)
                    val sendArrow = v.findViewById<ImageView>(R.id.ivSendArrow)
                    CustomHolder(v, editText, radioButton, sendArrow)
                }
            }

            override fun getItemCount(): Int = quickResponses.size + 1

            override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
                val isSelected = position == selectedPosition

                if (holder is QuickHolder) {
                    val message = quickResponses[position]
                    holder.bind(message, isSelected) { msg, pos ->
                        val oldSelected = selectedPosition
                        selectedPosition = if (selectedPosition == pos) -1 else pos

                        if (oldSelected == quickResponses.size) {
                            hideKeyboard()
                        }

                        if (oldSelected != -1) notifyItemChanged(oldSelected)
                        if (selectedPosition != -1) notifyItemChanged(selectedPosition)
                    }

                    holder.setSendClickListener {
                        if (isSelected) {
                            shareMessage(message)
                        }
                    }
                } else if (holder is CustomHolder) {
                    holder.bind(customMessageText, isSelected, ::showKeyboard) { text, pos ->
                        val oldSelected = selectedPosition
                        selectedPosition = if (selectedPosition == pos) -1 else pos

                        if (oldSelected == pos) {
                            hideKeyboard()
                        }

                        if (oldSelected != -1) notifyItemChanged(oldSelected)
                        if (selectedPosition != -1) notifyItemChanged(selectedPosition)
                    }

                    holder.setTextChangeListener { text ->
                        customMessageText = text
                        if (holder.sendArrow != null) {
                            holder.sendArrow.visibility = if (isSelected && text.isNotBlank()) {
                                View.VISIBLE
                            } else {
                                View.GONE
                            }
                        }
                    }

                    holder.setImeActionListener {
                        if (isSelected && customMessageText.isNotBlank()) {
                            shareMessage(customMessageText)
                            true
                        } else {
                            false
                        }
                    }

                    holder.setKeyListener { keyCode, event ->
                        if (keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN) {
                            if (isSelected && customMessageText.isNotBlank()) {
                                shareMessage(customMessageText)
                                true
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    }

                    holder.setSendClickListener {
                        if (isSelected && customMessageText.isNotBlank()) {
                            shareMessage(customMessageText)
                        }
                    }
                }
            }
        }
        recycler.adapter = adapter

        return view
    }

    private fun shareMessage(message: String) {
        try {
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, message)
            }
            startActivity(Intent.createChooser(intent, "Share message"))
        } catch (_: Exception) {}
    }

    private fun hideKeyboard() {
        try {
            view?.let { v ->
                ViewCompat.getWindowInsetsController(v)?.hide(WindowInsetsCompat.Type.ime())
                    ?: run {
                        val imm = requireContext().getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                        imm?.hideSoftInputFromWindow(v.windowToken, 0)
                    }
            }
        } catch (_: Exception) {}
    }

    private fun showKeyboard(view: View) {
        try {
            view.requestFocus()
            ViewCompat.getWindowInsetsController(view)?.show(WindowInsetsCompat.Type.ime())
                ?: run {
                    view.post {
                        val imm = requireContext().getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
                        imm?.showSoftInput(view, InputMethodManager.SHOW_IMPLICIT)
                    }
                }
        } catch (_: Exception) {}
    }

    private class QuickHolder(
        private val root: View,
        private val tv: TextView,
        private val radioButton: View,
        private val sendArrow: ImageView?
    ) : RecyclerView.ViewHolder(root) {

        fun bind(text: String, isSelected: Boolean, onClick: (String, Int) -> Unit) {
            tv.text = text
            radioButton.isSelected = isSelected
            sendArrow?.visibility = if (isSelected) View.VISIBLE else View.GONE
            root.setOnClickListener { onClick(text, adapterPosition) }
        }

        fun setSendClickListener(onClick: () -> Unit) {
            sendArrow?.setOnClickListener { onClick() }
        }
    }

    private class CustomHolder(
        private val root: View,
        private val editText: EditText,
        private val radioButton: View,
        val sendArrow: ImageView?
    ) : RecyclerView.ViewHolder(root) {

        private var textWatcher: TextWatcher? = null
        private var isBinding = false

        fun bind(text: String, isSelected: Boolean, showKeyboard: (View) -> Unit, onClick: (String, Int) -> Unit) {
            isBinding = true
            textWatcher?.let { editText.removeTextChangedListener(it) }

            val currentText = editText.text.toString()
            if (currentText != text) {
                val cursorPosition = editText.selectionStart
                editText.setText(text)
                if (isSelected && text.isNotEmpty()) {
                    val newPosition = minOf(cursorPosition, text.length)
                    editText.setSelection(newPosition)
                }
            }

            radioButton.isSelected = isSelected
            sendArrow?.visibility = if (isSelected && text.isNotBlank()) View.VISIBLE else View.GONE

            editText.isEnabled = isSelected
            editText.isFocusableInTouchMode = isSelected
            editText.isFocusable = isSelected

            if (isSelected) {
                editText.post {
                    showKeyboard(editText)
                }
            } else {
                editText.clearFocus()
            }

            root.setOnClickListener(null)
            radioButton.setOnClickListener(null)
            editText.setOnClickListener(null)

            if (isSelected) {
                radioButton.setOnClickListener {
                    onClick(editText.text.toString(), adapterPosition)
                }
            } else {
                val clickListener = View.OnClickListener {
                    onClick(editText.text.toString(), adapterPosition)
                }
                root.setOnClickListener(clickListener)
                editText.setOnClickListener(clickListener)
                radioButton.setOnClickListener(clickListener)
            }

            isBinding = false
        }

        fun setTextChangeListener(onTextChanged: (String) -> Unit) {
            textWatcher = object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
                override fun afterTextChanged(s: Editable?) {
                    if (!isBinding) {
                        onTextChanged(s?.toString() ?: "")
                    }
                }
            }
            editText.addTextChangedListener(textWatcher)
        }

        fun setSendClickListener(onClick: () -> Unit) {
            sendArrow?.setOnClickListener { onClick() }
        }

        fun setImeActionListener(onAction: () -> Boolean) {
            editText.setOnEditorActionListener { _, actionId, event ->
                when (actionId) {
                    EditorInfo.IME_ACTION_SEND -> {
                        onAction()
                    }
                    EditorInfo.IME_ACTION_DONE -> {
                        onAction()
                    }
                    else -> {
                        if (event != null && event.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN) {
                            onAction()
                        } else {
                            false
                        }
                    }
                }
            }
        }

        fun setKeyListener(onKey: (Int, KeyEvent) -> Boolean) {
            editText.setOnKeyListener { _, keyCode, event ->
                onKey(keyCode, event)
            }
        }
    }
}
