import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/config/env';
import { apiRequest } from './apiClient';
import { SosEvent } from '@/types';

// ── SOS history: local-only until a backend exists ────────────────────────
// There is no backend yet (see PROGRESS.md Phase 1/3), so an SOS activation
// itself is entirely on-device: it opens tel:112 and an SMS share sheet to
// whichever family members have a phone number on file (see app/sos.tsx).
// This service only logs that an activation happened, so Profile can show a
// real history instead of nothing. Swapping to a real backend later means
// also POSTing the event server-side (e.g. so family/responders could be
// alerted server-side too) — this local log can stay as an offline-first
// cache even after that exists.

const STORAGE_KEY = '@resq_sos_history';

async function readLocal(): Promise<SosEvent[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SosEvent[];
  } catch {
    return [];
  }
}

export async function fetchSosHistory(): Promise<SosEvent[]> {
  if (config.useMockData) {
    const events = await readLocal();
    // Most recent first.
    return [...events].sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
  }
  return apiRequest<SosEvent[]>('/v1/sos');
}

export async function logSosEvent(input: Omit<SosEvent, 'id' | 'triggeredAt'>): Promise<SosEvent> {
  const event: SosEvent = {
    ...input,
    id: `sos-${Date.now()}`,
    triggeredAt: new Date().toISOString(),
  };

  if (config.useMockData) {
    const current = await readLocal();
    const updated = [...current, event];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return event;
  }
  return apiRequest<SosEvent>('/v1/sos', { method: 'POST', body: event });
}
