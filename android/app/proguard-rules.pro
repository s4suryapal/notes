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

# === NotesAI App Specific ===
# All app classes
-keep class com.notesai.easynotes.** { *; }
-dontwarn com.notesai.easynotes.**

# === Kotlin / Coroutines ===
-dontwarn kotlin.**
-keep class kotlin.jvm.internal.** { *; }
-keepclassmembers class kotlin.Metadata { *; }

# Kotlin Coroutines (used in Expo Dev Launcher and app async operations)
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**
-dontwarn kotlinx.coroutines.flow.**

# === Android Framework ===
# Android SDK (covers webkit, telephony, etc.)
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

# === React Native Pell Rich Editor ===
-keep class com.wxik.** { *; }
-dontwarn com.wxik.**

# === Document Scanner Plugin ===
-keep class com.documentscanner.** { *; }
-dontwarn com.documentscanner.**

# === ML Kit Text Recognition ===
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**
-keep class com.google.android.gms.vision.** { *; }
-dontwarn com.google.android.gms.vision.**

# === MMKV (react-native-mmkv) ===
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.tencent.mmkv.**
-keepclassmembers class com.tencent.mmkv.** {
    <fields>;
    <methods>;
}

# === Supabase / Networking ===
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
# Note: If using proguard-memory-optimize.pro, ALL logs including w/e are stripped

# === General Rules ===
# Keep all essential attributes (consolidated)
-keepattributes Signature,*Annotation*,SourceFile,LineNumberTable,EnclosingMethod,InnerClasses

# Keep JNI registration methods
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Add any project specific keep options here:
