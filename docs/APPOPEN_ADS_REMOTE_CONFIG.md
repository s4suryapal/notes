# AppOpen Ads - Firebase Remote Config Integration

## Overview

AppOpen ads are now fully controlled by **Firebase Remote Config**, allowing you to dynamically configure ad behavior without releasing app updates!

---

## Remote Config Parameters

Configure these parameters in your Firebase Console:

### **Global Controls**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `appopen_ads_enabled` | Boolean | `true` | Master toggle for all AppOpen ads |
| `appopen_min_launches` | Number | `3` | Minimum app launches before showing ads |
| `appopen_enabled_screens` | String | `""` | Comma-separated list of screens (empty = all screens) |

### **Screen-Specific Controls**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `settings_screen_show_appopen` | Boolean | `false` | Enable AppOpen ads on settings screen |
| `settings_screen_appopen_id` | String | `""` | Ad unit ID for settings screen |
| `premium_screen_show_appopen` | Boolean | `false` | Enable AppOpen ads on premium screen |
| `premium_screen_appopen_id` | String | `""` | Ad unit ID for premium screen |

### **Ad Unit IDs**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `appopen_ad_unit_id_test` | String | `ca-app-pub-3940256099942544/9257395921` | Test ad unit ID (development) |
| `appopen_ad_unit_id_prod` | String | `""` | Production ad unit ID |

---

## How It Works

### **1. App Initialization Flow**

```
App Launch
  ↓
Initialize AdMob SDK (banner ads)
  ↓
Load LanguageContext
  ↓
Hide Splash → Show App ⚡ FAST STARTUP
  ↓
[BACKGROUND - Non-blocking]
  ↓
Fetch Remote Config
  ↓
Configure AppOpen ads:
  - Global enabled/disabled
  - Enabled screens list
  - Ad unit IDs
  ↓
Native AppOpenAdManager loads ad
  ↓
Ready to show on background return
```

**Why deferred?**
- Remote Config is NOT needed during splash (AppOpen ads only show on background return)
- Faster app startup (splash time: ~1-1.5s instead of ~2-3s)
- Better user experience (app appears immediately)

### **2. Background Return Flow**

```
User presses Home
  ↓
App goes to background
  ↓
User returns to app
  ↓
Native checks Remote Config rules:
  - Is appopen_ads_enabled = true?
  - Is current screen in enabled list?
  - Has user launched app 3+ times?
  ↓ YES
Show AppOpen ad
  ↓
User back in app
```

---

## Firebase Console Setup

### **Step 1: Create Remote Config Parameters**

1. Open Firebase Console → **Remote Config**
2. Click **"Add parameter"** for each parameter below
3. Set default values (will be used in production)

### **Step 2: Example Configuration**

#### **Show AppOpen ads ONLY on Settings screen:**

```json
{
  "appopen_ads_enabled": true,
  "appopen_enabled_screens": "settings",
  "settings_screen_show_appopen": true,
  "settings_screen_appopen_id": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy",
  "appopen_min_launches": 3
}
```

#### **Show AppOpen ads on Settings AND Premium screens:**

```json
{
  "appopen_ads_enabled": true,
  "appopen_enabled_screens": "settings,premium",
  "settings_screen_show_appopen": true,
  "settings_screen_appopen_id": "ca-app-pub-xxxxxxxxxxxxxxxx/1111111111",
  "premium_screen_show_appopen": true,
  "premium_screen_appopen_id": "ca-app-pub-xxxxxxxxxxxxxxxx/2222222222",
  "appopen_min_launches": 3
}
```

#### **Show AppOpen ads on ALL screens:**

```json
{
  "appopen_ads_enabled": true,
  "appopen_enabled_screens": "",
  "appopen_min_launches": 3
}
```

#### **Disable AppOpen ads completely:**

```json
{
  "appopen_ads_enabled": false
}
```

---

## Testing Remote Config

### **1. Test in Development Mode**

Remote Config uses **0ms fetch interval** in development (`__DEV__ = true`), so changes are immediate:

```bash
# Start development server
npm run dev

# Watch logs for Remote Config
adb logcat | grep -E "(REMOTE_CONFIG|APPOPEN)"
```

**Expected logs:**

