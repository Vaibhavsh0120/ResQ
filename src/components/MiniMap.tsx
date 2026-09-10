import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius, ThemeColors } from '@/theme/colors';
import { MapPin } from '@/components/icons';

// MapLibre React Native (the library imported below on native) has no web
// renderer at all — confirmed against its own docs. Importing it
// unconditionally would break `expo export --platform web`, which this
// project's CI/verification relies on — so it's required lazily, only on
// native platforms.
//
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapLibre = Platform.OS !== 'web' ? require('@maplibre/maplibre-react-native') : null;

// Web's real map renderer: maplibre-gl (the WebGL JS library) + react-map-gl
// (its React wrapper — MapLibre's own recommended web integration, actively
// maintained, same OpenFreeMap style URL as native). Required lazily and
// only on web, mirroring the native require above, so this never loads —
// or even gets resolved by Metro — on iOS/Android. See PROGRESS.md's
// "Web maps, investigated" note for the fuller research trail.
//
// `maplibre-gl` v6 ships ESM-only (no CJS `require` build, `"type":
// "module"` in its package.json) and its worker script is instantiated via
// a URL it derives from `import.meta.url` at runtime, with no bundler-side
// worker registration needed. Metro's default web config
// (`unstable_enablePackageExports: true`, confirmed against this project's
// installed `metro-config`) understands the package.json `exports` map's
// `import` condition, so `import` of an ESM-only package resolves
// correctly here — no `maplibregl.workerUrl` / `setWorkerUrl` wiring or
// worker-loader config was needed, which is the simpler of the two setups
// MapLibre's own migration notes describe for consumers. This was verified
// by an actual `expo export --platform web` in this project (see
// PROGRESS.md), not assumed from a generic bundler guide — flagging it
// here since it's the one non-obvious call in this component.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReactMapGL = Platform.OS === 'web' ? require('react-map-gl/maplibre') : null;
if (Platform.OS === 'web') {
  // Metro's `isCSSEnabled` (on by default for this Expo SDK's web output,
  // confirmed against `@expo/metro-config`) handles a plain CSS import
  // like this natively — no CSS-loader config or webpack/Vite assumption
  // needed. This supplies MapLibre's own marker/popup/control positioning
  // styles; without it, markers render but aren't positioned correctly.
  require('maplibre-gl/dist/maplibre-gl.css');
}

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
  const validMarkers = markers.filter(
    (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && !Number.isNaN(m.latitude) && !Number.isNaN(m.longitude)
  );

  if (validMarkers.length === 0) {
    return (
      <StaticMapFallback markers={validMarkers} height={height} accessibilityLabel={accessibilityLabel} />
    );
  }

  if (Platform.OS === 'web') {
    if (!ReactMapGL) {
      return (
        <StaticMapFallback markers={validMarkers} height={height} accessibilityLabel={accessibilityLabel} />
      );
    }
    return (
      <WebMap markers={validMarkers} zoom={zoom} height={height} accessibilityLabel={accessibilityLabel} />
    );
  }

  if (!MapLibre) {
    return (
      <StaticMapFallback markers={validMarkers} height={height} accessibilityLabel={accessibilityLabel} />
    );
  }

  return <NativeMap markers={validMarkers} zoom={zoom} height={height} accessibilityLabel={accessibilityLabel} />;
}

type MapSurfaceProps = {
  markers: MiniMapMarker[];
  zoom: number;
  height: number;
  accessibilityLabel?: string;
};

function NativeMap({ markers: validMarkers, zoom, height, accessibilityLabel }: MapSurfaceProps) {
  const { colors, isDark } = useAppTheme();
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

function WebMap({ markers: validMarkers, zoom, height, accessibilityLabel }: MapSurfaceProps) {
  const { colors, isDark } = useAppTheme();
  const { Map, Marker } = ReactMapGL;

  // Same simple-average centering as the native branch — see NativeMap's
  // comment. react-map-gl's viewState shape takes longitude/latitude
  // directly (not a [lng, lat] center tuple like maplibre-react-native),
  // so this is duplicated rather than shared to avoid a leaky abstraction
  // over two genuinely different camera APIs.
  const centerLng = validMarkers.reduce((sum, m) => sum + m.longitude, 0) / validMarkers.length;
  const centerLat = validMarkers.reduce((sum, m) => sum + m.latitude, 0) / validMarkers.length;

  return (
    <View
      style={[styles.container, { height, borderColor: colors.line }]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `Map showing ${validMarkers.length} location${validMarkers.length === 1 ? '' : 's'}`}
    >
      <Map
        mapStyle={MAP_STYLE_URL}
        initialViewState={{ longitude: centerLng, latitude: centerLat, zoom }}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {validMarkers.map((marker) => (
          <Marker key={marker.id} longitude={marker.longitude} latitude={marker.latitude} anchor="center">
            <MapPinBadge kind={marker.kind ?? 'primary'} colors={colors} />
          </Marker>
        ))}
      </Map>
      {/* Same OSM-attribution rationale as NativeMap — see that component's
          comment. `attributionControl={false}` above suppresses MapLibre's
          own control so this explicit, theme-matched badge is the only
          one shown, exactly mirroring the native branch. */}
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
