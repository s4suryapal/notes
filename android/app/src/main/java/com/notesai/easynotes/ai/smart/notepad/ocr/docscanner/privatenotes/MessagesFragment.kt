package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

data class QuickResponse(
    val text: String
)

class MessagesFragment : Fragment() {

    companion object {
        private const val ARG_PHONE = "arg_phone"

        fun newInstance(phoneNumber: String): MessagesFragment {
            val f = MessagesFragment()
            f.arguments = Bundle().apply { putString(ARG_PHONE, phoneNumber) }
            return f
        }
    }

    private lateinit var recycler: RecyclerView
    private lateinit var adapter: QuickResponseAdapter
    private var phoneNumber: String = ""

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_messages, container, false)

        phoneNumber = arguments?.getString(ARG_PHONE) ?: ""

        setupRecyclerView(view)
        setupQuickResponses()

        return view
    }

    private fun setupRecyclerView(view: View) {
        recycler = view.findViewById(R.id.rcvQuickResponse)
        recycler.layoutManager = LinearLayoutManager(requireContext())

        adapter = QuickResponseAdapter { response ->
            sendMessage(response.text)
        }
        recycler.adapter = adapter
    }

    private fun setupQuickResponses() {
        val responses = listOf(
            QuickResponse("Can't talk right now."),
            QuickResponse("Message me."),
            QuickResponse("I'm on my way."),
            QuickResponse("Call you later."),
            QuickResponse("Will get back to you soon."),
            QuickResponse("In a meeting.")
        )

        adapter.setResponses(responses)
    }

    private fun sendMessage(message: String) {
        try {
            val uri = Uri.parse("smsto:$phoneNumber")
            val intent = Intent(Intent.ACTION_SENDTO, uri).apply {
                putExtra("sms_body", message)
            }
            startActivity(intent)
        } catch (_: Exception) {
            // Fallback to generic SMS
            try {
                val intent = Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:"))
                intent.putExtra("sms_body", message)
                startActivity(intent)
            } catch (_: Exception) {}
        }
    }
}

class QuickResponseAdapter(
    private val onClick: (QuickResponse) -> Unit
) : RecyclerView.Adapter<QuickResponseAdapter.ResponseViewHolder>() {

    private var responses = listOf<QuickResponse>()

    fun setResponses(newResponses: List<QuickResponse>) {
        responses = newResponses
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ResponseViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_quick_response, parent, false)
        return ResponseViewHolder(view)
    }

    override fun onBindViewHolder(holder: ResponseViewHolder, position: Int) {
        val response = responses[position]
        holder.bind(response)
    }

    override fun getItemCount() = responses.size

    inner class ResponseViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val textView: TextView = itemView.findViewById(R.id.tvQuickText)

        fun bind(response: QuickResponse) {
            textView.text = response.text

            itemView.setOnClickListener {
                onClick(response)
            }
        }
    }
}
