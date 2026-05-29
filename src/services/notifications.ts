import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ── How notifications appear when the app is in the foreground ────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Permission ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Booking reminders ─────────────────────────────────────────────────────────

/**
 * Schedules two local notifications for a booking:
 *  - 24 h before: "Your session is tomorrow"
 *  -  1 h before: "Your session starts in 1 hour"
 *
 * Safe to call even if the time has already passed — it skips past triggers.
 */
export async function scheduleBookingReminders({
  bookingId,
  venueName,
  activityName,
  bookingTime,
}: {
  bookingId: string;
  venueName: string;
  activityName: string;
  bookingTime: Date;
}): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const now = Date.now();
  const sessionMs = bookingTime.getTime();

  const reminders = [
    {
      id: `booking-${bookingId}-24h`,
      fireAt: new Date(sessionMs - 24 * 60 * 60 * 1000),
      title: 'Session tomorrow 🌊',
      body: `${activityName} at ${venueName} is tomorrow. All set?`,
    },
    {
      id: `booking-${bookingId}-1h`,
      fireAt: new Date(sessionMs - 60 * 60 * 1000),
      title: 'Session in 1 hour',
      body: `${activityName} at ${venueName} starts soon. See you there!`,
    },
  ];

  for (const r of reminders) {
    if (r.fireAt.getTime() <= now) continue; // already past — skip

    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: {
        title: r.title,
        body: r.body,
        data: { bookingId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: r.fireAt,
      },
    });
  }
}

/**
 * Cancels any pending reminders for a booking (e.g. when it is cancelled).
 */
export async function cancelBookingReminders(bookingId: string): Promise<void> {
  await Promise.allSettled([
    Notifications.cancelScheduledNotificationAsync(`booking-${bookingId}-24h`),
    Notifications.cancelScheduledNotificationAsync(`booking-${bookingId}-1h`),
  ]);
}
