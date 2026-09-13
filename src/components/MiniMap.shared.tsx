import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius, ThemeColors } from '@/theme/colors';
import { MapPin } from '@/components/icons';

// Shared between MiniMap.tsx (native) and MiniMap.web.tsx (web) — Metro/
// Expo Router picks whichever of those two matches the current platform
// automatically (the `.web.tsx` suffix is a standard RN platform
// extension, resolved at bundle time, not a runtime branch), so this file
// holds everything both variants render identically: the marker type,
// coordinate validation, the "no real map" fallback illustration, and the
// pin badge's color logic. Keeping one copy avoids the two renderers'
// visuals drifting apart.

export type MiniMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  kind?: 'primary' | 'danger' | 'user';
};

/** OpenFreeMap's public instance: no API key, no registration, and no
 * request/view limits by the operator's own stated policy — re-verified
 * live (2026-09-10) against openfreemap.org and the style URL itself
 * before wiring this in. See AGENT.md for the full SDK decision.
 * Used unchanged by both the native MapLibre view and the web MapLibre GL
 * JS instance. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export function filterValidMarkers(markers: MiniMapMarker[]): MiniMapMarker[] {
  return markers.filter(
    (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !Number.isNaN(m.latitude) && !Number.isNaN(m.longitude)
  );
}

/** Resolves a marker's badge colors from the active theme — the single
 * place both renderers look up "what does a danger/user/primary pin look
 * like right now." */
export function pinColors(kind: MiniMapMarker['kind'], colors: ThemeColors) {
  const background = kind === 'danger' ? colors.danger : kind === 'user' ? colors.brandDeep : colors.brand;
  const foreground = kind === 'danger' ? colors.onDanger : colors.onBrand;
  return { background, foreground };
}

export function MapPinBadge({ kind, colors }: { kind: NonNullable<MiniMapMarker['kind']>; colors: ThemeColors }) {
  const { background, foreground } = pinColors(kind, colors);
  return (
    <View style={[sharedMapStyles.pin, { backgroundColor: background, borderColor: colors.onBrandBorder }]}>
      <MapPin size={14} color={foreground} />
    </View>
  );
}

/**
 * Stylized static illustration — used on native whenever there are no
 * valid coordinates to show (e.g. a family member with no location on
 * file yet), and as web's own fallback for that same empty-marker case.
 * Real interactive maps (native MapLibre view, web MapLibre GL JS) render
 * separately in each platform's own file; this only covers "there's
 * nothing to actually put on a map."
 */
export function StaticMapFallback({
  markers,
  height,
  accessibilityLabel,
}: {
  markers: MiniMapMarker[];
  height: number;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  // Fixed, deterministic positions for up to 3 pins — matches the exact
  // layout safe.tsx's illustration already used. Beyond 3 markers this
  // still renders (positions repeat), which is an acceptable simplicity
  // tradeoff for a decorative fallback that only ever needs to convey
  // "there are places near you," not an accurate map.
  const positions = [
    { left: '26%', top: '37%' } as const,
    { right: '25%', top: '22%' } as const,
    { right: '39%', bottom: '19%' } as const,
  ];

  return (
    <View
      style={[sharedMapStyles.container, sharedMapStyles.fallback, { height, borderColor: colors.line, backgroundColor: colors.brandSoft }]}
      accessible
      accessibilityLabel={accessibilityLabel ?? 'Map illustration — open in Maps for an interactive view'}
    >
      {markers.slice(0, 3).map((marker, index) => (
        <View
          key={marker.id}
          style={[sharedMapStyles.fallbackPin, positions[index % positions.length], { backgroundColor: colors.brand, borderColor: colors.onBrandBorder }]}
        >
          <MapPin size={16} color={colors.onBrand} />
        </View>
      ))}
      {markers.length === 0 && (
        <View style={[sharedMapStyles.fallbackPin, positions[0], { backgroundColor: colors.brand, borderColor: colors.onBrandBorder }]}>
          <MapPin size={16} color={colors.onBrand} />
        </View>
      )}
    </View>
  );
}

export const sharedMapStyles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackPin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
  },
  attribution: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  attributionText: {
    fontSize: 8,
    fontWeight: '600',
  },
});

export function MapAttribution({ isDark }: { isDark: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[sharedMapStyles.attribution, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)' }]}>
      <Text style={[sharedMapStyles.attributionText, { color: colors.inkMuted }]}>© OpenStreetMap contributors</Text>
    </View>
  );
}
