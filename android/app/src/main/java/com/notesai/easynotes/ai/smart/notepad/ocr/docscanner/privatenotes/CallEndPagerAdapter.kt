package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter

class CallEndPagerAdapter(
    activity: FragmentActivity
) : FragmentStateAdapter(activity) {

    override fun getItemCount(): Int = 4

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> NotesFragment.newInstance()
            1 -> MessagesFragment.newInstance()
            2 -> RemindersFragment.newInstance()
            3 -> ActionsFragment.newInstance()
            else -> NotesFragment.newInstance()
        }
    }
}
