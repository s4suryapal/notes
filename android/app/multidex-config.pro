# Multidex Keep Configuration for Fast Debug Builds
# This file reduces dex optimization time in debug builds

# Keep main application class
-keep public class * extends android.app.Application

# Keep all activities, services, receivers, providers
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Minimal rules for faster builds
