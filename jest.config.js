/**
 * Minimal jest-expo setup used only for `npm run test:smoke` — a set of
 * render smoke tests (see __tests__/smoke.test.tsx) that mount every screen
 * with mocked navigation and *resolved* async data. This exists specifically
 * to catch runtime-only React errors (bad JSX children, undefined-prop
 * crashes) that `tsc --noEmit` and `expo export`'s static rendering both
 * miss whenever the broken code path only runs after an async hook
 * resolves — `expo export` renders screens while hooks are still in their
 * initial `loading: true` state, so a route can bundle and statically
 * render cleanly while still crashing the moment real data arrives.
 */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/'],
  moduleNameMapper: {
    '\\.(mp4|MP4|png|jpg|jpeg|gif|webp)$': '<rootDir>/__tests__/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
  ],
  // react-native-worklets ships a native module that isn't available under
  // Jest's node/jsdom environment. Its own docs (docs.swmansion.com/react-
  // native-worklets/docs/guides/testing) recommend this resolver override so
  // `import ... from 'react-native-worklets'` (pulled in transitively by
  // react-native-reanimated, used by chat.tsx's drawer gesture) resolves to
  // the package's web/JS implementation under test instead of its .native.ts
  // entry — without this, any screen that imports reanimated crashes at
  // require-time in the smoke tests with "Cannot read properties of
  // undefined (reading 'loadUnpackers')".
  resolver: 'react-native-worklets/jest/resolver',
};
