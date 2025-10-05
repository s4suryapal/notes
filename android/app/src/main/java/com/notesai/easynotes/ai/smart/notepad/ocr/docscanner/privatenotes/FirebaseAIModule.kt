package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import kotlinx.coroutines.*

class FirebaseAIModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FirebaseAIModule"

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            // Check for Firebase AI availability by attempting to access Firebase.ai
            Firebase.ai
            promise.resolve(true)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun getSdkInfo(promise: Promise) {
        try {
            promise.resolve("firebase-ai")
        } catch (e: Exception) {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun generateText(model: String, prompt: String, promise: Promise) {
        // Use coroutine scope to handle the suspend function properly
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Initialize Firebase AI - the API key is handled by Firebase project configuration
                val generativeModel = Firebase.ai.generativeModel(
                    if (model.isNotBlank()) model else "gemini-2.0-flash-exp"
                )

                // Generate content using the prompt
                val response = generativeModel.generateContent(prompt)
                val text = response.text ?: ""

                // Return result on main thread
                CoroutineScope(Dispatchers.Main).launch {
                    promise.resolve(text)
                }
            } catch (e: Exception) {
                // Return error on main thread
                CoroutineScope(Dispatchers.Main).launch {
                    promise.reject("FIREBASE_AI_ERROR", e.message ?: "Unknown error", e)
                }
            }
        }
    }
}