```
[SPLASH] 🚀 Starting app initialization...
[ADMOB] ✅ AdMob SDK initialized
[CONTEXT] ✅ Language context loaded
[SPLASH] ✅ Initialization complete (1200ms) - hiding splash
[SPLASH] 👋 Native splash hidden - app visible

[BACKGROUND] 🔄 Background init starting...
[FIREBASE] ✅ Crashlytics initialized (background)
[FIREBASE] ✅ Analytics initialized (background)
[REMOTE_CONFIG] 🔄 Fetching AppOpen ad configuration...
[REMOTE_CONFIG] ✅ Remote Config initialized (background)
[APPOPEN] 📺 Configuring AppOpen ads from Remote Config: {
  settings_screen_show_appopen: true,
  settings_screen_appopen_id: "ca-app-pub-...",
  appopen_enabled_screens: "settings",
  appopen_ads_enabled: true,
  appopen_min_launches: 3
}
[APPOPEN] ✅ Enabled screens: ["settings"]
[APPOPEN] ✅ Using settings screen ad unit ID
[APPOPEN] ✅ AppOpen ads configured from Remote Config (background)
[BACKGROUND] ✅ All background services initialized
```

**Note:** Remote Config is fetched in BACKGROUND (after splash is hidden) for faster app startup!

### **2. Test Ad Display**

1. Set `settings_screen_show_appopen: true` in Firebase Console
2. Restart app (3+ times to meet minimum launches)
3. Navigate to Settings screen
4. Press Home button
5. Return to app
6. **AppOpen ad should show! ✅**

### **3. Test Screen Filtering**

1. Set `appopen_enabled_screens: "settings"` in Firebase Console
2. Navigate to **Home screen**
3. Press Home → Return to app
4. **No ad should show** (not on settings screen)
5. Navigate to **Settings screen**
6. Press Home → Return to app
7. **AppOpen ad should show! ✅**

---

## Production Deployment

### **1. Set Production Ad Unit IDs**

In Firebase Console, set these parameters:

```json
{
  "appopen_ad_unit_id_prod": "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy",
  "settings_screen_appopen_id": "ca-app-pub-xxxxxxxxxxxxxxxx/1111111111"
}
```

### **2. Fetch Interval**

Production uses **12-hour fetch interval** (`43200000ms`):
- Remote Config fetches new values every 12 hours
- Users need to restart app to see changes
- This is a **Google best practice** to reduce network calls

### **3. Release Notes**

When releasing updates, include:

```
✨ AppOpen ads now controlled by Remote Config
📺 Dynamic configuration without app updates
🎯 Screen-specific ad control
```

---

## Advanced Use Cases

### **Use Case 1: A/B Testing**

Test different ad configurations with Firebase A/B Testing:

```json
// Variant A: Show on all screens
{
  "appopen_enabled_screens": ""
}

// Variant B: Show only on settings
{
  "appopen_enabled_screens": "settings"
}

// Measure: Ad impressions, revenue, user retention
```

### **Use Case 2: Progressive Rollout**

Gradually enable AppOpen ads:

```json
// Week 1: Disable for all users
{ "appopen_ads_enabled": false }

// Week 2: Enable for 10% of users (use Remote Config conditions)
{ "appopen_ads_enabled": true }

// Week 3: Enable for 50% of users
// Week 4: Enable for 100% of users
```

### **Use Case 3: Premium Users**

Disable ads for premium users using Firebase conditions:

```json
// Condition: "user_type == 'premium'"
{
  "appopen_ads_enabled": false
}

// Condition: "user_type == 'free'"
{
  "appopen_ads_enabled": true
}
```

---

## Debugging

### **Check Current Configuration**

Use the `getConfiguration()` method:

```typescript
import { useAppOpenAdControl } from '@/hooks/useAppOpenAdControl';

const appOpenAd = useAppOpenAdControl();
const config = await appOpenAd.getConfiguration();

console.log('Current AppOpen Ad Config:', config);
// {
//   currentScreen: 'settings',
//   enabledScreens: ['settings', 'premium'],
//   isEnabled: true,
//   adUnitId: 'ca-app-pub-...'
// }
```

### **Force Fetch Remote Config**

```typescript
import remoteConfig from '@/services/remoteConfig';

// Force fetch latest values from Firebase
await remoteConfig.fetchAndActivate();

// Get updated AppOpen ad config
const config = remoteConfig.getAppOpenAdConfig();
console.log('Updated config:', config);
```

