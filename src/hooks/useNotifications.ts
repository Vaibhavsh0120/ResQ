import { useCallback } from 'react';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notificationsService';
import { useAsync } from './useAsync';

export function useNotifications() {
  const { data, loading, error, refresh } = useAsync(fetchNotifications, []);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      refresh();
    },
    [refresh]
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    refresh();
  }, [refresh]);

  const unreadCount = (data ?? []).filter((n) => !n.read).length;

  return { notifications: data, loading, error, refresh, markRead, markAllRead, unreadCount };
}
