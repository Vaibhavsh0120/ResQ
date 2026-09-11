#!/usr/bin/env node
/**
 * Copies maplibre-gl's ESM Web Worker build (and the shared chunk it
 * imports by relative path) into public/vendor/, so
 * src/components/MiniMap.web.tsx can point maplibre-gl at it via
 * `setWorkerUrl('/vendor/maplibre-gl-worker.mjs')` without a
 * bundler-specific `?worker&url`/`import.meta.url` import (see the
 * SDK-choice comment at the top of that file for the full rationale).
 *
 * Runs automatically via package.json's `postinstall` so the vendored
 * copy can never silently drift from whatever `maplibre-gl` version
 * actually got installed (a mismatched worker build is a real, easy-to-
 * miss runtime bug — the map would fail silently or tiles wouldn't load).
 * Safe to run manually too: `node scripts/sync-maplibre-worker.js`.
 */
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'node_modules', 'maplibre-gl', 'dist');
const DEST_DIR = path.join(__dirname, '..', 'public', 'vendor');
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    // maplibre-gl isn't installed yet (e.g. a partial/offline install) —
    // don't fail the whole `npm install` over a web-only asset.
    console.warn('[sync-maplibre-worker] maplibre-gl/dist not found, skipping (web maps will not work until this is re-run).');
    return;
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  for (const file of FILES) {
    const src = path.join(SOURCE_DIR, file);
    const dest = path.join(DEST_DIR, file);
    if (!fs.existsSync(src)) {
      console.warn(`[sync-maplibre-worker] ${file} not found in installed maplibre-gl — SDK version may have changed its dist layout. Check src/components/MiniMap.web.tsx.`);
      continue;
    }
    fs.copyFileSync(src, dest);
  }

  console.log('[sync-maplibre-worker] Synced maplibre-gl worker files to public/vendor/.');
}

main();
