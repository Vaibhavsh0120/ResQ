import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config/env';
import { apiRequest } from './apiClient';
import { mockNotifications } from '@/data/mockNotifications';
import { NotificationItem } from '@/types';

// ── Notifications: local-only until a push backend exists ─────────────────
// There is no push server yet (see AGENT.md: expo-notifications
// + FCM are both still open). Until then, this is the real destination for
// the Header bell — backed by on-device storage so read state survives
// restarts, seeded once from mockNotifications the first time it's opened.
// Swapping to a real feed later only means changing the two functions below.

const STORAGE_KEY = '@resq_notifications';

async function readLocal(): Promise<NotificationItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as NotificationItem[];
    } catch {
      // Corrupted storage — fall through to reseeding.
    }
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockNotifications));
  return mockNotifications;
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  if (config.useMockData) {
    return readLocal();
  }
  return apiRequest<NotificationItem[]>('/v1/notifications');
}

export async function markNotificationRead(id: string): Promise<NotificationItem[]> {
  if (config.useMockData) {
    const current = await readLocal();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
  return apiRequest<NotificationItem[]>(`/v1/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<NotificationItem[]> {
  if (config.useMockData) {
    const current = await readLocal();
    const updated = current.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
  return apiRequest<NotificationItem[]>('/v1/notifications/read-all', { method: 'POST' });
}
