package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * AppOpenAdModule - React Native bridge for screen-specific AppOpen ad control
 *
 * Allows React Native to:
 * - Set current screen name
 * - Configure which screens should show AppOpen ads
 * - Enable/disable AppOpen ads globally
 */
class AppOpenAdModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AppOpenAdModule"

        // Shared state accessible by AppOpenAdManager
        @Volatile
        var currentScreen: String = ""

        @Volatile
        var enabledScreens: Set<String> = emptySet() // Empty = show on all screens

        @Volatile
        var isAppOpenAdsEnabled: Boolean = true

        @Volatile
        var adUnitId: String? = null // Ad unit ID from Remote Config (null = use default)
    }

    override fun getName(): String = "AppOpenAdModule"

    /**
     * Set the current screen name from React Native
     * Call this on every screen navigation
     */
    @ReactMethod
    fun setCurrentScreen(screenName: String) {
        currentScreen = screenName
        Log.d(TAG, "📍 Current screen set to: $screenName")
    }

    /**
     * Configure which screens should show AppOpen ads
     * @param screens Array of screen names (e.g., ["settings", "premium"])
     *                Empty array = show on all screens
     */
    @ReactMethod
    fun setEnabledScreens(screens: com.facebook.react.bridge.ReadableArray) {
        val screenSet = mutableSetOf<String>()
        for (i in 0 until screens.size()) {
            screens.getString(i)?.let { screenSet.add(it) }
        }
        enabledScreens = screenSet

        if (screenSet.isEmpty()) {
            Log.d(TAG, "🌍 AppOpen ads enabled on ALL screens")
        } else {
            Log.d(TAG, "🎯 AppOpen ads enabled only on: ${screenSet.joinToString(", ")}")
        }
    }

    /**
     * Enable or disable AppOpen ads globally
     */
    @ReactMethod
    fun setAppOpenAdsEnabled(enabled: Boolean, promise: Promise) {
        isAppOpenAdsEnabled = enabled
        Log.d(TAG, "🔄 AppOpen ads ${if (enabled) "ENABLED" else "DISABLED"} globally")
        promise.resolve(enabled)
    }

    /**
     * Set the ad unit ID from Remote Config
     * @param unitId Ad unit ID from Firebase Remote Config (null to use default)
     */
    @ReactMethod
    fun setAdUnitId(unitId: String?) {
        adUnitId = unitId
        if (unitId != null && unitId.isNotEmpty()) {
            Log.d(TAG, "📺 Ad unit ID set from Remote Config: $unitId")
        } else {
            Log.d(TAG, "📺 Using default ad unit ID")
        }
    }

    /**
     * Check if AppOpen ads should show on the current screen
     * Called by AppOpenAdManager before showing ads
     */
    fun shouldShowAdOnCurrentScreen(): Boolean {
        // Global disable
        if (!isAppOpenAdsEnabled) {
            Log.d(TAG, "❌ AppOpen ads disabled globally")
            return false
        }

        // No screen restrictions - show on all screens
        if (enabledScreens.isEmpty()) {
            Log.d(TAG, "✅ No screen restrictions - showing ad")
            return true
        }

        // Check if current screen is in enabled list
        val shouldShow = enabledScreens.contains(currentScreen)
        if (shouldShow) {
            Log.d(TAG, "✅ Current screen '$currentScreen' is enabled for AppOpen ads")
        } else {
            Log.d(TAG, "❌ Current screen '$currentScreen' not in enabled list: ${enabledScreens.joinToString(", ")}")
        }

        return shouldShow
    }

    /**
     * Get current configuration (for debugging)
     */
    @ReactMethod
    fun getConfiguration(promise: Promise) {
        val config = mapOf(
            "currentScreen" to currentScreen,
            "enabledScreens" to enabledScreens.toList(),
            "isEnabled" to isAppOpenAdsEnabled,
            "adUnitId" to (adUnitId ?: "default")
        )
        promise.resolve(com.facebook.react.bridge.Arguments.makeNativeMap(config))
    }
}
