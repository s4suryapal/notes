package com.notesai.app
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.animation.ObjectAnimator
import androidx.core.animation.doOnEnd
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // 🚀 Install Android 12+ Splash Screen API FIRST (before super.onCreate)
    // This handles the native splash screen with smooth animation
    val splashScreen = installSplashScreen()

    // Keep splash screen visible during app loading
    var keepSplashOnScreen = true
    splashScreen.setKeepOnScreenCondition { keepSplashOnScreen }

    // 🎨 Add smooth exit animation when dismissing splash
    splashScreen.setOnExitAnimationListener { splashScreenView ->
      // Slide up animation for modern feel
      val slideUp = ObjectAnimator.ofFloat(
        splashScreenView.view,
        View.TRANSLATION_Y,
        0f,
        -splashScreenView.view.height.toFloat()
      )
      slideUp.duration = 300L
      slideUp.start()

      // Remove splash screen after animation completes
      slideUp.doOnEnd {
        splashScreenView.remove()
      }
    }

    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen

    super.onCreate(null)

    // 🚀 Allow splash screen to dismiss after React Native loads (500ms delay)
    Handler(Looper.getMainLooper()).postDelayed({
      keepSplashOnScreen = false
    }, 500)
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
