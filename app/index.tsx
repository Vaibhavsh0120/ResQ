import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/theme/ThemeContext';

// Local startup animations — stored in assets/videos/
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lightVideo = require('../assets/videos/startup-light.mp4');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const darkVideo = require('../assets/videos/startup-dark.mp4');

// Module-level (not component-level) flag, so it survives this screen
// being unmounted and remounted within the same running app instance —
// which is exactly what happens when Stack.Protected's guard-fallback
// redirect lands back on this screen. `index` is deliberately declared
// outside every Stack.Protected group (see app/_layout.tsx) so it's
// always reachable at true cold start, but Expo Router's own protected-
// routes behavior falls back to the first declared/always-available
// screen — this one — whenever a guard-driven redirect can't resolve
// more specifically (e.g. right after logout, or right after register
// hands off to onboarding). Previously that fallback silently remounted
// this screen and replayed the splash video on every logout/sign-up,
// not just on real app launch. A module-level flag (reset only when the
// JS process itself restarts — a real cold start) is what makes "once
// per app launch" the actual behavior instead of "once per mount."
let hasPlayedStartupVideo = false;

export default function StartupScreen() {
  const { isLoading, isLoggedIn, hasCompletedOnboarding } = useAuth();
  // Uses the app's own resolved theme (ThemeProvider — light by default,
  // 'system' only if the user has explicitly chosen it) rather than the
  // raw device color scheme, so the startup video always matches what the
  // rest of the app will look like a moment later. Previously this read
  // `useColorScheme()` directly, which meant a device set to dark mode
  // saw the dark startup video even though the app itself defaults to,
  // and would immediately land on, light mode.
  const { isDark } = useAppTheme();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);
  const skipVideo = hasPlayedStartupVideo;

  const videoSource = isDark ? darkVideo : lightVideo;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = true;
    // Don't start playback on a repeat visit — see skipVideo below, which
    // redirects before first paint anyway, but this avoids a stray frame
    // of video briefly appearing on native while that redirect runs.
    if (!skipVideo) {
      p.play();
    }
  });

  const goToDestination = useCallback(() => {
    if (isLoggedIn && hasCompletedOnboarding) {
      router.replace('/(tabs)');
    } else if (isLoggedIn && !hasCompletedOnboarding) {
      router.replace('/onboarding/personal' as any);
    } else {
      router.replace('/login');
    }
  }, [isLoggedIn, hasCompletedOnboarding]);

  const navigateAway = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    hasPlayedStartupVideo = true;

    // Fade out then navigate
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(goToDestination);
  }, [fadeAnim, goToDestination]);

  // Two cases skip the video and fade entirely, going straight to the
  // right destination the moment auth state is known:
  //  1. Already logged in and onboarded — the pre-existing "don't make a
  //     returning, fully-set-up user sit through the splash" behavior.
  //  2. This screen is being revisited after the video already played
  //     once this app launch. `index` is deliberately declared outside
  //     every Stack.Protected group (see app/_layout.tsx) so it's always
  //     reachable at true cold start — but that also makes it Expo
  //     Router's fallback landing screen whenever a guard-driven redirect
  //     can't resolve more specifically (e.g. right after logout, or
  //     right after register hands off to onboarding). Previously that
  //     fallback silently remounted this screen and replayed the splash
  //     video on every logout/sign-up, not just on a real app launch.
  //     `hasPlayedStartupVideo` is a module-level (not component-level)
  //     flag, so it survives exactly this kind of unmount/remount within
  //     the same running app instance, and only resets on a true cold
  //     start (new JS process).
  useEffect(() => {
    if (isLoading || hasNavigated.current) return;
    if (skipVideo || (isLoggedIn && hasCompletedOnboarding)) {
      hasNavigated.current = true;
      hasPlayedStartupVideo = true;
      goToDestination();
    }
  }, [isLoading, isLoggedIn, hasCompletedOnboarding, skipVideo, goToDestination]);

  // Listen for video playback ending.
  useEffect(() => {
    if (!player || skipVideo) return;

    const subscription = player.addListener('playToEnd', () => {
      navigateAway();
    });

    return () => {
      subscription.remove();
    };
  }, [player, navigateAway, skipVideo]);

  // Fallback timer in case video events don't fire (e.g. web).
  useEffect(() => {
    if (skipVideo) return;
    const timer = setTimeout(() => {
      navigateAway();
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigateAway, skipVideo]);

  const bgColor = isDark ? '#000000' : '#ffffff';

  // Nothing to paint on a repeat visit or an already-onboarded user — the
  // effect above redirects immediately. Rendering the video view here
  // risked a single visible frame before that effect fires.
  if (skipVideo || (isLoggedIn && hasCompletedOnboarding)) {
    return <View style={[styles.container, { backgroundColor: bgColor }]} />;
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity: fadeAnim }]}>
      <Pressable style={styles.pressable} onPress={navigateAway}>
        <VideoView
          style={styles.video}
          player={player}
          nativeControls={false}
          contentFit="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
