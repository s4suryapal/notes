# Memory optimization settings for R8
# These settings help reduce memory usage during the R8/ProGuard process

# Optimize for memory usage during compilation
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*,!code/allocation/variable

# Keep only essential attributes (consolidated)
-keepattributes SourceFile,LineNumberTable,*Annotation*
-keepattributes !MethodParameters

# React Native packages / modules
-keep class com.facebook.react.ReactPackage { *; }
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}

# Kotlin coroutines
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# Strip logs for APK size while keeping warnings/errors for diagnostics
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
