import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { useNavVisibility } from './NavVisibilityContext';

/**
 * Call from any screen that should hide the bottom navbar while it is
 * focused (e.g. Profile, Chat, Voice, SOS). Automatically restores the
 * navbar the instant the user starts leaving the screen — however they
 * do it.
 *
 * "However they do it" matters here and is the whole reason this isn't
 * just the more obvious `useFocusEffect` cleanup alone. This app runs on
 * web, iOS, and Android, and each platform's primary way of going back is
 * different: an explicit on-screen back button (works the same
 * everywhere, and is the only path some screens even offer), Android's
 * hardware back button/edge swipe gesture, iOS's edge swipe-back gesture,
 * and the browser's own back button on web. `useFocusEffect`'s cleanup
 * only fires once expo-router's `blur` event dispatches, which follows
 * the *stack transition animation finishing* — not the moment the
 * underlying screen becomes visible. On a screen using
 * `slide_from_bottom` (e.g. Profile, ~300ms), that means the tab bar
 * visibly pops in ~300ms late relative to the screen itself — and that
 * gap exists identically whether the user tapped a button or used a
 * gesture, since both eventually funnel through the same blur event.
 *
 * `beforeRemove` (React Navigation's core event — see
 * reactnavigation.org/docs/navigation-events#beforeremove) is the actual
 * fix: it fires the moment a navigation action that would remove this
 * screen is dispatched, *before* the transition animation starts — and
 * it fires for every removal path uniformly (explicit back press, native
 * swipe-back gesture, Android hardware back, browser back/forward),
 * because all of them dispatch the same kind of "remove this route"
 * action under the hood. One listener here covers every platform's way
 * of going back, rather than needing separate handling per platform
 * (BackHandler for Android, a gesture listener for iOS, popstate for
 * web) the way this might otherwise need to be built by hand.
 *
 * Screens don't need to do anything extra for this to work — no manual
 * "restore the tab bar" call in a back-button handler is needed, since
 * beforeRemove already fires for that same button press before this
 * screen even starts animating away. (An earlier version of this hook
 * required exactly that per-screen manual call, covering only the
 * explicit-button path; it missed gesture/hardware/browser back entirely
 * and was replaced by this beforeRemove-based approach for that reason.)
 *
 * The focus-effect's own cleanup is kept as a safety net for any removal
 * path that somehow doesn't fire `beforeRemove` (e.g. this component
 * unmounting for a reason unrelated to navigation) — redundant in the
 * normal case, but calling setHideTabBar(false) twice is harmless.
 */
export function useHideTabBar() {
  const { setHideTabBar } = useNavVisibility();
  const navigation = useNavigation();

  useEffect(() => {
    return navigation.addListener('beforeRemove', () => setHideTabBar(false));
  }, [navigation, setHideTabBar]);

  useFocusEffect(
    useCallback(() => {
      setHideTabBar(true);
      return () => setHideTabBar(false);
    }, [setHideTabBar])
  );
}
