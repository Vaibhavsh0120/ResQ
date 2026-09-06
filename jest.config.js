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
  preset: 'jest-expo',  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native)',
  ],
};
