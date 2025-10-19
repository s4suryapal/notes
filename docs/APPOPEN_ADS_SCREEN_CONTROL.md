# Screen-Specific AppOpen Ads Control

## Overview

You can now control **which screens show AppOpen ads** when users return from background!

By default, AppOpen ads show on **all screens** when returning from background. But you can configure it to show only on specific screens (e.g., only on Settings screen).

---

## How It Works

```
User on Settings screen
  ↓
User presses Home button
  ↓
User returns to app
  ↓
Native checks: "Is current screen 'settings'?"
  ↓ YES
Shows AppOpen ad ✅
  ↓
User back on Settings screen
```

```
User on Home screen
  ↓
User presses Home button
  ↓
User returns to app
  ↓
Native checks: "Is current screen 'home'?"
  ↓ NO (only settings allowed)
Skips AppOpen ad ⏭️
  ↓
User back on Home screen
```

---

## Quick Start

### **Option 1: Show AppOpen Ads Only on Settings Screen**

```tsx
// app/(drawer)/settings.tsx
import { useAppOpenAdScreen } from '@/hooks/useAppOpenAdControl';

export default function SettingsScreen() {
  // Automatically track this screen for AppOpen ads
  useAppOpenAdScreen('settings');

  return (
    <View>
      <Text>Settings</Text>
    </View>
  );
}
```

```tsx
// app/_layout.tsx
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

function AppNavigation() {
  const appOpenAd = useAppOpenAdControl();

  useEffect(() => {
    // Configure: Only show AppOpen ads on settings screen
    appOpenAd.setEnabledScreens(['settings']);
  }, []);

  // ... rest of your code
}
```

---

### **Option 2: Show AppOpen Ads on Multiple Screens**

```tsx
// app/_layout.tsx
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

function AppNavigation() {
  const appOpenAd = useAppOpenAdControl();

  useEffect(() => {
    // Show AppOpen ads on settings AND premium screens only
    appOpenAd.setEnabledScreens(['settings', 'premium', 'sync']);
  }, []);
}
```

```tsx
// Track each screen
// app/(drawer)/settings.tsx
useAppOpenAdScreen('settings');

// app/(drawer)/premium.tsx
useAppOpenAdScreen('premium');

// app/(drawer)/sync.tsx
useAppOpenAdScreen('sync');
```

---

### **Option 3: Show on All Screens (Default)**

```tsx
// app/_layout.tsx
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

function AppNavigation() {
  const appOpenAd = useAppOpenAdControl();

  useEffect(() => {
    // Empty array = show on ALL screens (default behavior)
    appOpenAd.setEnabledScreens([]);
  }, []);
}
```

---

## API Reference

### `useAppOpenAdControl()`

Main hook for controlling AppOpen ads.

**Methods:**

```typescript
const appOpenAd = useAppOpenAdControl();

// Set which screens can show AppOpen ads
appOpenAd.setEnabledScreens(['settings', 'premium']);

// Disable AppOpen ads globally
await appOpenAd.setEnabled(false);

// Enable AppOpen ads globally
await appOpenAd.setEnabled(true);

// Get current configuration (debugging)
const config = await appOpenAd.getConfiguration();
console.log(config);
// {
//   currentScreen: 'settings',
//   enabledScreens: ['settings', 'premium'],
//   isEnabled: true
// }
```

### `useAppOpenAdScreen(screenName)`

Auto-tracking hook for individual screens.

**Usage:**

```typescript
// In any screen component
function MyScreen() {
  useAppOpenAdScreen('my-screen-name');

  return <View>...</View>;
}
```

---

## Complete Example

Here's a full implementation showing AppOpen ads **only on Settings screen**:

### **1. Configure in _layout.tsx:**

```tsx
// app/_layout.tsx
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

function AppNavigation() {
  const appOpenAd = useAppOpenAdControl();

  useEffect(() => {
    // Only show AppOpen ads when user returns to settings screen
    appOpenAd.setEnabledScreens(['settings']);
    console.log('AppOpen ads configured for settings screen only');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(drawer)" />
      {/* ... other screens */}
    </Stack>
  );
}
```

