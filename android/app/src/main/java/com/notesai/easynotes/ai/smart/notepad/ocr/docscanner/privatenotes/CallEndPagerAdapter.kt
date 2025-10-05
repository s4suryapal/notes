package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter

class CallEndPagerAdapter(
    activity: FragmentActivity,
    private val phoneNumber: String
) : FragmentStateAdapter(activity) {

    override fun getItemCount(): Int = 2

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> NotesFragment.newInstance(phoneNumber)
            1 -> QuickActionsFragment.newInstance(phoneNumber)
            else -> NotesFragment.newInstance(phoneNumber)
        }
    }
}
