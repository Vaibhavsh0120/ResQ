import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  MAP_STYLE_URL,
  MapAttribution,
  MapPinBadge,
  MiniMapMarker,
  StaticMapFallback,
  filterValidMarkers,
  sharedMapStyles,
} from '@/components/MiniMap.shared';

// Native map surface — real MapLibre view over OpenFreeMap vector tiles.
// Metro/Expo Router resolves this file for iOS/Android builds and resolves
// the sibling MiniMap.web.tsx for web builds automatically (standard RN
// platform-extension resolution), so no runtime Platform.OS branching is
// needed here anymore — this file only ever runs where the native module
// below is actually available.
//
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MapLibre = require('@maplibre/maplibre-react-native');

export type { MiniMapMarker } from '@/components/MiniMap.shared';

type Props = {
  markers: MiniMapMarker[];
  /** Center/zoom when no markers are focused on a single point. Defaults to fitting all markers. */
  zoom?: number;
  height?: number;
  /** Accessible label read by screen readers in place of the interactive map. */
  accessibilityLabel?: string;
};

/**
 * Shared map surface for safe.tsx, place-detail.tsx, and family-member.tsx
 * — see AGENT.md for the design rationale. Renders a real MapLibre
 * view over OpenFreeMap vector tiles; falls back to the same stylized
 * static-pin illustration used everywhere else in the app whenever there
 * are no valid coordinates to show (e.g. a family member with no location
 * on file yet).
 */
export function MiniMap({ markers, zoom = 13, height = 190, accessibilityLabel }: Props) {
  const { colors, isDark } = useAppTheme();

  const validMarkers = filterValidMarkers(markers);

  if (validMarkers.length === 0) {
    return <StaticMapFallback markers={validMarkers} height={height} accessibilityLabel={accessibilityLabel} />;
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
      style={[sharedMapStyles.container, { height, borderColor: colors.line }]}
      accessible
      accessibilityLabel={accessibilityLabel ?? `Map showing ${validMarkers.length} location${validMarkers.length === 1 ? '' : 's'}`}
    >
      <Map mapStyle={MAP_STYLE_URL} style={sharedMapStyles.flex} logo={false} attribution={false}>
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
      <MapAttribution isDark={isDark} />
    </View>
  );
}
