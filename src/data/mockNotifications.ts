import { NotificationItem } from '@/types';

/**
 * Seed notifications shown the first time a user opens the Notifications
 * screen (before any local read-state has been recorded). A real backend
 * will replace this with a `/v1/notifications` feed plus FCM push — see
 * PROGRESS.md Phase 1/3.
 */
export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    kind: 'alert',
    title: 'Heavy rain expected tonight',
    body: 'Local weather service issued an advisory for your area. Check Updates for details.',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-2',
    kind: 'family',
    title: 'Sarah checked in as safe',
    body: 'Sarah Carter marked herself safe a few minutes ago.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: 'notif-3',
    kind: 'readiness',
    title: 'Go-bag reminder',
    body: "You haven't marked your go-bag as packed yet. Takes about 10 minutes.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];
