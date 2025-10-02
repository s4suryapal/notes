# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# === React Native / Expo Core ===
# React Native (covers bridge, modules, turbomodule, etc.)
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
# Ensure TurboModules/bridge interfaces retain members
-keepclassmembers class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule { *; }

# Hermes JS engine
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# === Expo Modules ===
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# === Networking / HTTP ===
# OkHttp
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**

# Okio
-keep class okio.** { *; }
-dontwarn okio.**

# === JSON Serialization ===
# Gson (for JSON parsing with reflection)
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

# Gson SerializedName support (keeps field names for JSON serialization)
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# === Notes App Specific ===
# Notes app classes
-keep class com.notesai.app.** { *; }
-dontwarn com.notesai.app.**

# === Kotlin / Coroutines ===
-dontwarn kotlin.**
-keep class kotlin.jvm.internal.** { *; }
-keepclassmembers class kotlin.Metadata { *; }

# Kotlin Coroutines
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**
-dontwarn kotlinx.coroutines.flow.**

# === Android Framework ===
# Android SDK
-dontwarn android.**

# AndroidX
# Targeted keeps for native dependencies
-keep class androidx.lifecycle.** { *; }
-keep class androidx.window.** { *; }
-keep class androidx.core.splashscreen.** { *; }

# === React Native Gesture Handler ===
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**

# === React Native Screens ===
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**

# === React Native SVG ===
-keep class com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**

# === React Native WebView ===
-keep class com.reactnativecommunity.webview.** { *; }
-dontwarn com.reactnativecommunity.webview.**

# === AsyncStorage ===
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# === Supabase ===
-keep class io.supabase.** { *; }
-dontwarn io.supabase.**

# === Optimization: Strip Debug Logs (Release Only) ===
# Remove debug/verbose/info logs from release builds for smaller APK
# Keep warnings and errors for production debugging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# === General Rules ===
# Keep all essential attributes (consolidated)
-keepattributes Signature,*Annotation*,SourceFile,LineNumberTable,EnclosingMethod,InnerClasses

# Keep JNI registration methods
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Add any project specific keep options here:
