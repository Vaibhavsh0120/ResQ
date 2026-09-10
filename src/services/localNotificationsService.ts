import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Local notifications: on-device only, no push server ────────────────────
// This is deliberately scoped to *local* notifications — scheduled entirely
// on-device via expo-notifications' scheduleNotificationAsync, with no
// backend involved. It is a different thing from notificationsService.ts,
// which is an in-app *feed* of past updates (read/unread list, no OS-level
// alert). Remote push (Expo push tokens, FCM/APNs) is still not built and
// stays out of scope here — see PROGRESS.md Phase 1/3.
//
// Local notifications work in Expo Go on both platforms (unlike push, which
// Expo Go on Android dropped support for as of SDK 53), so this doesn't
// require a dev-client rebuild to try.

// Foreground behavior: still show an alert even while the app is open,
// matching how a real safety-relevant reminder should behave (a check-in
// reminder that only fires when the app is backgrounded would be easy to
// miss if the person happens to have ResQ open at the time).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CHECKIN_REMINDER_ID_KEY = '@resq_checkin_reminder_id';
const CHECKIN_REMINDER_ENABLED_KEY = '@resq_checkin_reminder_enabled';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermissionState;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status as NotificationPermissionState;
}

/**
 * Whether the person has turned the family check-in reminder on, independent
 * of whether OS permission is currently granted — so the toggle can reflect
 * "the user wants this" even if permission was later revoked in system
 * settings, and re-request rather than silently no-op.
 */
export async function isCheckInReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(CHECKIN_REMINDER_ENABLED_KEY)) === 'true';
}

/**
 * Schedules a one-off local reminder ~24 hours from now to check in with
 * family. Deliberately a single one-shot notification, not a repeating
 * daily one — family.tsx's "Next check-in" card shows one specific
 * upcoming time, and re-scheduling a fresh 24h-out reminder each time the
 * person toggles this on keeps the notification honestly tied to "a day
 * from when you turned this on" rather than implying a fixed daily alarm
 * time (e.g. always 9:00 AM) that nothing in this app actually configures.
 * Cancels any previously scheduled reminder first so toggling on twice
 * doesn't stack duplicate notifications.
 */
export async function scheduleCheckInReminder(): Promise<boolean> {
  let permission = await getNotificationPermission();
  if (permission === 'undetermined') {
    permission = await requestNotificationPermission();
  }
  if (permission !== 'granted') return false;

  await cancelCheckInReminder();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Check in with your family',
      body: "It's been a day — let your circle know you're safe.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 24 * 60 * 60,
      repeats: false,
    },
  });

  await AsyncStorage.setItem(CHECKIN_REMINDER_ID_KEY, identifier);
  await AsyncStorage.setItem(CHECKIN_REMINDER_ENABLED_KEY, 'true');
  return true;
}

export async function cancelCheckInReminder(): Promise<void> {
  const identifier = await AsyncStorage.getItem(CHECKIN_REMINDER_ID_KEY);
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {
      // Already fired or already canceled — nothing to clean up.
    });
    await AsyncStorage.removeItem(CHECKIN_REMINDER_ID_KEY);
  }
  await AsyncStorage.setItem(CHECKIN_REMINDER_ENABLED_KEY, 'false');
}
