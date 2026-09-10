import { useCallback, useEffect, useState } from 'react';
import {
  cancelCheckInReminder,
  isCheckInReminderEnabled,
  scheduleCheckInReminder,
} from '@/services/localNotificationsService';

/**
 * Backs the "Remind me" toggle on family.tsx's check-in card. `enabled`
 * reflects what's actually scheduled on-device (persisted via
 * localNotificationsService), not just in-memory UI state, so it's correct
 * again after an app restart.
 */
export function useCheckInReminder() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    isCheckInReminderEnabled().then((value) => {
      setEnabled(value);
      setLoading(false);
    });
  }, []);

  const toggle = useCallback(async () => {
    if (enabled) {
      await cancelCheckInReminder();
      setEnabled(false);
      setPermissionDenied(false);
      return;
    }
    const scheduled = await scheduleCheckInReminder();
    if (scheduled) {
      setEnabled(true);
      setPermissionDenied(false);
    } else {
      setPermissionDenied(true);
    }
  }, [enabled]);

  return { enabled, loading, permissionDenied, toggle };
}
