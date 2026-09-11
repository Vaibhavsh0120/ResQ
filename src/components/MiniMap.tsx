import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius, ThemeColors } from '@/theme/colors';
import { MapPin } from '@/components/icons';

// MapLibre React Native has no web renderer at all (confirmed against its
// own docs — the web story needs a completely separate library,
// react-map-gl + maplibre-gl-js, which PROGRESS.md's maps plan explicitly
// scoped out for this pass since the user said web is a nice-to-have
// only). Importing it unconditionally would break `expo export --platform
// web`, which this project's CI/verification relies on — so the native
// module is required lazily, only on native platforms, and web renders
// the same static-pin fallback style safe.tsx/place-detail.tsx already
// used before this component existed.
//
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapLibre = Platform.OS !== 'web' ? require('@maplibre/maplibre-react-native') : null;

// OpenFreeMap's public instance: no API key, no registration, and no
// request/view limits by the operator's own stated policy — re-verified
// live (2026-09-10) against openfreemap.org and the style URL itself
// before wiring this in. See PROGRESS.md §3.1 for the full SDK decision.
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export type MiniMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  kind?: 'primary' | 'danger' | 'user';
};

type Props = {
  markers: MiniMapMarker[];
  /** Center/zoom when no markers are focused on a single point. Defaults to fitting all markers. */
  zoom?: number;
  height?: number;
  /** Accessible label read by screen readers in place of the interactive map (native) or the fallback illustration (web). */
  accessibilityLabel?: string;
};

/**
 * Shared map surface for safe.tsx, place-detail.tsx, and (eventually)
 * family-member.tsx — see PROGRESS.md §3.1's implementation sequencing,
 * step 2. Native platforms render a real MapLibre view over OpenFreeMap
 * vector tiles; web renders the same stylized static-pin illustration
 * that stood in for a map everywhere before this component existed, so
 * the visual language stays consistent rather than swapping to a
 * completely different look only on web.
 */
export function MiniMap({ markers, zoom = 13, height = 190, accessibilityLabel }: Props) {
  const { colors, isDark } = useAppTheme();

  const validMarkers = markers.filter(
    (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !Number.isNaN(m.latitude) && !Number.isNaN(m.longitude)
  );

  if (Platform.OS === 'web' || !MapLibre || validMarkers.length === 0) {
    return (
      <StaticMapFallback markers={validMarkers} height={height} accessibilityLabel={accessibilityLabel} />
    );
  }

  const { Map, Camera, ViewAnnotation } = MapLibre;

  // Center on the single marker if there's just one (e.g. place-detail),
  // otherwise average all marker positions as a simple, good-enough
  // center for the small marker counts this app actually has (2-3 safe
  // places) — a real bounds-fit (fitBounds) is more correct for larger
  // sets but isn't needed at this scale and adds camera-ref plumbing this
  // component doesn't otherwise need.
  const centerLng = validMarkers.reduce((sum, m) => sum + m.longitude, 0) / validMarkers.length;
  const centerLat = validMarkers.reduce((sum, m) => sum + m.latitude, 0) / validMarkers.length;

  return (
    <View
      style={[styles.container, { height, borderColor: colors.line }]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `Map showing ${validMarkers.length} location${validMarkers.length === 1 ? '' : 's'}`}
    >
      <Map mapStyle={MAP_STYLE_URL} style={styles.flex} logo={false} attribution={false}>
        <Camera initialViewState={{ center: [centerLng, centerLat], zoom }} />
        {validMarkers.map((marker) => (
          <ViewAnnotation key={marker.id} id={marker.id} lngLat={[marker.longitude, marker.latitude]}>
            <MapPinBadge kind={marker.kind ?? 'primary'} colors={colors} />
          </ViewAnnotation>
        ))}
      </Map>
      {/* OpenFreeMap's own guidance doesn't require a visible attribution
          badge for the public instance, but OpenStreetMap's own data
          license (ODbL) does require crediting OSM contributors wherever
          the map is shown — MapLibre's built-in attributionEnabled control
          would satisfy this on its own, but it renders as a small native
          overlay that's easy to lose against this app's rounded map card;
          this explicit label guarantees it's always legible regardless of
          map style or theme. */}
      <View style={[styles.attribution, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)' }]}>
        <Text style={[styles.attributionText, { color: colors.inkMuted }]}>© OpenStreetMap contributors</Text>
      </View>
    </View>
  );
}

function MapPinBadge({ kind, colors }: { kind: 'primary' | 'danger' | 'user'; colors: ThemeColors }) {
  const background = kind === 'danger' ? colors.danger : kind === 'user' ? colors.brandDeep : colors.brand;
  const foreground = kind === 'danger' ? colors.onDanger : colors.onBrand;
  return (
    <View style={[styles.pin, { backgroundColor: background, borderColor: colors.onBrandBorder }]}>
      <MapPin size={14} color={foreground} />
    </View>
  );
}

/**
 * Web fallback (and the empty/no-coordinates fallback on native, e.g. a
 * family member with no location on file yet) — the same stylized
 * illustration safe.tsx/place-detail.tsx used before this component
 * existed, generalized to any marker count so both screens can share it
 * instead of keeping two near-duplicate hardcoded layouts.
 */
function StaticMapFallback({ markers, height, accessibilityLabel }: { markers: MiniMapMarker[]; height: number; accessibilityLabel?: string }) {
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
      style={[styles.container, styles.fallback, { height, borderColor: colors.line, backgroundColor: colors.brandSoft }]}
      accessible
      accessibilityLabel={accessibilityLabel ?? 'Map illustration — open in Maps for an interactive view'}
    >
      {markers.slice(0, 3).map((marker, index) => (
        <View
          key={marker.id}
          style={[styles.fallbackPin, positions[index % positions.length], { backgroundColor: colors.brand, borderColor: colors.onBrandBorder }]}
        >
          <MapPin size={16} color={colors.onBrand} />
        </View>
      ))}
      {markers.length === 0 && (
        <View style={[styles.fallbackPin, positions[0], { backgroundColor: colors.brand, borderColor: colors.onBrandBorder }]}>
          <MapPin size={16} color={colors.onBrand} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
