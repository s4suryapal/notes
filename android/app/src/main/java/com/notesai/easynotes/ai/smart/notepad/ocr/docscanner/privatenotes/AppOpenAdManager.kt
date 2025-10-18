package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Bundle
import android.util.Log
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.appopen.AppOpenAd

/**
 * AppOpenAdManager - Manages App Open Ads following Google AdMob guidelines
 *
 * Google Guidelines:
 * - Show ads during natural waiting periods (cold starts, app switches)
 * - Don't show on first launch - wait until users have used the app a few times
 * - Ads expire after 4 hours
 * - Preload ads for instant display
 * - Track app lifecycle with ProcessLifecycleOwner
 *
 * Reference: https://developers.google.com/admob/android/app-open
 */
class AppOpenAdManager(
    private val application: Application,
    private val adUnitId: String
) : Application.ActivityLifecycleCallbacks, DefaultLifecycleObserver {

    companion object {
        private const val TAG = "AppOpenAdManager"
        private const val FOUR_HOURS_MILLIS = 4 * 60 * 60 * 1000L
        private const val MIN_LAUNCHES_BEFORE_AD = 3 // Don't show on first 2 launches
        private const val PREFS_NAME = "AppOpenAdPrefs"
        private const val KEY_LAUNCH_COUNT = "launch_count"
    }

    private var appOpenAd: AppOpenAd? = null
    private var isLoadingAd = false
    private var loadTime: Long = 0
    private var isShowingAd = false
    private var currentActivity: Activity? = null
    private var isFirstStart = true // Track if this is the first app start (cold start/splash)

    // Cache reflection results for performance
    private var moduleCompanion: Any? = null
    private var reflectionInitialized = false

    init {
        application.registerActivityLifecycleCallbacks(this)
        ProcessLifecycleOwner.get().lifecycle.addObserver(this)

        Log.d(TAG, "📺 AppOpenAdManager initialized with ad unit: $adUnitId")
    }

    /**
     * Lifecycle callback - triggered when app comes to foreground
     */
    override fun onStart(owner: LifecycleOwner) {
        Log.d(TAG, "📱 App came to foreground")

        // Skip showing ad on first start (during splash screen)
        if (isFirstStart) {
            Log.d(TAG, "🚀 First start detected (splash screen) - skipping AppOpen ad")
            isFirstStart = false

            // Preload ad for when user returns from background
            if (!isLoadingAd && !isAdAvailable() && shouldShowAd()) {
                loadAd()
            }
            return
        }

        // Show ad if available and user has launched app enough times (returning from background)
        currentActivity?.let { activity ->
            if (!shouldShowAd()) {
                Log.d(TAG, "⏭️ Skipping ad - launch count too low")
                // Preload for next time
                if (!isLoadingAd && !isAdAvailable()) {
                    loadAd()
                }
                return
            }

            // Check if current screen allows AppOpen ads
            if (!shouldShowAdOnCurrentScreen()) {
                Log.d(TAG, "⏭️ Skipping ad - current screen doesn't allow AppOpen ads")
                return
            }

            Log.d(TAG, "🔄 Returning from background - showing AppOpen ad")
            showAdIfAvailable(activity)
        }
    }

    /**
     * Check if we should show ad based on launch count
     */
    private fun shouldShowAd(): Boolean {
        val prefs = application.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val launchCount = prefs.getInt(KEY_LAUNCH_COUNT, 0)

        Log.d(TAG, "🚀 Launch count: $launchCount (min required: $MIN_LAUNCHES_BEFORE_AD)")

        return launchCount >= MIN_LAUNCHES_BEFORE_AD
    }

    /**
     * Initialize reflection cache (called once)
     */
    private fun initializeReflection() {
        if (reflectionInitialized) return

        try {
            val moduleClass = Class.forName("com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes.AppOpenAdModule")
            val companionField = moduleClass.getDeclaredField("Companion")
            moduleCompanion = companionField.get(null)
            reflectionInitialized = true
            Log.d(TAG, "✅ Reflection cache initialized successfully")
        } catch (e: Exception) {
            Log.w(TAG, "AppOpenAdModule not available", e)
            reflectionInitialized = true // Don't try again
        }
    }

    /**
     * Check if AppOpen ad should show on the current screen
     * This allows React Native to control which screens show AppOpen ads
     */
    private fun shouldShowAdOnCurrentScreen(): Boolean {
        initializeReflection()

        if (moduleCompanion == null) {
            // Module not available, default to showing ads
            return true
        }

        return try {
            // Access companion object fields directly (cached)
            val isEnabled = moduleCompanion!!.javaClass.getDeclaredField("isAppOpenAdsEnabled").get(moduleCompanion) as? Boolean ?: true
            val currentScreen = moduleCompanion!!.javaClass.getDeclaredField("currentScreen").get(moduleCompanion) as? String ?: ""
            val enabledScreens = moduleCompanion!!.javaClass.getDeclaredField("enabledScreens").get(moduleCompanion) as? Set<*> ?: emptySet<String>()

            if (!isEnabled) {
                Log.d(TAG, "❌ AppOpen ads disabled globally")
                return false
            }

            if (enabledScreens.isEmpty()) {
                Log.d(TAG, "✅ No screen restrictions - showing ad")
                return true
            }

            val shouldShow = (enabledScreens as Set<String>).contains(currentScreen)
            if (shouldShow) {
                Log.d(TAG, "✅ Current screen '$currentScreen' is enabled for AppOpen ads")
            } else {
                Log.d(TAG, "❌ Current screen '$currentScreen' not in enabled list: ${enabledScreens.joinToString(", ")}")
            }

            shouldShow
        } catch (e: Exception) {
            Log.w(TAG, "Error checking screen config, defaulting to show", e)
            true
        }
    }

    /**
     * Increment launch count (call this from MainApplication.onCreate)
     */
    fun incrementLaunchCount() {
        val prefs = application.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val currentCount = prefs.getInt(KEY_LAUNCH_COUNT, 0)
        val newCount = currentCount + 1

        prefs.edit().putInt(KEY_LAUNCH_COUNT, newCount).apply()

        Log.d(TAG, "📊 Launch count incremented: $currentCount → $newCount")
    }

    /**
     * Get the ad unit ID to use
     * Prioritizes Remote Config value from AppOpenAdModule, falls back to default
     */
    private fun getAdUnitId(): String {
        initializeReflection()

        if (moduleCompanion == null) {
            // Module not available, use default ad unit ID
            Log.d(TAG, "📺 Using default ad unit ID: $adUnitId")
            return adUnitId
        }

        return try {
            // Access companion object field directly (cached)
            val adUnitIdField = moduleCompanion!!.javaClass.getDeclaredField("adUnitId")
            val rcAdUnitId = adUnitIdField.get(moduleCompanion) as? String

            if (rcAdUnitId != null && rcAdUnitId.isNotEmpty()) {
                Log.d(TAG, "📺 Using Remote Config ad unit ID: $rcAdUnitId")
                rcAdUnitId
            } else {
                Log.d(TAG, "📺 Using default ad unit ID: $adUnitId")
                adUnitId
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not access Remote Config ad unit ID, using default", e)
            adUnitId
        }
    }

    /**
     * Load App Open Ad
     */
    fun loadAd() {
        if (isLoadingAd || isAdAvailable()) {
            Log.d(TAG, "⏭️ Skipping ad load - already loading or available")
            return
        }

        isLoadingAd = true
        val currentAdUnitId = getAdUnitId()
        Log.d(TAG, "📥 Loading App Open Ad with unit ID: $currentAdUnitId")

        val request = AdRequest.Builder().build()

        // AppOpenAd.load() API updated in newer Google Mobile Ads SDK
        // Orientation parameter removed - ads adapt automatically
        AppOpenAd.load(
            application,
            currentAdUnitId,
            request,
            object : AppOpenAd.AppOpenAdLoadCallback() {
                override fun onAdLoaded(ad: AppOpenAd) {
                    appOpenAd = ad
                    isLoadingAd = false
                    loadTime = System.currentTimeMillis()

                    Log.d(TAG, "✅ App Open Ad loaded successfully")
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    isLoadingAd = false

                    Log.e(TAG, "❌ Failed to load App Open Ad: ${loadAdError.message} (code: ${loadAdError.code})")
                }
            }
        )
    }

    /**
     * Check if ad is available and not expired
     */
    private fun isAdAvailable(): Boolean {
        val hasAd = appOpenAd != null
        val isExpired = wasLoadTimeLessThanFourHoursAgo()

        return hasAd && !isExpired
    }

    /**
     * Check if ad is expired (4 hours)
     */
    private fun wasLoadTimeLessThanFourHoursAgo(): Boolean {
        val dateDifference = System.currentTimeMillis() - loadTime
        val expired = dateDifference >= FOUR_HOURS_MILLIS

        if (expired) {
            Log.d(TAG, "⏰ Ad expired (age: ${dateDifference}ms, max: ${FOUR_HOURS_MILLIS}ms)")
        }

        return expired
    }

    /**
     * Show ad if available
     */
    fun showAdIfAvailable(activity: Activity) {
        if (isShowingAd) {
            Log.d(TAG, "⏭️ Ad already showing")
            return
        }

        if (!isAdAvailable()) {
            Log.d(TAG, "⏭️ Ad not available - loading new ad")
            loadAd()
            return
        }

        Log.d(TAG, "📺 Showing App Open Ad")

        appOpenAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                appOpenAd = null
                isShowingAd = false

                Log.d(TAG, "✅ Ad dismissed - preloading next ad")

                // Preload next ad
                loadAd()
            }

            override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                appOpenAd = null
                isShowingAd = false

                Log.e(TAG, "❌ Failed to show ad: ${adError.message}")
            }

            override fun onAdShowedFullScreenContent() {
                isShowingAd = true
                Log.d(TAG, "📺 Ad showed full screen")
            }
        }

        appOpenAd?.show(activity)
    }

    /**
     * Preload ad during app initialization
     */
    fun preloadAd() {
        if (shouldShowAd()) {
            Log.d(TAG, "🔄 Preloading App Open Ad for future display")
            loadAd()
        } else {
            Log.d(TAG, "⏭️ Skipping preload - launch count too low")
        }
    }

    // Activity Lifecycle Callbacks
    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}

    override fun onActivityStarted(activity: Activity) {
        currentActivity = activity
    }

    override fun onActivityResumed(activity: Activity) {
        currentActivity = activity
    }

    override fun onActivityPaused(activity: Activity) {}

    override fun onActivityStopped(activity: Activity) {
        if (currentActivity == activity) {
            currentActivity = null
        }
    }

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}

    override fun onActivityDestroyed(activity: Activity) {
        if (currentActivity == activity) {
            currentActivity = null
        }
    }
}
