import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useNavVisibility } from './NavVisibilityContext';

/**
 * Call from any screen that should hide the bottom navbar while it is
 * focused (e.g. Profile, Chat). Automatically restores the navbar when the
 * screen loses focus or unmounts.
 */
export function useHideTabBar() {
  const { setHideTabBar } = useNavVisibility();

  useFocusEffect(
    useCallback(() => {
      setHideTabBar(true);
      return () => setHideTabBar(false);
    }, [setHideTabBar])
  );
}