### **2. Track in Settings Screen:**

```tsx
// app/(drawer)/settings.tsx
import { useAppOpenAdScreen } from '@/hooks/useAppOpenAdControl';

export default function SettingsScreen() {
  // Mark this screen as "settings"
  useAppOpenAdScreen('settings');

  return (
    <View>
      <Text>Settings</Text>
      {/* Your settings UI */}
    </View>
  );
}
```

### **3. User Flow:**

```
User on Settings screen
  ↓
Presses Home
  ↓
Returns to app
  ↓
AppOpen ad shows ✅ (because screen = 'settings')
  ↓
Closes ad
  ↓
Back on Settings screen
```

```
User on Home screen
  ↓
Presses Home
  ↓
Returns to app
  ↓
No AppOpen ad ⏭️ (because screen ≠ 'settings')
  ↓
Back on Home screen
```

---

## Advanced: Dynamic Control

You can change configuration at runtime:

```tsx
function PremiumScreen() {
  const appOpenAd = useAppOpenAdControl();
  const [isPremium, setIsPremium] = useState(false);

  useAppOpenAdScreen('premium');

  useEffect(() => {
    if (isPremium) {
      // Premium users don't see AppOpen ads
      appOpenAd.setEnabled(false);
    } else {
      // Free users see AppOpen ads
      appOpenAd.setEnabled(true);
    }
  }, [isPremium]);

  return <View>...</View>;
}
```

---

## Debugging

Check logs to see what's happening:

```bash
adb logcat | grep -E "(AppOpenAd|AppOpenAdModule)"
```

**Example output:**

```
AppOpenAdModule: 📍 Current screen set to: settings
AppOpenAdModule: 🎯 AppOpen ads enabled only on: settings
AppOpenAdManager: 📱 App came to foreground
AppOpenAdManager: 🔄 Returning from background - showing AppOpen ad
AppOpenAdModule: ✅ Current screen 'settings' is enabled for AppOpen ads
AppOpenAdManager: 📺 Showing App Open Ad
```

---

## Important Notes

1. **Native + React Native Hybrid**: Native layer handles lifecycle, React Native controls which screens
2. **Default Behavior**: If you don't configure anything, AppOpen ads show on **all screens**
3. **Performance**: No performance impact - native layer does the heavy lifting
4. **Screen Names**: Use consistent naming (e.g., 'settings', not 'Settings' or 'settings-screen')
5. **iOS**: Currently Android-only (iOS doesn't have AppOpen ads concept)

---

## Best Practices

### ✅ **Good Use Cases:**

- Show AppOpen ads only on monetizable screens (Settings, Premium)
- Skip AppOpen ads during critical user flows (checkout, onboarding)
- Disable AppOpen ads for premium users

### ❌ **Avoid:**

- Too many enabled screens (defeats the purpose)
- Changing configuration too frequently (confusing for users)
- Showing ads on every single screen (use banner ads instead)

---

## Migration Guide

If you were using the old `useAppOpenAd` hook (now removed):

**Before:**
```tsx
// ❌ Old approach (removed)
const { showAd, preloadAd } = useAppOpenAd();
await showAd({ reason: 'app-launch' });
```

**After:**
```tsx
// ✅ New approach (automatic)
const appOpenAd = useAppOpenAdControl();
appOpenAd.setEnabledScreens(['settings']); // Configure once

// Native layer handles everything automatically!
```

---

## Troubleshooting

**AppOpen ads not showing:**
1. Check if `MIN_LAUNCHES_BEFORE_AD` threshold is met (default: 3 launches)
2. Verify screen name matches: `await appOpenAd.getConfiguration()`
3. Check if ads are globally enabled: `await appOpenAd.setEnabled(true)`

**AppOpen ads showing on wrong screens:**
1. Make sure you're calling `useAppOpenAdScreen()` in each screen
2. Verify enabled screens list: `await appOpenAd.getConfiguration()`
3. Check native logs for current screen tracking

**Build errors:**
1. Clean and rebuild: `cd android && ./gradlew clean && cd ..`
2. Make sure `AppOpenAdPackage` is registered in `MainApplication.kt`
