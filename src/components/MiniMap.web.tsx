import React, { useEffect, useMemo, useRef } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, setWorkerUrl } from 'maplibre-gl';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius, ThemeColors } from '@/theme/colors';
import {
  MAP_STYLE_URL,
  MapAttribution,
  MiniMapMarker,
  StaticMapFallback,
  filterValidMarkers,
  pinColors,
} from '@/components/MiniMap.shared';

// Web map surface — Metro/Expo Router resolves this file (not MiniMap.tsx)
// for web builds automatically via the standard `.web.tsx` platform
// extension, so there's no runtime Platform.OS branch anymore: this file
// only ever bundles for web, and MiniMap.tsx only ever bundles for
// iOS/Android. See PROGRESS.md §3.1 for why real web maps were originally
// scoped out, and the 2026-09-10 follow-up entry for the risk assessment
// this implementation resolves.
//
// SDK choice: `maplibre-gl` v6 (see package.json) — bumped 2026-09-11 off
// v5 specifically to pick up the fix for CVE-2026-85061 (GHSA-jrc7-96c5-
// q579, CVSS 10, an XSS sanitizer bypass in the built-in attribution
// control's innerHTML path; fixed in 6.4.1+, no v5 backport exists). v5
// was originally kept because v6 is ESM-only and its Web Worker needs
// either a bundler-specific import (Vite's `?worker&url`, webpack/
// Rspack's `new URL(..., import.meta.url)`) that Metro's web bundler has
// no equivalent for, or a manual `setWorkerUrl()` call pointing at a
// worker file served some other way. This app takes the third,
// bundler-agnostic option MapLibre's own docs describe as the "no
// bundler" case: `maplibre-gl-worker.mjs` and its sibling
// `maplibre-gl-shared.mjs` (the worker imports it by relative path, so
// both must be co-located) are copied from node_modules into
// `public/vendor/` — Expo Router's root `public/` directory is copied
// verbatim to `dist/` during `expo export --platform web` and served
// from the site root — and `setWorkerUrl()` below points at the copy.
// This needs re-running (see package.json's `postinstall` script) any
// time `maplibre-gl` is upgraded, since the worker build is
// version-specific.
//
// Also required by the v6 jump: WebGL1 support was dropped (WebGL2-only)
// — StaticMapFallback below is a real fallback for a browser/device that
// throws GPUInitializationError from the Map constructor, not just for
// "no coordinates yet". Every other named export this file already used
// (Map/Marker/LngLatBounds) is unchanged between v5 and v6.
//
// maplibre-gl's own stylesheet (maplibre-gl.css) is deliberately not
// imported wholesale. Most of it styles chrome this component doesn't use
// — default marker SVGs (markers here are custom elements, styled inline
// below), nav/geolocate controls (none added), and popups (none used).
// The attribution control it also styles is replaced by the same
// MapAttribution label MiniMap.tsx uses, to satisfy OSM's ODbL credit
// requirement consistently on both platforms — and, since 2026-09-11, to
// keep this app off the exact `attributionControl`-driven innerHTML path
// CVE-2026-85061 was in, on top of running a version with the sanitizer
// itself fixed (`attributionControl: false` below; belt-and-suspenders,
// not a substitute for staying on a patched version). What the stylesheet
// would add beyond that — a grab cursor/touch-action on the canvas, and
// (2026-09-11 fix) the `position: absolute` base `.maplibregl-marker`
// needs to make its `transform: translate(...)` positioning work at all
// — is added directly in ensureCanvasStyle() below, which avoids
// importing a full CSS file from node_modules through Metro's web build
// (untested, unnecessary surface area) for three rules. See
// ensureCanvasStyle()'s own comment for why the marker rule specifically
// is load-bearing, not a style preference.

let workerUrlConfigured = false;
function ensureWorkerUrlConfigured() {
  if (workerUrlConfigured || typeof window === 'undefined') return;
  workerUrlConfigured = true;
  // See the SDK-choice comment above — this must be set before the first
  // `new MapLibreMap(...)` call. `/vendor/...` resolves against the site
  // root both in `expo start --web` (Metro dev server) and the exported
  // static build (Expo Router copies `public/` to `dist/`'s root).
  setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
}

const CANVAS_STYLE_ID = 'resq-minimap-canvas-style';

