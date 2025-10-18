# Services Layer

This directory contains all service modules that interact with external APIs, native modules, and system features. Services follow a singleton pattern for consistent access across the app.

## Architecture Pattern

All services follow this structure:

```typescript
class ServiceName {
  private static instance: ServiceName;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }

  async initialize(): Promise<void> {
    // Initialize the service
  }

  // Public methods...
}

export const serviceName = ServiceName.getInstance();
export default serviceName;
```

## Available Services

### 1. **storageService** (`storageService.ts`)
Centralized MMKV storage management with type-safe keys.

**Usage:**
```typescript
import storageService, { STORAGE_KEYS } from '@/services/storageService';

// String operations
storageService.setString(STORAGE_KEYS.THEME_MODE, 'dark');
const theme = storageService.getString(STORAGE_KEYS.THEME_MODE);

// Object operations
storageService.setObject('user', { name: 'John', age: 30 });
const user = storageService.getObject<User>('user');

// Boolean operations
storageService.setBoolean(STORAGE_KEYS.FIRST_LAUNCH_COMPLETE, true);
const isComplete = storageService.getBoolean(STORAGE_KEYS.FIRST_LAUNCH_COMPLETE);
```

### 2. **analytics** (`analytics.ts`)
Firebase Analytics integration for event tracking and user properties.

**Usage:**
```typescript
import analytics from '@/services/analytics';

// Initialize (call once at app startup)
await analytics.initialize();

// Log events
analytics.logEvent('note_created', { category: 'work', hasImage: true });

// Log screen views
analytics.logScreenView('home');

// Set user properties
analytics.setUserProperty('premium_user', 'true');
```

### 3. **crashlytics** (`crashlytics.ts`)
Firebase Crashlytics for crash reporting and error tracking.

**Usage:**
```typescript
import crashlytics from '@/services/crashlytics';

// Initialize
await crashlytics.initialize();

// Log errors
crashlytics.logError(error, 'Error creating note');

// Set user attributes
await crashlytics.setUserAttributes({
  user_id: '123',
  premium: 'true'
});

// Log custom messages
crashlytics.log('User performed action X');
```

### 4. **admobService** (`admob.ts`)
Google AdMob integration for ad monetization.

**Usage:**
```typescript
import admobService from '@/services/admob';

// Initialize
await admobService.initialize();

// Show app open ad
await admobService.showAppOpenAd();

// Load interstitial ad
await admobService.loadInterstitial('ca-app-pub-xxx');
await admobService.showInterstitial();
```

### 5. **bannerAdManager** (`bannerAdManager.ts`)
Banner ad lifecycle management.

**Usage:**
```typescript
import bannerAdManager from '@/services/bannerAdManager';

// Register banner ad
bannerAdManager.registerBanner('home', adUnitId);

// Unregister when screen unmounts
bannerAdManager.unregisterBanner('home');
```

### 6. **remoteConfig** (`remoteConfig.ts`)
Firebase Remote Config with offline caching.

**Usage:**
```typescript
import remoteConfig from '@/services/remoteConfig';

// Initialize
await remoteConfig.initialize();

// Get values
const showAd = remoteConfig.getBoolean('mainScreenShowBottomBanner');
const adId = remoteConfig.getString('mainScreenBannerId');

// Get typed config objects
const appOpenConfig = remoteConfig.getAppOpenAdConfig();
```

### 7. **inAppReview** (`inAppReview.ts`)
Smart in-app review prompt management.

**Usage:**
```typescript
import inAppReviewService from '@/services/inAppReview';

// Check if should show review
const shouldShow = await inAppReviewService.shouldShowReview();

// Increment engagement counter
await inAppReviewService.incrementEventCount();

// Request review
await inAppReviewService.requestReview();
```

### 8. **inAppUpdates** (`inAppUpdates.ts`)
Google Play In-App Updates for Android.

**Usage:**
```typescript
import inAppUpdatesService from '@/services/inAppUpdates';

// Check for updates
await inAppUpdatesService.checkForUpdate();
```

## Best Practices

### 1. Service Initialization
Initialize all services at app startup in `app/_layout.tsx`:

```typescript
useEffect(() => {
  (async () => {
    // Critical services (blocking)
    await admobService.initialize();

    // Non-critical services (background)
    Promise.allSettled([
      analytics.initialize(),
      crashlytics.initialize(),
      remoteConfig.initialize(),
    ]);
  })();
}, []);
```

### 2. Error Handling
Always wrap service calls in try-catch:

```typescript
try {
  await analytics.logEvent('note_created', { id: noteId });
} catch (error) {
  console.error('Analytics logging failed:', error);
  // Don't block user flow
}
```

### 3. Singleton Pattern
Always use the exported instance, never `new ServiceName()`:

```typescript
// ✅ Good
import analytics from '@/services/analytics';
analytics.logEvent(...);

// ❌ Bad
import { Analytics } from '@/services/analytics';
new Analytics(); // Error: constructor is private
```

### 4. Type Safety
Use TypeScript types for all service methods:

```typescript
interface NoteCreatedEvent {
  category: string;
  hasImage: boolean;
  isLocked: boolean;
}

analytics.logEvent('note_created', data as NoteCreatedEvent);
```

### 5. Service Dependencies
If a service depends on another, initialize dependencies first:

```typescript
// storageService has no dependencies
await storageService.initialize();

// remoteConfig depends on Firebase
await analytics.initialize(); // Firebase init
await remoteConfig.initialize();
```

## Adding New Services

To add a new service:

1. **Create the service file:**
```typescript
// services/myService.ts
class MyService {
  private static instance: MyService;

  private constructor() {}

  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService();
    }
    return MyService.instance;
  }

  async initialize(): Promise<void> {
    console.log('[MyService] Initializing...');
  }

  async doSomething(): Promise<void> {
    // Implementation
  }
}

export const myService = MyService.getInstance();
export default myService;
```

2. **Update this README** with usage examples

3. **Initialize in `app/_layout.tsx`**

4. **Add tests** (if applicable)

## Service Communication

Services can depend on each other:

```typescript
// In analytics.ts
import crashlytics from './crashlytics';

class Analytics {
  async logEvent(name: string, data: any) {
    try {
      // Log event
    } catch (error) {
      // Report error to Crashlytics
      crashlytics.logError(error, 'Analytics event failed');
    }
  }
}
```

## Testing Services

Services should be mockable for testing:

```typescript
// __mocks__/services/analytics.ts
export default {
  initialize: jest.fn(),
  logEvent: jest.fn(),
  logScreenView: jest.fn(),
};
```

## Performance Considerations

- **Lazy initialization:** Services only initialize when first used
- **Background init:** Non-critical services initialize in background
- **Caching:** Services cache frequently accessed data (e.g., Remote Config)
- **Error resilience:** Service failures don't crash the app
