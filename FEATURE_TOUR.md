# Feature Tour System

This document explains the feature tour/walkthrough system implemented in NotesAI.

## Overview

The feature tour system provides interactive tooltips and highlights to guide users through key features on their first launch. It includes:

1. **Home Screen Tour**: Highlights the FAB (Floating Action Button) to create notes
2. **Note Editor Tour**: Walks through toolbar features (scanner, OCR, camera, audio, checklist, backgrounds)

## Architecture

### Components

- **`FeatureTour`** (`components/FeatureTour.tsx`)
  - Main component that renders spotlight overlay and tooltips
  - Features:
    - Semi-transparent dark overlay
    - Animated spotlight highlighting target elements
    - Tooltip bubbles with descriptions
    - Progress indicators
    - Next/Skip/Got it buttons

- **`FeatureTourContext`** (`lib/FeatureTourContext.tsx`)
  - Manages tour state and persistence using AsyncStorage
  - Tracks completion status for:
    - Onboarding
    - Home tour
    - Editor tour
  - Provides hooks to check if tours should be shown

### Tour Steps Configuration

Tour steps are defined in separate files:

- **`components/tours/homeTourSteps.ts`**: Home screen tour configuration
- **`components/tours/editorTourSteps.ts`**: Note editor tour configuration

Each tour step includes:
```typescript
interface TourStep {
  id: string;                    // Unique identifier
  title: string;                 // Tooltip title
  description: string;           // Tooltip description
  targetPosition: {              // Element position to highlight
    x: number;
    y: number;
    width: number;
    height: number;
  };
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  shape?: 'circle' | 'rectangle'; // Spotlight shape
}
```

## User Flow

### 1. First Launch
```
Language Selection → Permissions → Onboarding (4 slides) → Home Screen
```

### 2. After Onboarding Completes
- `setOnboardingCompleted()` is called
- User lands on home screen
- Home tour automatically triggers after 500ms delay

### 3. Home Tour
- Highlights the FAB button
- Shows tooltip: "Tap this button to create a new note"
- User can tap "Got it!" or "Skip Tour"
- On completion, `setHomeTourCompleted()` is called

### 4. First Note Creation
- When user taps FAB and creates their first note
- Editor tour automatically triggers after 800ms delay
- Only shows if home tour is completed

### 5. Editor Tour
- 6-step tour highlighting toolbar features:
  1. Document Scanner
  2. Text Extraction (OCR)
  3. Camera & Images
  4. Voice Recording
  5. Interactive Checklists
  6. Beautiful Backgrounds
- User navigates with "Next" button or skips
- On completion, `setEditorTourCompleted()` is called

## Integration Points

### App Root Layout (`app/_layout.tsx`)
```tsx
<FeatureTourProvider>
  <NotesProvider>
    {/* ... app content */}
  </NotesProvider>
</FeatureTourProvider>
```

### Onboarding Screen (`app/onboarding.tsx`)
```tsx
const { setOnboardingCompleted } = useFeatureTour();

const handleComplete = async () => {
  await markFirstLaunchComplete();
  await setOnboardingCompleted();  // ✅ Triggers tour flow
  router.replace('/(drawer)');
};
```

### Home Screen (`app/(drawer)/index.tsx`)
```tsx
const { shouldShowHomeTour, setHomeTourCompleted } = useFeatureTour();

useEffect(() => {
  if (!loading && shouldShowHomeTour()) {
    setTimeout(() => setShowHomeTour(true), 500);
  }
}, [loading, shouldShowHomeTour]);
```

### Note Editor (`app/note/[id].tsx`)
```tsx
const { shouldShowEditorTour, setEditorTourCompleted } = useFeatureTour();

useEffect(() => {
  if (!loading && editorReady && isNewNote && shouldShowEditorTour()) {
    setTimeout(() => setShowEditorTour(true), 800);
  }
}, [loading, editorReady, isNewNote, shouldShowEditorTour]);
```

## Customization

### Adding New Tour Steps

1. **Define the step** in the appropriate tour file:
```typescript
// components/tours/editorTourSteps.ts
{
  id: 'new_feature',
  title: 'New Feature',
  description: 'Description of the new feature',
  targetPosition: {
    x: 100,
    y: 200,
    width: 40,
    height: 40,
  },
  tooltipPosition: 'top',
  shape: 'rectangle',
}
```

2. **Position calculation**: Use screen dimensions and element measurements to calculate accurate positions.

### Creating a New Tour

1. **Add tour state to FeatureTourContext**:
```typescript
const [hasCompletedNewTour, setHasCompletedNewTour] = useState(false);
```

2. **Add storage key**:
```typescript
const STORAGE_KEYS = {
  // ...
  NEW_TOUR_COMPLETED: '@notesai_new_tour_completed',
};
```

3. **Add completion function**:
```typescript
const setNewTourCompleted = useCallback(async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.NEW_TOUR_COMPLETED, 'true');
  setHasCompletedNewTour(true);
}, []);
```

4. **Use in your screen**:
```tsx
const { shouldShowNewTour, setNewTourCompleted } = useFeatureTour();
```

## Storage Keys

All tour completion states are persisted in AsyncStorage:
- `@notesai_onboarding_completed`
- `@notesai_home_tour_completed`
- `@notesai_editor_tour_completed`

## Resetting Tours (for testing)

Use the `resetAllTours()` function from FeatureTourContext:
```tsx
const { resetAllTours } = useFeatureTour();

// In a settings screen or debug menu:
<Button onPress={resetAllTours} title="Reset Tours" />
```

## Design Considerations

### Timing
- **Home tour delay**: 500ms after home screen loads
- **Editor tour delay**: 800ms after editor is ready
- Delays ensure UI is fully rendered before showing tours

### Positioning
- Tour positions are calculated dynamically based on screen dimensions
- Uses actual element measurements (FAB size, toolbar positions)
- Tooltips automatically adjust to stay within screen bounds

### UX Best Practices
- ✅ Only show tours on first launch
- ✅ Allow users to skip at any time
- ✅ Show progress indicators
- ✅ Limit to 1-6 steps per tour (keeps it concise)
- ✅ Use clear, actionable language
- ✅ Highlight the most important features only

## Technical Notes

### React Native Considerations
- Uses `Modal` for overlay to ensure it renders above all content
- `statusBarTranslucent` ensures full-screen coverage
- Platform-specific safe area adjustments for iOS/Android

### Performance
- Tour steps are memoized with `useMemo`
- Animations use `useNativeDriver` for 60fps performance
- Tour state loading is non-blocking (returns null while loading)

### Accessibility
- Clear contrast between overlay and spotlight
- Large tap targets for buttons
- Readable font sizes and line heights
