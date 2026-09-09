/**
 * Render smoke tests — mount every screen with mocked navigation, let all
 * mock-data hooks resolve, then assert nothing threw.
 *
 * Why this exists: `tsc --noEmit` only catches type errors, and
 * `expo export`'s static rendering renders each route once while its data
 * hooks are still in their initial `loading: true` state (the real fetch
 * hasn't resolved yet during SSR). A bug that only lives in the
 * "data has loaded, now map over it" branch — e.g. a stray whitespace text
 * node between JSX elements, which React Native's renderer throws on
 * ("Text strings must be rendered within a <Text> component") — can slip
 * past both of those and only surface at real runtime, on-device, after the
 * mock/real fetch resolves. This harness waits out that fetch (the mock
 * services use a real ~450ms setTimeout delay) so every screen's "loaded"
 * branch actually executes at least once, same as it would on a real device.
 *
 * Uses @testing-library/react-native's `render`, not raw react-test-renderer:
 * react-test-renderer's generic host config does NOT apply React Native's
 * own renderer invariants (confirmed by reading node_modules directly —
 * the "Text strings must be rendered within a <Text> component" check
 * lives in react-native's own Fabric/paper renderer implementation, and
 * @testing-library/react-native is the tool that wires tests up against
 * that real renderer instead of the generic one).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/ThemeContext';
import { NavVisibilityProvider } from '@/context/NavVisibilityContext';
import { AuthProvider } from '@/context/AuthContext';

const mockParams: { current: Record<string, string> } = { current: {} };

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  })),
  VideoView: 'VideoView',
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissAll: jest.fn() },
  useLocalSearchParams: () => mockParams.current,
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(cb, []);
  },
}));

jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});

const initialSafeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

async function renderScreen(Component: React.ComponentType<any>) {
  return render(
    <SafeAreaProvider initialMetrics={initialSafeAreaMetrics}>
      <ThemeProvider>
        <AuthProvider>
          <NavVisibilityProvider>
            <Component />
          </NavVisibilityProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Real mock-service delay is ~450ms (see src/config/env.ts mockLatencyMs).
// Waiting this out with real timers, rather than juggling fake timers
// against RTL's own internal async act(), is the more reliable option here.
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  mockParams.current = {};
});

jest.setTimeout(35000);

// Screens with no async data dependency — mount and settle only.
const staticScreens: Array<[string, () => React.ComponentType<any>]> = [
  ['app/index.tsx (splash)', () => require('../app/index').default],
  ['app/login.tsx', () => require('../app/login').default],
  ['app/register.tsx', () => require('../app/register').default],
  ['app/forgot-password.tsx', () => require('../app/forgot-password').default],
  ['app/onboarding/personal.tsx', () => require('../app/onboarding/personal').default],
  ['app/onboarding/medical.tsx', () => require('../app/onboarding/medical').default],
  ['app/onboarding/family.tsx', () => require('../app/onboarding/family').default],
  ['app/onboarding/location.tsx', () => require('../app/onboarding/location').default],
  ['app/onboarding/emergency.tsx', () => require('../app/onboarding/emergency').default],
  ['app/readiness.tsx', () => require('../app/readiness').default],
  ['app/guidance-result.tsx', () => require('../app/guidance-result').default],
  ['app/alert-preferences.tsx', () => require('../app/alert-preferences').default],
  ['app/privacy-security.tsx', () => require('../app/privacy-security').default],
  ['app/chat.tsx', () => require('../app/chat').default],
];

// Screens backed by a mock-data hook — these are the ones that matter most,
// since the bug class this harness targets only lives in their "loaded"
// render branch.
const dataScreens: Array<[string, () => React.ComponentType<any>]> = [
  ['app/(tabs)/index.tsx (home)', () => require('../app/(tabs)/index').default],
  ['app/(tabs)/family.tsx', () => require('../app/(tabs)/family').default],
  ['app/(tabs)/safe.tsx', () => require('../app/(tabs)/safe').default],
  ['app/(tabs)/updates.tsx', () => require('../app/(tabs)/updates').default],
  ['app/(tabs)/report.tsx', () => require('../app/(tabs)/report').default],
  ['app/profile.tsx', () => require('../app/profile').default],
  ['app/notifications.tsx', () => require('../app/notifications').default],
  ['app/sos.tsx', () => require('../app/sos').default],
  ['app/sos-history.tsx', () => require('../app/sos-history').default],
];

// Screens that read an id from route params and look it up in loaded data —
// tested with a real, existing mock id so the "found" render branch (not
// just the "not found" placeholder branch) actually executes.
const paramScreens: Array<[string, string, string, () => React.ComponentType<any>]> = [
  ['app/family-member.tsx', 'id', 'fam-1', () => require('../app/family-member').default],
  ['app/place-detail.tsx', 'id', 'place-1', () => require('../app/place-detail').default],
  ['app/update-detail.tsx', 'id', 'update-1', () => require('../app/update-detail').default],
];

describe('static screens mount without throwing', () => {
  test.each(staticScreens)('%s', async (_name, getComponent) => {
    const Component = getComponent();
    await expect(renderScreen(Component)).resolves.toBeTruthy();
  });
});

describe('data-backed screens mount and settle without throwing', () => {
  test.each(dataScreens)('%s', async (_name, getComponent) => {
    const Component = getComponent();
    const tree = await renderScreen(Component);
    // Let the mock service's ~450ms delay resolve so the hook flips to
    // loading:false and the real "loaded" render branch actually executes.
    await wait(800);
    expect(tree.toJSON()).toBeTruthy();
  });
});

describe('param-driven detail screens mount and settle without throwing', () => {
  test.each(paramScreens)('%s', async (_name, paramKey, paramValue, getComponent) => {
    mockParams.current = { [paramKey]: paramValue };
    const Component = getComponent();
    const tree = await renderScreen(Component);
    await wait(800);
    expect(tree.toJSON()).toBeTruthy();
  });
});
