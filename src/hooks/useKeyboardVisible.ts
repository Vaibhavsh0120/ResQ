import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// iOS fires `keyboardWill*` ahead of the animation (feels instant when
// used to drive a UI change) and always fires it; Android doesn't
// reliably fire `keyboardWill*` at all, only `keyboardDid*` — so the
// event pair has to be chosen per-platform rather than picked once.
// Confirmed against react-native's own Keyboard.d.ts (KeyboardEventName
// union includes both pairs, with `will*` types marked iOS-oriented via
// the KeyboardMetrics/KeyboardEventIOS split).
const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/**
 * Tracks whether the software keyboard is currently visible. Used by
 * chat.tsx's composer to switch between a mic button (keyboard closed,
 * no draft text — push straight to /voice) and a send button (keyboard
 * open, or there's already a draft to send) — see AGENT.md's 2026-09-12
 * session 3 entry for the reasoning. Not meaningful on web (no software
 * keyboard to show/hide), where it simply stays `false` forever and the
 * composer falls back to whatever chat.tsx's other conditions decide.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const showSub = Keyboard.addListener(SHOW_EVENT, () => setVisible(true));
    const hideSub = Keyboard.addListener(HIDE_EVENT, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}
