package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.os.Build
import android.view.View
import android.view.WindowInsets
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppControlModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppControlModule"
    }

    @ReactMethod
    fun toggleSystemNavigation(hide: Boolean, promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity as? MainActivity
            if (activity != null) {
                activity.runOnUiThread {
                    try {
                        if (hide) {
                            activity.hideSystemUI()
                        } else {
                            activity.showSystemUI()
                        }
                        promise.resolve(true)
                    } catch (e: Exception) {
                        promise.reject("ERROR", "Failed to toggle system navigation", e)
                    }
                }
            } else {
                promise.reject("ERROR", "Activity not available")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to toggle system navigation", e)
        }
    }

    @ReactMethod
    fun minimizeApp(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity != null) {
                activity.moveTaskToBack(true)
                promise.resolve(true)
            } else {
                promise.reject("ERROR", "Activity not available")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to minimize app", e)
        }
    }

    @ReactMethod
    fun closeApp(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            if (activity != null) {
                activity.runOnUiThread {
                    activity.finishAndRemoveTask()
                    // Force close the app process
                    android.os.Process.killProcess(android.os.Process.myPid())
                }
                promise.resolve(true)
            } else {
                promise.reject("ERROR", "Activity not available")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to close app", e)
        }
    }

    @ReactMethod
    fun hideSystemNavigation(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity as? MainActivity
            if (activity != null) {
                activity.runOnUiThread {
                    activity.hideSystemUI()
                }
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("HIDE_SYSTEM_NAV_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun showSystemNavigation(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity as? MainActivity
            if (activity != null) {
                activity.runOnUiThread {
                    activity.showSystemUI()
                }
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("SHOW_SYSTEM_NAV_ERROR", e.message, e)
        }
    }
}
