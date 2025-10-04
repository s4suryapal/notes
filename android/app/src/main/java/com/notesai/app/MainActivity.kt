package com.notesai.app
import expo.modules.splashscreen.SplashScreenManager

import android.content.Intent
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
import com.facebook.react.modules.core.DeviceEventManagerModule

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // 🚀 Install Android 12+ Splash Screen API FIRST (before super.onCreate)
    val splashScreen = installSplashScreen()

    // Keep splash screen visible during app loading
    var keepSplashOnScreen = true
    splashScreen.setKeepOnScreenCondition { keepSplashOnScreen }

    // 🎨 Add smooth exit animation when dismissing splash
    splashScreen.setOnExitAnimationListener { splashScreenView ->
      val slideUp = ObjectAnimator.ofFloat(
        splashScreenView.view,
        View.TRANSLATION_Y,
        0f,
        -splashScreenView.view.height.toFloat()
      )
      slideUp.duration = 300L
      slideUp.start()

      slideUp.doOnEnd {
        splashScreenView.remove()
      }
    }

    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen

    super.onCreate(null)

    // 🚀 Allow splash screen to dismiss after React Native loads
    Handler(Looper.getMainLooper()).postDelayed({
      keepSplashOnScreen = false
    }, 500)

    // 📝 Start persistent notification service
    PersistentNotificationService.start(this)

    // 📝 Handle notification action intents
    handleNotificationAction(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleNotificationAction(intent)
  }

  private fun handleNotificationAction(intent: Intent?) {
    when (intent?.action) {
      PersistentNotificationService.ACTION_TEXT_NOTE -> {
        sendEventToJS("onNotificationAction", "text")
      }
      PersistentNotificationService.ACTION_PHOTO_NOTE -> {
        sendEventToJS("onNotificationAction", "photo")
      }
      PersistentNotificationService.ACTION_AUDIO_NOTE -> {
        sendEventToJS("onNotificationAction", "audio")
      }
    }
  }

  private fun sendEventToJS(eventName: String, data: String) {
    reactInstanceManager.currentReactContext
      ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      ?.emit(eventName, data)
  }

  override fun getMainComponentName(): String = "main"

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

  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              super.invokeDefaultOnBackPressed()
          }
          return
      }
      super.invokeDefaultOnBackPressed()
  }
}
