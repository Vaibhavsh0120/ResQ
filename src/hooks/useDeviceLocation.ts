import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type DeviceLocationState = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // meters, when the platform reports it
  area: string | null; // reverse-geocoded "City, State" summary, when available
  loading: boolean;
  permissionDenied: boolean;
  error: string | null;
  lastUpdatedAt: number | null; // Date.now() of the last successful fix
};

const INITIAL_STATE: DeviceLocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  area: null,
  loading: true,
  permissionDenied: false,
  error: null,
  lastUpdatedAt: null,
};

/**
 * Live device coordinates, wrapping expo-location — this is PROGRESS.md
 * Phase 1's `useDeviceLocation()` item (§3/§7). Onboarding's
 * `app/onboarding/location.tsx` already uses the same
 * requestForegroundPermissionsAsync → getCurrentPositionAsync →
 * reverseGeocodeAsync sequence for a one-time home-address snapshot; this
 * hook is the reusable, ongoing version other screens can call for "where
 * is the user right now."
 *
 * Deliberately request-based (`getCurrentPositionAsync`), not
 * `watchPositionAsync` — nothing in the app currently needs a continuously
 * live-updating position (SOS/Safe places/Report all want "where am I at
 * the moment I opened this screen," not a moving dot), and a watcher would
 * mean managing a subscription lifecycle across screens with no real
 * consumer yet. `refresh()` is exposed so a screen can re-request a fresh
 * fix on demand (e.g. before firing SOS) without needing to unmount and
 * remount this hook. If a real live-tracking feature needs
 * watchPositionAsync later, that's a distinct hook built on top of this
 * one's permission handling, not a change to this hook's contract.
 *
 * Permission is asked for automatically on mount (screens that use this
 * hook are the ones that already need location to do their job — Safe
 * places, Report, SOS — so there's no separate "ask later" screen to wire
 * this into). `permissionDenied` lets a screen fall back gracefully (e.g.
 * `useCurrentArea()` below falls back to the profile's static home area)
 * rather than showing a dead loading state forever.
 */
export function useDeviceLocation(): DeviceLocationState & { refresh: () => void } {
  const [state, setState] = useState<DeviceLocationState>(INITIAL_STATE);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mountedRef.current) {
          setState({ ...INITIAL_STATE, loading: false, permissionDenied: true });
        }
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude, accuracy } = position.coords;

      // Reverse geocode is best-effort — a coordinate pair is still useful
      // on its own (e.g. for a maps deep link) even if this fails, so a
      // geocoding error doesn't wipe out the coordinates we already have.
      let area: string | null = null;
      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse && reverse.length > 0) {
          const item = reverse[0];
          area = [item.city, item.region].filter(Boolean).join(', ') || item.district || null;
        }
      } catch {
        // Leave area null — latitude/longitude below are still real.
      }

      if (mountedRef.current) {
        setState({
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          area,
          loading: false,
          permissionDenied: false,
          error: null,
          lastUpdatedAt: Date.now(),
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          ...INITIAL_STATE,
          loading: false,
          error: err instanceof Error ? err.message : 'Could not determine your location.',
        });
      }
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { ...state, refresh: fetchLocation };
}
