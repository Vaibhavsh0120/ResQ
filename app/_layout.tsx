import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from '@/theme/ThemeContext';
import { NavVisibilityProvider } from '@/context/NavVisibilityContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Auth-gated navigation tree, using expo-router's Stack.Protected (SDK 53+).
//
// Previously every screen was declared as a single always-available
// <Stack.Screen>, and the only thing standing between a logged-out user
// and the authenticated area was profile.tsx's sign-out button doing
// `router.replace('/login')` — which swaps the *current* screen but
// leaves everything underneath it (e.g. the tabs) still sitting in
// navigation history. A back-gesture from /login could pop right back
// into the app despite the user having just signed out.
//
// There are three distinct states the app cares about (see AuthContext):
//   1. logged out                                -> login/register only
//   2. logged in, onboarding not complete yet     -> onboarding only
//   3. logged in, onboarding complete             -> the main app
// Each is its own Stack.Protected group below, in that order, so a screen
// only ever exists in the one group it actually belongs to (expo-router
// requires this — a screen can't be duplicated across groups). Whichever
// way a guard flips, expo-router drops the now-inaccessible group's
// history entries entirely ("When a screen's guard is changed from true
// to false, all of its history entries will be removed from the
// navigation history" — Expo Router docs) and lands on the first screen
// of whichever group just became active — so signing out, for instance,
// clears the entire authenticated stack and lands cleanly on `login`,
// with nothing left in history for a back-gesture to return to.
function RootStack() {
  const { isDark, colors } = useAppTheme();
  const { isLoading, isLoggedIn, hasCompletedOnboarding } = useAuth();

  // Wait for the persisted session to finish hydrating before deciding
  // which group of screens to mount, so a logged-in user never sees a
  // flash of the login screen first.
  if (isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Startup/splash screen — always reachable, it's the one place
            that decides where to send a freshly-launched app regardless
            of auth state (see app/index.tsx). */}
        <Stack.Screen name="index" options={{ animation: 'fade' }} />

        {/* Legal — deliberately outside every Stack.Protected group below,
            not duplicated into each one. Play Store policy and India's
            DPDP Act both expect a privacy policy to be readable *before*
            creating an account (login/register link to these), and the
            same two screens need to stay reachable from Profile/Privacy &
            security once signed in — putting them here once, ungated,
            covers both without registering them twice (expo-router
            doesn't allow the same screen name in two groups anyway). */}
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="terms" />

        {/* State 1: logged out. `login` listed first so it's the landing
            screen the moment this group becomes active (e.g. right after
            logout flips isLoggedIn to false). */}
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>

        {/* State 2: logged in, but hasn't finished the setup flow yet. */}
        <Stack.Protected guard={isLoggedIn && !hasCompletedOnboarding}>
          <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>

        {/* State 3: fully set up — this is what actually fixes the
            "back into the app after sign-out" bug described above. */}
        <Stack.Protected guard={isLoggedIn && hasCompletedOnboarding}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="profile" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="chat" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="readiness" />
          <Stack.Screen name="guidance-result" />
          <Stack.Screen name="family-member" />
          <Stack.Screen name="place-detail" />
          <Stack.Screen name="update-detail" />
          <Stack.Screen name="alert-preferences" />
          <Stack.Screen name="privacy-security" />
          <Stack.Screen name="notifications" />
          {/* SOS opens full-screen from Home's SOS entry point — modal-style
              presentation matches the urgency (it isn't just another drill-in
              detail screen) and skips the usual slide-from-right animation
              so it feels immediate. */}
          <Stack.Screen name="sos" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
          <Stack.Screen name="sos-history" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavVisibilityProvider>
              <RootStack />
            </NavVisibilityProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
