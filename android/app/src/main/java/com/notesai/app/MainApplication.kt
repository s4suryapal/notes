package com.notesai.app

import android.app.Application
import android.content.res.Configuration
import android.os.Handler
import android.os.Looper
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

class MainApplication : Application(), ReactApplication {

  companion object {
    private const val TAG = "MainApplication"
  }

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
      this,
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
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

    // 🚀 AGGRESSIVE React Native loading - INSTANT STARTUP OPTIMIZATION
    try {
      loadReactNative(this)

      // SAFE IMMEDIATE: Start context creation only if not already started
      try {
        val rim = reactNativeHost.reactInstanceManager
        if (rim.currentReactContext == null) {
          rim.createReactContextInBackground()
          Log.d(TAG, "✅ React context creation started")
        } else {
          Log.d(TAG, "✅ React context already exists")
        }
      } catch (e: Exception) {
        Log.e(TAG, "❌ Error creating React context", e)
      }
    } catch (e: Exception) {
      Log.e(TAG, "❌ Error loading React Native", e)
    }

    ApplicationLifecycleDispatcher.onApplicationCreate(this)

    // 🚀 INSTANT Pre-warm React Native for FASTEST startup possible
    Handler(Looper.getMainLooper()).post({
      preWarmReactNative()
    }) // Start pre-warming IMMEDIATELY - no delay!
  }

  /**
   * 🚀 Pre-warm React Native context for instant app startup
   * This creates the React context in the background before the user opens the app
   */
  private fun preWarmReactNative() {
    try {
      val rim = reactNativeHost.reactInstanceManager
      if (rim.currentReactContext == null) {
        Log.d(TAG, "🔥 Pre-warming React Native context...")

        // Strategy 1: Only start background creation if not already in progress
        try {
          rim.createReactContextInBackground()

          // Strategy 2: Gentle verification after delay (only if still needed)
          Handler(Looper.getMainLooper()).postDelayed({
            try {
              if (rim.currentReactContext == null) {
                // Just access the context to verify status - don't force recreation
                reactHost.currentReactContext?.let {
                  Log.d(TAG, "✅ React context ready")
                }
              } else {
                Log.d(TAG, "✅ React context already initialized")
              }
            } catch (e: Exception) {
              Log.e(TAG, "Error verifying React context", e)
            }
          }, 500)

        } catch (e: Exception) {
          Log.e(TAG, "Error starting React context creation", e)
        }

      } else {
        Log.d(TAG, "✅ React context already exists, no pre-warming needed")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error in preWarmReactNative", e)
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
