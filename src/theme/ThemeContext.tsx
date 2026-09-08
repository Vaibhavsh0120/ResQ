import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from './colors';

/** The user's chosen appearance setting. 'system' follows the OS setting. */
export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_MODE_KEY = '@resq_theme_mode';

type ThemeContextValue = {
  /** The user's chosen setting — one of 'light' | 'dark' | 'system'. */
  mode: ThemeMode;
  /** Persist and apply a new appearance setting. */
  setMode: (mode: ThemeMode) => void;
  /** Resolved light/dark state after applying 'system', for anything that just needs a boolean. */
  isDark: boolean;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  // ResQ defaults to light mode regardless of the device's system setting —
  // only an explicit 'system' choice ties appearance to the OS. This also
  // matches app.json's `userInterfaceStyle: "light"`, which controls native
  // chrome (status bar, etc.) before this context ever mounts.
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load the persisted choice once on mount. Until this resolves we keep
  // rendering the 'light' default above rather than flashing a different
  // theme once storage responds.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setModeState(stored);
        }
      } catch {
        // Corrupted/unavailable storage — stick with the light default.
      }
    })();
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next).catch(() => {
      // Best-effort persistence — the in-memory setting still applies for
      // the rest of this session even if the write fails.
    });
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
      isDark,
      colors: isDark ? darkColors : lightColors,
    }),
    [mode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}
