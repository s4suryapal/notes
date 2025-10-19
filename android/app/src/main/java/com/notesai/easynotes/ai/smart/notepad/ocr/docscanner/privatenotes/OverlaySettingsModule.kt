package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OverlaySettingsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "OverlaySettingsModule"
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val packageName = context.packageName

            Log.d("OverlaySettings", "⚙️ Opening overlay settings for package: $packageName")

            // Opens Settings > Special app access > Display over other apps
            // With package URI, it should automatically highlight "#NotesAI" in the list
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK

            context.startActivity(intent)

            Log.d("OverlaySettings", "✅ Overlay settings opened successfully")
            promise.resolve("Overlay settings opened for $packageName")
        } catch (e: Exception) {
            Log.e("OverlaySettings", "❌ Failed to open overlay settings: ${e.message}", e)
            promise.reject("OVERLAY_SETTINGS_ERROR", "Failed to open overlay settings: ${e.message}")
        }
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        try {
            val hasPermission = Settings.canDrawOverlays(reactApplicationContext)
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("OVERLAY_CHECK_ERROR", "Failed to check overlay permission: ${e.message}")
        }
    }
}
