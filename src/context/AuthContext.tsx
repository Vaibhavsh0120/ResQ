import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearOnboardingDraft } from '@/services/onboardingService';

// ── Auth state shape ────────────────────────────────────────────────────
// Minimal auth context for managing the pre-home-screen flow.
// `isLoading` is true during the initial hydration from AsyncStorage —
// callers should show nothing (or a splash) until it resolves, to avoid
// a flash of the login screen for already-authenticated users.

const AUTH_KEY = '@resq_auth_state';
const ONBOARDING_KEY = '@resq_onboarding_complete';

type User = {
  name: string;
  email: string;
};

type AuthContextValue = {
  /** True while we're reading persisted state from AsyncStorage. */
  isLoading: boolean;
  /** True when the user has a persisted session (real or demo). */
  isLoggedIn: boolean;
  /** True when the user entered via "Emergency App Access" (guest). */
  isGuest: boolean;
  /** True when the user has completed the onboarding setup flow. */
  hasCompletedOnboarding: boolean;
  /** Basic user info (null for guests and before login). */
  user: User | null;

  login: (user: User) => Promise<void>;
  register: (user: User) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Hydrate persisted auth state on mount.
  useEffect(() => {
    (async () => {
      try {
        const [authRaw, onboardingRaw] = await Promise.all([
          AsyncStorage.getItem(AUTH_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);

        if (authRaw) {
          const parsed = JSON.parse(authRaw) as { user: User | null; isGuest: boolean };
          setUser(parsed.user);
          setIsGuest(parsed.isGuest);
          setIsLoggedIn(true);
        }

        if (onboardingRaw === 'true') {
          setHasCompletedOnboarding(true);
        }
      } catch {
        // Corrupted storage — start fresh.
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Login is for an existing account signing back in — this mock auth
  // layer has no real backend to check a per-account onboarding flag
  // against, but semantically "logging in" only ever applies to someone
  // who already has an account, which means they already finished setup
  // once. Marking onboarding complete here (in addition to
  // AsyncStorage-persisting it) is what makes Login go straight to Home:
  // without this, _layout.tsx's `isLoggedIn && !hasCompletedOnboarding`
  // guard would route a logged-in user with no completed-onboarding flag
  // into /onboarding — which previously happened after every logout,
  // since logout resets hasCompletedOnboarding to false and login never
  // set it back to true. Register (below) deliberately leaves this
  // false, since creating a new account is exactly when setup should run.
  const login = useCallback(async (u: User) => {
    setUser(u);
    setIsGuest(false);
    setIsLoggedIn(true);
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user: u, isGuest: false }));
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const register = useCallback(async (u: User) => {
    setUser(u);
    setIsGuest(false);
    setIsLoggedIn(true);
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user: u, isGuest: false }));
  }, []);

  const loginAsGuest = useCallback(async () => {
    setUser(null);
    setIsGuest(true);
    setIsLoggedIn(true);
    setHasCompletedOnboarding(true); // Guests skip onboarding
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ user: null, isGuest: true }));
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsGuest(false);
    setIsLoggedIn(false);
    setHasCompletedOnboarding(false);
    await AsyncStorage.multiRemove([AUTH_KEY, ONBOARDING_KEY]);
    // Also drop any in-progress onboarding draft (personal/medical/
    // location/family/emergency-step data not yet folded into the real
    // profile/family-circle stores) — otherwise a different person logging
    // in on this device would see the previous user's half-finished
    // answers pre-filled into onboarding. Note this deliberately does NOT
    // touch the profile or family-circle data itself, matching how the
    // rest of this app's local-only storage already behaves on logout
    // (nothing else is wiped either) — only clearOnboardingDraft's own
    // narrower scope applies here.
    await clearOnboardingDraft();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isLoggedIn,
      isGuest,
      hasCompletedOnboarding,
      user,
      login,
      register,
      loginAsGuest,
      completeOnboarding,
      logout,
    }),
    [isLoading, isLoggedIn, isGuest, hasCompletedOnboarding, user, login, register, loginAsGuest, completeOnboarding, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
