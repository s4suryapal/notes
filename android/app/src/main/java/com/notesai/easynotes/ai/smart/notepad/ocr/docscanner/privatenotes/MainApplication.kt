package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

import android.app.Application
import android.content.res.Configuration
import android.util.Log

import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.common.ReleaseLevel
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost

import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes.BuildConfig

class MainApplication : Application(), ReactApplication {

  companion object {
    private const val TAG = "MainApplication"

    // Test ad unit ID (use in development)
    private const val TEST_AD_UNIT_ID = "ca-app-pub-3940256099942544/9257395921"

    // Production ad unit ID (replace with your actual ID from AdMob console)
    private const val PROD_AD_UNIT_ID = "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy"
  }

  // App Open Ad Manager
  private lateinit var appOpenAdManager: AppOpenAdManager

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
              add(OverlaySettingsPackage())
              add(AppControlPackage())
              add(FirebaseAIPackage())
              add(AppOpenAdPackage())
            }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"

          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      }
  )

  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()

    DefaultNewArchitectureEntryPoint.releaseLevel = try {
      ReleaseLevel.valueOf(BuildConfig.REACT_NATIVE_RELEASE_LEVEL.uppercase())
    } catch (e: IllegalArgumentException) {
      ReleaseLevel.STABLE
    }

    // Initialize notification channels (Android 8.0+)
    // Quick operation - safe on main thread
    NotificationChannelManager.createNotificationChannels(this)
    Log.d(TAG, "🔔 Notification channels initialized")

    // Initialize App Open Ad Manager
    // Note: Actual ad loading happens asynchronously in background
    val adUnitId = if (BuildConfig.DEBUG) TEST_AD_UNIT_ID else PROD_AD_UNIT_ID
    appOpenAdManager = AppOpenAdManager(this, adUnitId)

    // Increment launch count (for ad display logic)
    appOpenAdManager.incrementLaunchCount()

    // Preload app open ad (async, won't block startup)
    appOpenAdManager.preloadAd()

    Log.d(TAG, "📺 App Open Ad Manager initialized")

    loadReactNative(this)
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
