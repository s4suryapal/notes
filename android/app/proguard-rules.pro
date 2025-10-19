###############################################
# 📦 NotesAI Android - Optimized ProGuard Rules
# React Native + Expo + AdMob
###############################################

# === Core Optimization Passes ===
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# === React Native / Expo Core ===
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**
# Explicitly keep AppState + DeviceEventEmitter (defensive for R8)
-keep class com.facebook.react.modules.appstate.** { *; }
-keep class com.facebook.react.modules.core.DeviceEventManagerModule { *; }
-keep class com.facebook.react.modules.core.DeviceEventManagerModule$RCTDeviceEventEmitter { *; }
-keepclassmembers class * extends com.facebook.react.bridge.JavaScriptModule { *; }
-keepclassmembers class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# === React Native New Architecture ===
-keep class com.facebook.react.fabric.** { *; }
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
-keep class com.facebook.jsi.** { *; }

# === Google Mobile Ads (AdMob) ===
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**
-keep class com.google.android.gms.ads.identifier.** { *; }
-dontwarn com.google.android.gms.ads.identifier.**
-keep class com.google.ads.** { *; }
-keepclassmembers class com.google.android.gms.ads.** { *; }

# === Firebase (if used) ===
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# === Networking / JSON ===
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-keep class okio.** { *; }
-dontwarn okio.**
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Gson TypeAdapters
-keepattributes Signature
-keepattributes *Annotation*
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# === Kotlin / Coroutines ===
-dontwarn kotlin.**
-keep class kotlin.jvm.internal.** { *; }
-keepclassmembers class kotlin.Metadata { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**
-dontwarn kotlinx.coroutines.flow.**

# === AndroidX / Framework ===
-dontwarn android.**
-keep class androidx.** { *; }
-keepclassmembers class androidx.** { *; }
-keep class androidx.lifecycle.** { *; }
-keep class androidx.window.** { *; }
-keep class androidx.core.splashscreen.** { *; }

# === React Native Ecosystem ===
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }
-dontwarn com.swmansion.gesturehandler.**
-keep class com.swmansion.rnscreens.** { *; }
-dontwarn com.swmansion.rnscreens.**
-keep class com.horcrux.svg.** { *; }
-dontwarn com.horcrux.svg.**

# === App-specific native modules ===
-keep class com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes.** { *; }
-keepclassmembers class com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes.** { *; }
-dontwarn com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes.**

# === MMKV (react-native-mmkv) ===
-keep class com.tencent.mmkv.** { *; }
-dontwarn com.tencent.mmkv.**
-keepclassmembers class com.tencent.mmkv.** {
    <fields>;
    <methods>;
}

# === Strip Logs for Release (keeps w/e for diagnostics) ===
# Remove Android Log calls (Debug, Verbose, Info)
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Remove System.out.println (Java/Kotlin debugging)
-assumenosideeffects class * {
    public static *** println(...);
}

# Strip unused enum methods
-assumenosideeffects class * extends java.lang.Enum {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# === Strip React Native Dev / Debug Flags ===
-assumenosideeffects class com.facebook.react.bridge.ReactContext {
    boolean isDebugMode();
}

# === Keep JNI registration ===
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# === Native methods ===
-keepclasseswithmembernames class * {
    native <methods>;
}

# === Keep React Native modules ===
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}

# === Preserve essential attributes for reflection / debugging ===
-keepattributes Signature,*Annotation*,SourceFile,LineNumberTable,EnclosingMethod,InnerClasses

# === Optional (extra R8 optimizations) ===
# Collapse lambda + synthetic bridge methods (saves ~0.5–1 MB)
-dontwarn java.lang.invoke.*
-allowaccessmodification
