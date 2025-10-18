# AppOpen Ads Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Current Implementation](#current-implementation)
4. [Files Structure](#files-structure)
5. [Configuration](#configuration)
6. [Screen-Specific Ads](#screen-specific-ads)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Performance Optimization](#performance-optimization)
10. [Best Practices](#best-practices)

---

## Overview

### What are AppOpen Ads?

AppOpen ads are full-screen ads that appear when users:
- Return to your app from background (e.g., after pressing Home button)
- Switch back to your app from another app

They do **NOT** show:
- On first app launch (splash screen)
- During app cold starts
- For the first 2 app launches (user familiarity period)

### Benefits

✅ High visibility and engagement
✅ Non-intrusive (natural break points)
✅ Good eCPM rates
✅ Recommended by Google AdMob

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   App Launch Flow                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│   MainApplication.kt                                    │
│   - Initializes AppOpenAdManager                        │
│   - Increments launch count                             │
│   - Preloads first AppOpen ad                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│   AppOpenAdManager.kt (Native Android)                  │
│   - Listens to ProcessLifecycleOwner                    │
│   - Detects app foreground/background                   │
│   - Manages ad loading and showing                      │
│   - Skips ads on first start (isFirstStart flag)        │
│   - Checks screen permissions before showing            │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│   AppOpenAdModule.kt (Bridge)                           │
│   - Receives current screen from React Native           │
│   - Stores screen configuration                         │
│   - Provides shouldShowAdOnCurrentScreen() check        │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│   React Native Layer                                    │
│   - useAppOpenAdControl() hook                          │
│   - useAppOpenAdScreen() hook                           │
│   - Configures which screens show ads                   │
│   - Tracks current screen on navigation                 │
└─────────────────────────────────────────────────────────┘
```

---

## Current Implementation

### 1. Native Layer (Android)

#### **AppOpenAdManager.kt**

Location: `android/app/src/main/java/.../AppOpenAdManager.kt`

**Purpose:** Manages AppOpen ad lifecycle, loading, and display logic.

**Key Features:**
- Monitors app lifecycle using `ProcessLifecycleOwner`
- Skips ads on first app start (splash screen)
- Shows ads when returning from background
- Respects minimum launch count (3 launches)
- Handles ad expiration (4 hours)
- Checks screen permissions before showing

**Configuration Constants:**
```kotlin
private const val FOUR_HOURS_MILLIS = 4 * 60 * 60 * 1000L
private const val MIN_LAUNCHES_BEFORE_AD = 3 // Don't show on first 2 launches
```

**Lifecycle Flow:**
```kotlin
override fun onStart(owner: LifecycleOwner) {
    // Called when app comes to foreground

    if (isFirstStart) {
        // Skip on first start (app launch/splash)
        isFirstStart = false
        return
    }

    // Check launch count
    if (!shouldShowAd()) return

    // Check screen permissions
    if (!shouldShowAdOnCurrentScreen()) return

    // Show ad
    showAdIfAvailable(activity)
}
```

#### **AppOpenAdModule.kt**

Location: `android/app/src/main/java/.../AppOpenAdModule.kt`

**Purpose:** React Native bridge for screen-specific ad control.

**Exposed Methods:**
```kotlin
@ReactMethod
fun setCurrentScreen(screenName: String)

@ReactMethod
fun setEnabledScreens(screens: ReadableArray)

@ReactMethod
fun setAppOpenAdsEnabled(enabled: Boolean, promise: Promise)

@ReactMethod
fun getConfiguration(promise: Promise)
```

**Static State (Shared with AppOpenAdManager):**
```kotlin
companion object {
    @Volatile var currentScreen: String = ""
    @Volatile var enabledScreens: Set<String> = emptySet()
    @Volatile var isAppOpenAdsEnabled: Boolean = true
}
```

#### **MainApplication.kt**

Location: `android/app/src/main/java/.../MainApplication.kt`

**Purpose:** Initialize AppOpenAdManager on app start.

```kotlin
override fun onCreate() {
    super.onCreate()

    // Initialize App Open Ad Manager
    val adUnitId = if (BuildConfig.DEBUG) TEST_AD_UNIT_ID else PROD_AD_UNIT_ID
    appOpenAdManager = AppOpenAdManager(this, adUnitId)

    // Increment launch count
    appOpenAdManager.incrementLaunchCount()

    // Preload ad for future use
    appOpenAdManager.preloadAd()
}
```

**Registered Packages:**
```kotlin
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(OverlaySettingsPackage())
        add(AppControlPackage())
        add(FirebaseAIPackage())
        add(AppOpenAdPackage()) // ← AppOpen ad bridge
    }
```

### 2. React Native Layer

#### **useAppOpenAdControl.ts**

Location: `hooks/useAppOpenAdControl.ts`

**Purpose:** React Native hook for controlling AppOpen ads.

**Usage:**
```typescript
const appOpenAd = useAppOpenAdControl();

// Configure which screens can show ads
appOpenAd.setEnabledScreens(['settings', 'premium']);

// Disable ads globally
await appOpenAd.setEnabled(false);

// Debug current config
const config = await appOpenAd.getConfiguration();
```

**API:**
```typescript
interface AppOpenAdControl {
  setCurrentScreen: (screenName: string) => void;
  setEnabledScreens: (screens: string[]) => void;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  getConfiguration: () => Promise<{
    currentScreen: string;
    enabledScreens: string[];
    isEnabled: boolean;
  }>;
}
```

#### **useAppOpenAdScreen()**

**Purpose:** Auto-track current screen for AppOpen ads.

**Usage:**
```typescript
function SettingsScreen() {
  useAppOpenAdScreen('settings');

  return <View>...</View>;
}
```

---

## Files Structure

```
android/app/src/main/java/.../
├── AppOpenAdManager.kt          # Native ad lifecycle manager
├── AppOpenAdModule.kt           # React Native bridge module
├── AppOpenAdPackage.kt          # Module package registration
└── MainApplication.kt           # App initialization (registers package)

hooks/
└── useAppOpenAdControl.ts       # React Native hooks for ad control

docs/
├── APPOPEN_ADS_IMPLEMENTATION.md           # This file
└── APPOPEN_ADS_SCREEN_CONTROL.md          # Screen-specific control guide
```

---

## Configuration

### 1. Ad Unit IDs

**Location:** `MainApplication.kt`

```kotlin
companion object {
    // Test ad unit ID (use in development)
    private const val TEST_AD_UNIT_ID = "ca-app-pub-3940256099942544/9257395921"

    // Production ad unit ID (replace with your actual ID)
    private const val PROD_AD_UNIT_ID = "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy"
}
```

**Get your Production Ad Unit ID:**
1. Go to [AdMob Console](https://apps.admob.com/)
2. Select your app
3. Click "Ad units" → "Add ad unit"
4. Select "App open"
5. Copy the Ad unit ID
6. Replace `PROD_AD_UNIT_ID` in `MainApplication.kt`

### 2. Minimum Launch Count

**Location:** `AppOpenAdManager.kt`

```kotlin
private const val MIN_LAUNCHES_BEFORE_AD = 3 // Don't show on first 2 launches
```

**Customize:**
- `MIN_LAUNCHES_BEFORE_AD = 1` → Show ads on first launch
- `MIN_LAUNCHES_BEFORE_AD = 3` → Show ads on 3rd launch (default)
- `MIN_LAUNCHES_BEFORE_AD = 5` → Show ads on 5th launch

### 3. Ad Expiration Time

**Location:** `AppOpenAdManager.kt`

```kotlin
private const val FOUR_HOURS_MILLIS = 4 * 60 * 60 * 1000L
```

**Customize:**
```kotlin
private const val ONE_HOUR_MILLIS = 1 * 60 * 60 * 1000L     // 1 hour
private const val TWO_HOURS_MILLIS = 2 * 60 * 60 * 1000L    // 2 hours
private const val FOUR_HOURS_MILLIS = 4 * 60 * 60 * 1000L   // 4 hours (recommended)
```

---

## Screen-Specific Ads

### Use Case Examples

#### **Example 1: Show Ads Only on Settings Screen**

```typescript
// app/_layout.tsx
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

function AppNavigation() {
  const appOpenAd = useAppOpenAdControl();

  useEffect(() => {
    // Only show AppOpen ads when user is on settings screen
    appOpenAd.setEnabledScreens(['settings']);
  }, []);

  return <Stack>...</Stack>;
}
```

```typescript
// app/(drawer)/settings.tsx
import { useAppOpenAdScreen } from '@/hooks/useAppOpenAdControl';

export default function SettingsScreen() {
  useAppOpenAdScreen('settings');

  return (
    <View>
      <Text>Settings</Text>
    </View>
  );
}
```

**Result:**
- ✅ User on Settings → Goes to background → Returns → **AppOpen ad shows**
- ⏭️ User on Home → Goes to background → Returns → **No AppOpen ad**

#### **Example 2: Show Ads on Multiple Screens**

```typescript
// app/_layout.tsx
useEffect(() => {
  appOpenAd.setEnabledScreens(['settings', 'premium', 'sync']);
}, []);
```

```typescript
// Track each screen
// app/(drawer)/settings.tsx
useAppOpenAdScreen('settings');

// app/(drawer)/premium.tsx
useAppOpenAdScreen('premium');

// app/(drawer)/sync.tsx
useAppOpenAdScreen('sync');
```

#### **Example 3: Disable for Premium Users**

```typescript
function PremiumScreen() {
  const appOpenAd = useAppOpenAdControl();
  const { isPremium } = useUser();

  useEffect(() => {
    if (isPremium) {
      appOpenAd.setEnabled(false); // No ads for premium users
    } else {
      appOpenAd.setEnabled(true);  // Show ads for free users
    }
  }, [isPremium]);

  return <View>...</View>;
}
```

#### **Example 4: Show on All Screens (Default)**

```typescript
// app/_layout.tsx
useEffect(() => {
  // Empty array = show on all screens (default behavior)
  appOpenAd.setEnabledScreens([]);
}, []);
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  User Flow with Screen-Specific Ads                    │
└─────────────────────────────────────────────────────────┘

User on Settings screen
        ↓
useAppOpenAdScreen('settings') called
        ↓
Native: currentScreen = 'settings'
        ↓
User presses Home button
        ↓
App goes to background
        ↓
User returns to app
        ↓
ProcessLifecycleOwner.onStart() fires
        ↓
AppOpenAdManager checks:
  ✓ isFirstStart? NO
  ✓ Launch count >= 3? YES
  ✓ Current screen in enabled list? YES
        ↓
Shows AppOpen ad ✅
        ↓
User closes ad
        ↓
Back on Settings screen
```

---

## Testing

### 1. Build the App

```bash
# Clean build
cd android
./gradlew clean
cd ..

# Build debug APK
npm run build:dev-apk

# Or build directly
cd android
./gradlew assembleDebug
cd ..
```

### 2. Install and Test

```bash
# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or use npm script
npm run build:dev-apk && adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Monitor Logs

```bash
# Watch all AppOpen ad related logs
adb logcat | grep -E "(AppOpenAd|AppOpenAdModule|AppOpenAdManager)"

# Colorized logs (if you have colorize)
adb logcat | grep -E "(AppOpenAd|AppOpenAdModule|AppOpenAdManager)" | grep --color -E "✅|❌|📺|⏭️|🔄|📍"
```

### 4. Test Scenarios

#### **Scenario 1: First Launch (Should NOT show ad)**

```bash
# Force stop app
adb shell am force-stop com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

# Clear app data (reset launch count)
adb shell pm clear com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes

# Launch app
adb shell am start -n com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes/.MainActivity

# Expected log:
# AppOpenAdManager: 🚀 First start detected (splash screen) - skipping AppOpen ad
```

#### **Scenario 2: Return from Background (Should show ad after 3rd launch)**

```bash
# Launch app 3 times to meet MIN_LAUNCHES_BEFORE_AD
adb shell am start -n com.notesai.easynotes.ai.smart.notepad.ocr.docscanner.privatenotes/.MainActivity
# Wait, then press Home
# Repeat 2 more times

# On 3rd launch, press Home button, then return to app
# Expected log:
# AppOpenAdManager: 🔄 Returning from background - showing AppOpen ad
# AppOpenAdManager: 📺 Showing App Open Ad
```

#### **Scenario 3: Screen-Specific Ads**

```bash
# Navigate to Settings screen
# Press Home button
# Return to app

# Expected log:
# AppOpenAdModule: 📍 Current screen set to: settings
# AppOpenAdModule: ✅ Current screen 'settings' is enabled for AppOpen ads
# AppOpenAdManager: 📺 Showing App Open Ad
```

```bash
# Navigate to Home screen
# Press Home button
# Return to app

# Expected log:
# AppOpenAdModule: 📍 Current screen set to: home
# AppOpenAdModule: ❌ Current screen 'home' not in enabled list
# AppOpenAdManager: ⏭️ Skipping ad - current screen doesn't allow AppOpen ads
```

### 5. Debug Configuration

```typescript
// Check current configuration
const appOpenAd = useAppOpenAdControl();
const config = await appOpenAd.getConfiguration();
console.log('AppOpen Ad Config:', config);

// Output:
// {
//   currentScreen: 'settings',
//   enabledScreens: ['settings', 'premium'],
//   isEnabled: true
// }
```

---

## Troubleshooting

### Problem: AppOpen ads not showing at all

**Possible causes:**

1. **Launch count too low**
   ```bash
   # Check logs for launch count
   adb logcat | grep "Launch count"

   # Should see:
   # AppOpenAdManager: 🚀 Launch count: 3 (min required: 3)
   ```

   **Solution:** Launch app 3 times (or reduce `MIN_LAUNCHES_BEFORE_AD`)

2. **Ad not loaded**
   ```bash
   # Check if ad loaded successfully
   adb logcat | grep "App Open Ad"

   # Should see:
   # AppOpenAdManager: ✅ App Open Ad loaded successfully
   ```

   **Solution:** Wait a few seconds for ad to load, or check network connection

3. **Test ads not enabled**

   **Solution:** Make sure you're using test ad unit ID in debug builds:
   ```kotlin
   private const val TEST_AD_UNIT_ID = "ca-app-pub-3940256099942544/9257395921"
   ```

### Problem: AppOpen ads showing on wrong screens

**Possible causes:**

1. **Screen name not set**

   **Solution:** Add `useAppOpenAdScreen('screen-name')` to your screen component

2. **Screen name mismatch**

   ```bash
   # Check current screen
   adb logcat | grep "Current screen set to"

   # Should match your configuration
   ```

   **Solution:** Use consistent naming (e.g., 'settings', not 'Settings')

3. **Enabled screens not configured**

   **Solution:** Set enabled screens in `_layout.tsx`:
   ```typescript
   appOpenAd.setEnabledScreens(['settings']);
   ```

### Problem: AppOpen ads showing too frequently

**Possible causes:**

1. **Ad not expiring properly**

   **Solution:** Check `FOUR_HOURS_MILLIS` constant in `AppOpenAdManager.kt`

2. **Multiple instances loading ads**

   **Solution:** Only call `preloadAd()` once in `MainApplication.kt`

### Problem: Build errors after adding module

**Error:** `AppOpenAdModule cannot be resolved`

**Solution:**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
cd ..
```

**Error:** `AppOpenAdPackage not registered`

**Solution:** Check `MainApplication.kt` includes:
```kotlin
add(AppOpenAdPackage())
```

---

## Performance Optimization

### 1. Ad Preloading

AppOpen ads are preloaded in the background for instant display:

```kotlin
// In MainApplication.onCreate()
appOpenAdManager.preloadAd()

// In AppOpenAdManager.onAdDismissed()
loadAd() // Preload next ad
```

**Benefits:**
- ✅ Instant ad display when returning from background
- ✅ No waiting time for users
- ✅ Higher fill rates

### 2. Memory Management

Ads are automatically cleaned up:

```kotlin
override fun onAdDismissedFullScreenContent() {
    appOpenAd = null  // Release memory
    isShowingAd = false
    loadAd()  // Preload next ad
}
```

### 3. Battery Impact

**Native implementation = Minimal battery impact:**
- ✅ Uses efficient `ProcessLifecycleOwner` (Android system lifecycle)
- ✅ No continuous polling
- ✅ No JavaScript bridge overhead
- ✅ Ad loading happens in background

**vs React Native AppState:**
- ❌ Requires event listeners
- ❌ JavaScript bridge communication
- ❌ More battery drain

---

## Best Practices

### 1. Ad Frequency

**✅ DO:**
- Show ads when users naturally pause (background return)
- Skip ads on first launch and first few app uses
- Respect 4-hour ad expiration

**❌ DON'T:**
- Show ads on every screen transition
- Show multiple ads in quick succession
- Force ads during critical user flows

### 2. User Experience

**✅ DO:**
- Use screen-specific ads to target monetizable screens
- Disable ads for premium users
- Provide smooth transitions

**❌ DON'T:**
- Show ads during onboarding
- Interrupt important user actions
- Show ads too frequently

### 3. Testing

**✅ DO:**
- Always use test ad unit IDs in development
- Test on real devices
- Monitor logs for issues

**❌ DON'T:**
- Use production ad unit IDs in debug builds
- Click your own ads
- Test only on emulators

### 4. Configuration

**✅ DO:**
- Set minimum launch count (3-5 launches)
- Configure screen-specific ads strategically
- Use consistent screen naming

**❌ DON'T:**
- Show ads on first launch
- Enable too many screens for ads
- Change configuration too frequently

---

## Summary

### Current Status

✅ **Native Android implementation** using `ProcessLifecycleOwner`
✅ **Screen-specific control** via React Native bridge
✅ **Automatic ad preloading** for instant display
✅ **Skips ads on splash** (first app start)
✅ **Respects minimum launch count** (3 launches)
✅ **4-hour ad expiration** (Google recommended)
✅ **Detailed logging** for debugging

### Key Files

| File | Purpose |
|------|---------|
| `AppOpenAdManager.kt` | Native ad lifecycle manager |
| `AppOpenAdModule.kt` | React Native bridge |
| `AppOpenAdPackage.kt` | Module registration |
| `MainApplication.kt` | App initialization |
| `useAppOpenAdControl.ts` | React Native hooks |

### Quick Reference

**Show ads on all screens:**
```typescript
appOpenAd.setEnabledScreens([]);
```

**Show ads on specific screens:**
```typescript
appOpenAd.setEnabledScreens(['settings', 'premium']);
useAppOpenAdScreen('settings'); // In settings screen
```

**Disable ads globally:**
```typescript
await appOpenAd.setEnabled(false);
```

**Debug configuration:**
```typescript
const config = await appOpenAd.getConfiguration();
console.log(config);
```

---

## Additional Resources

- [Google AdMob AppOpen Ads Guide](https://developers.google.com/admob/android/app-open)
- [AdMob Best Practices](https://support.google.com/admob/answer/6128543)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-android)

---

**Last Updated:** 2025-10-19
**Version:** 1.0.0
