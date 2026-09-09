/**
 * Builds a Google Maps link for a coordinate pair — the same URL shape
 * already used inline in place-detail.tsx's onDirections, pulled out here
 * so new call sites (SOS) don't duplicate it. Not a drop-in replacement for
 * place-detail.tsx's version, which also has a name-search fallback for
 * places with no coordinates on file — that one stays as-is rather than
 * being refactored as a side effect of this change.
 */
export function mapsLinkForCoords(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}
