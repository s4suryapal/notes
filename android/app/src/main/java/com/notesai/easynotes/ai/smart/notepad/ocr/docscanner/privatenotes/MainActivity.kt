package com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper
import com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes.BuildConfig

class MainActivity : ReactActivity() {

  // Native system UI control methods - ONLY hide navigation bar, keep status bar visible
  fun hideSystemUI() {
    runOnUiThread {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          // Android 11+ (API 30+) - Use WindowInsetsController
          val controller = window.insetsController
          if (controller != null) {
            controller.hide(WindowInsets.Type.navigationBars())
            controller.systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

            // Force apply immediately
            window.decorView.requestApplyInsets()

            // Additional persistence for modals
            window.decorView.post {
              controller.hide(WindowInsets.Type.navigationBars())
            }
          }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
          // Android 4.4+ (API 19+) - Use system UI flags
          val flags = (
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
          )

          window.decorView.systemUiVisibility = flags

          // Multiple re-applications for modal persistence
          window.decorView.post {
            window.decorView.systemUiVisibility = flags
            window.decorView.postDelayed({
              window.decorView.systemUiVisibility = flags
            }, 50)
          }
        }
      } catch (e: Exception) {
        // Ignore errors
      }
    }
  }

  fun showSystemUI() {
    runOnUiThread {
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          // Android 11+ (API 30+) - Use WindowInsetsController
          val controller = window.insetsController
          if (controller != null) {
            controller.show(WindowInsets.Type.navigationBars())
            controller.systemBarsBehavior = android.view.WindowInsetsController.BEHAVIOR_DEFAULT

            // Force apply immediately
            window.decorView.requestApplyInsets()
          }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
          // Android 4.4+ (API 19+) - Use system UI flags
          val flags = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
          )

          window.decorView.systemUiVisibility = flags

          // Force apply on next frame
          window.decorView.post {
            window.decorView.systemUiVisibility = flags
          }
        }
      } catch (e: Exception) {
        // Ignore errors
      }
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