function ensureCanvasStyle() {
  if (typeof document === 'undefined' || document.getElementById(CANVAS_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = CANVAS_STYLE_ID;
  // The cursor/touch-action rules are this component's own choice (see the
  // top-of-file comment on why maplibre-gl.css isn't imported wholesale).
  // The `.maplibregl-marker` rule below is different: it isn't a style
  // preference, it's load-bearing positioning that MapLibre's `Marker`
  // class depends on existing *somewhere* on the page. `Marker`'s internal
  // update loop only ever writes `element.style.transform = 'translate(...)'`
  // (see node_modules/maplibre-gl/dist/maplibre-gl.mjs, the marker update
  // path) — it never sets `position` inline. `translate()` is relative to
  // the element's own normal-flow position unless something gives it
  // `position: absolute` (or fixed/relative), which is normally
  // maplibre-gl.css's job via its `.maplibregl-marker` rule. Without it,
  // Marker's wrapper div sits in-flow after the canvas instead of being
  // pinned to the coordinate MapLibre computed, so every marker exists in
  // the DOM (inspectable, has the right transform) but isn't visible where
  // expected — this is what was actually happening, not a MapLibre v6 API
  // change or an isStyleLoaded()/'load' timing issue (both checked and
  // ruled out: v6 kept v5's semantics for both, confirmed directly against
  // the installed dist). Restoring just this one rule (not the rest of
  // maplibre-gl.css) fixes marker visibility without pulling in the
  // default-marker/nav/popup chrome this app doesn't use.
  style.textContent =
    '.maplibregl-canvas{cursor:grab;touch-action:none;outline:none;}.maplibregl-canvas:active{cursor:grabbing;}' +
    '.maplibregl-marker{position:absolute;top:0;left:0;will-change:transform;}';
  document.head.appendChild(style);
}

// Lucide's "map-pin" glyph (see node_modules/lucide-react-native/.../map-pin.js),
// inlined as a static SVG string so marker elements can be built with
// plain DOM calls instead of mounting a second React tree into a detached
// node just to reparent it into MapLibre's marker wrapper.
const PIN_ICON_SVG =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>' +
  '<circle cx="12" cy="10" r="3"/></svg>';

/** Builds a marker element visually matching MiniMap.shared's MapPinBadge —
 * a colored circular badge with the same pin glyph — so a place looks the
 * same whether it's rendered natively or on web. */
function createMarkerElement(kind: NonNullable<MiniMapMarker['kind']>, colors: ThemeColors) {
  const { background, foreground } = pinColors(kind, colors);
  const el = document.createElement('div');
  Object.assign(el.style, {
    width: '26px',
    height: '26px',
    borderRadius: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    border: `2.5px solid ${colors.onBrandBorder}`,
    backgroundColor: background,
    color: foreground,
  });
  el.innerHTML = PIN_ICON_SVG;
  return el;
}

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
 * — see PROGRESS.md §3.1 for the design rationale. Renders a real MapLibre
 * GL JS map over OpenFreeMap vector tiles; falls back to the same
 * stylized static-pin illustration used everywhere else in the app
 * whenever there are no valid coordinates to show.
 */
export function MiniMap({ markers, zoom = 13, height = 190, accessibilityLabel }: Props) {
  const { colors, isDark } = useAppTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerInstancesRef = useRef<Marker[]>([]);
  // v6 requires WebGL2 (see SDK-choice comment above) — the Map
  // constructor throws GPUInitializationError instead of returning a map
  // when it isn't available, so this falls back to the same static
  // illustration used for "no coordinates yet" rather than crashing the
  // screen the map is embedded in.
  const [webglUnsupported, setWebglUnsupported] = React.useState(false);

  const validMarkers = filterValidMarkers(markers);
  const hasMarkers = validMarkers.length > 0;
  // Stable key so the marker-sync effect only re-runs when positions/kinds
  // actually change, not on every parent re-render.
  const markersKey = useMemo(
    () => validMarkers.map((m) => `${m.id}:${m.latitude.toFixed(5)}:${m.longitude.toFixed(5)}:${m.kind ?? 'primary'}`).join('|'),
    [validMarkers]
  );

  useEffect(() => {
    ensureCanvasStyle();
  }, []);

  // Create the map once real coordinates exist. Markers/camera are synced
  // imperatively in the effect below rather than recreating the map on
  // every data change, which would flash and reset the user's zoom/pan.
  useEffect(() => {
    if (!containerRef.current || !hasMarkers || webglUnsupported) return;

    ensureWorkerUrlConfigured();

    let map: MapLibreMap;
    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: [validMarkers[0].longitude, validMarkers[0].latitude],
        zoom,
        attributionControl: false,
      });
    } catch {
      // GPUInitializationError (or any other construction failure) — fall
      // back rather than leaving a blank container.
      setWebglUnsupported(true);
      return;
    }
    mapRef.current = map;

    return () => {
      markerInstancesRef.current.forEach((m) => m.remove());
      markerInstancesRef.current = [];
      map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };
    // Intentionally keyed only on "has any markers at all" — see comment
    // above; position/kind updates are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMarkers, webglUnsupported]);

  // Sync markers + camera whenever positions/kinds actually change.
  useEffect(() => {
    if (!hasMarkers || webglUnsupported) return;
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      if (mapRef.current !== map) return; // torn down before the style finished loading
      markerInstancesRef.current.forEach((m) => m.remove());
      markerInstancesRef.current = validMarkers.map((marker) =>
        new Marker({ element: createMarkerElement(marker.kind ?? 'primary', colors), anchor: 'center' })
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map)
      );

      if (validMarkers.length === 1) {
        map.jumpTo({ center: [validMarkers[0].longitude, validMarkers[0].latitude], zoom });
      } else {
        const bounds = validMarkers.reduce(
          (b, m) => b.extend([m.longitude, m.latitude]),
          new LngLatBounds([validMarkers[0].longitude, validMarkers[0].latitude], [validMarkers[0].longitude, validMarkers[0].latitude])
        );
        map.fitBounds(bounds, { padding: 40, maxZoom: zoom, duration: 0 });
      }
    };

    if (map.isStyleLoaded()) syncMarkers();
    else map.once('load', syncMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersKey, hasMarkers, webglUnsupported]);

  if (!hasMarkers || webglUnsupported) {
    return <StaticMapFallback markers={validMarkers} height={height} accessibilityLabel={accessibilityLabel} />;
  }

  return (
    <div
      style={{ ...containerStyle, height, borderColor: colors.line }}
      role="img"
      aria-label={accessibilityLabel ?? `Map showing ${validMarkers.length} location${validMarkers.length === 1 ? '' : 's'}`}
    >
      <div ref={containerRef} style={fillStyle} />
      <MapAttribution isDark={isDark} />
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: radius.xl,
  overflow: 'hidden',
};

const fillStyle: React.CSSProperties = { width: '100%', height: '100%' };
