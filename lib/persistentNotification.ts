import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function setupPersistentNotification() {
  if (Platform.OS !== 'android') {
    return; // Only for Android
  }

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permissions not granted');
    return;
  }

  // Set notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('persistent-notes', {
      name: 'Quick Notes',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableLights: false,
      enableVibrate: false,
      showBadge: false,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  // Define notification categories with actions
  await Notifications.setNotificationCategoryAsync('quick-note-actions', [
    {
      identifier: 'text_note',
      buttonTitle: '📝 Note',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'photo_note',
      buttonTitle: '📷 Photo',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'audio_note',
      buttonTitle: '🎤 Audio',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);

  // Create persistent notification with actions
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'NotesAI',
      body: 'Quick note actions',
      sticky: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
      data: { action: 'create_note' },
      categoryIdentifier: 'quick-note-actions',
    },
    trigger: null, // Show immediately
  });
}

export async function removePersistentNotification() {
  await Notifications.dismissAllNotificationsAsync();
}

export function handleNotificationResponse(response: Notifications.NotificationResponse) {
  const actionIdentifier = response.actionIdentifier;

  // Handle action button presses
  if (actionIdentifier === 'text_note') {
    return { action: 'create_text_note' };
  } else if (actionIdentifier === 'photo_note') {
    return { action: 'create_photo_note' };
  } else if (actionIdentifier === 'audio_note') {
    return { action: 'create_audio_note' };
  }

  // Handle notification tap (not action button)
  const action = response.notification.request.content.data?.action;
  if (action === 'create_note') {
    return { action: 'create_note' };
  }

  return null;
}
