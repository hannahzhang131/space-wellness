import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Reminder } from '@/lib/model';

export function configureNotifications(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Replaces any scheduled reminder. Returns false when notifications are not allowed. */
export async function applyReminder(reminder: Reminder | null): Promise<boolean> {
  if (Platform.OS === 'web') return reminder === null;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!reminder) return true;
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!status.granted) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Progress photo day',
      body: 'Front, side and back. Same spot, same light.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: reminder.weekday,
      hour: reminder.hour,
      minute: reminder.minute,
    },
  });
  return true;
}