### **Check Native Logs**

```bash
# Android
adb logcat | grep -E "(AppOpenAdManager|AppOpenAdModule|REMOTE_CONFIG)"

# Expected output:
AppOpenAdManager: 📱 App came to foreground
AppOpenAdManager: 🔄 Returning from background - showing AppOpen ad
AppOpenAdModule: ✅ Current screen 'settings' is enabled for AppOpen ads
AppOpenAdManager: 📺 Using Remote Config ad unit ID: ca-app-pub-...
AppOpenAdManager: ✅ App Open Ad loaded successfully
AppOpenAdManager: 📺 Showing App Open Ad
```

---

## Troubleshooting

### **Problem: AppOpen ads not showing**

**Check these in order:**

1. **Is `appopen_ads_enabled = true`?**
   ```typescript
   const config = remoteConfig.getAppOpenAdConfig();
   console.log('Enabled?', config.enabled);
   ```

2. **Has user launched app 3+ times?**
   ```bash
   adb logcat | grep "Launch count"
   # Output: "Launch count: 3 (min required: 3)"
   ```

3. **Is current screen in enabled list?**
   ```typescript
   const config = await appOpenAd.getConfiguration();
   console.log('Current screen:', config.currentScreen);
   console.log('Enabled screens:', config.enabledScreens);
   ```

4. **Is ad unit ID valid?**
   ```bash
   adb logcat | grep "ad unit ID"
   # Should NOT be empty or test ID in production
   ```

### **Problem: Remote Config not updating**

1. Check fetch interval: Development = 0ms, Production = 12 hours
2. Force fetch: `await remoteConfig.fetchAndActivate()`
3. Restart app (config is fetched at startup)
4. Check Firebase Console for parameter typos

### **Problem: Wrong ad unit ID being used**

Check priority order:
1. **Screen-specific ID** (e.g., `settings_screen_appopen_id`)
2. **Default production ID** (`appopen_ad_unit_id_prod`)
3. **Default test ID** (`appopen_ad_unit_id_test`)
4. **Hardcoded test ID** (`ca-app-pub-3940256099942544/9257395921`)

---

## Best Practices

### ✅ **Do:**
- Use test ad unit IDs during development
- Set `appopen_min_launches >= 3` (don't annoy new users)
- Use screen-specific controls for better UX
- Test on real devices (not emulators)
- Monitor Firebase Analytics for ad performance

### ❌ **Don't:**
- Use production ad unit IDs in development
- Set `appopen_min_launches = 0` (bad UX for new users)
- Show ads on every single screen (use banners instead)
- Change Remote Config too frequently (12-hour fetch interval)
- Forget to publish Remote Config changes in Firebase Console

---

## Migration from Hardcoded Values

If you were previously using hardcoded ad unit IDs in `MainApplication.kt`:

**Before:**
```kotlin
private const val PROD_AD_UNIT_ID = "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy"
appOpenAdManager = AppOpenAdManager(this, PROD_AD_UNIT_ID)
```

**After:**
```kotlin
// Keep default ad unit ID as fallback
private const val PROD_AD_UNIT_ID = "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyyyyyy"
appOpenAdManager = AppOpenAdManager(this, PROD_AD_UNIT_ID)

// Remote Config will override this at runtime!
// Set in Firebase Console: appopen_ad_unit_id_prod
```

**Benefits:**
- Change ad unit IDs without app updates
- A/B test different ad units
- Disable ads for specific users
- Screen-specific ad units

---

## Summary

✅ **Firebase Remote Config** controls all AppOpen ad behavior
✅ **Screen-specific** ad display and ad unit IDs
✅ **Dynamic configuration** without app updates
✅ **A/B testing** and progressive rollout support
✅ **Graceful fallbacks** if Remote Config fails

**Key Files:**
- `services/remoteConfig.ts` - Remote Config service
- `app/_layout.tsx` - Initialization and configuration
- `hooks/useAppOpenAdControl.ts` - React Native bridge
- `android/.../AppOpenAdModule.kt` - Native bridge module
- `android/.../AppOpenAdManager.kt` - Ad lifecycle manager

**Next Steps:**
1. Set up Firebase Console parameters
2. Test with `settings_screen_show_appopen: true`
3. Deploy to production with proper ad unit IDs
4. Monitor Firebase Analytics for performance
