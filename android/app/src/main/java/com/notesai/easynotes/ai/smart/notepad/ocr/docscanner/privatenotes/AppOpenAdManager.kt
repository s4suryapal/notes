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

        // Show ad if available and user has launched app enough times
        currentActivity?.let { activity ->
            if (shouldShowAd()) {
                showAdIfAvailable(activity)
            } else {
                Log.d(TAG, "⏭️ Skipping ad - not ready or launch count too low")
                // Preload for next time
                if (!isLoadingAd && !isAdAvailable()) {
                    loadAd()
                }
            }
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
     * Load App Open Ad
     */
    fun loadAd() {
        if (isLoadingAd || isAdAvailable()) {
            Log.d(TAG, "⏭️ Skipping ad load - already loading or available")
            return
        }

        isLoadingAd = true
        Log.d(TAG, "📥 Loading App Open Ad...")

        val request = AdRequest.Builder().build()

        // AppOpenAd.load() API updated in newer Google Mobile Ads SDK
        // Orientation parameter removed - ads adapt automatically
        AppOpenAd.load(
            application,
            adUnitId,
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
