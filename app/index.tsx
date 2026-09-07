import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAuth } from '@/context/AuthContext';

// Local startup animations — stored in assets/videos/
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lightVideo = require('../assets/videos/startup-light.mp4');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const darkVideo = require('../assets/videos/startup-dark.mp4');

export default function StartupScreen() {
  const { isLoading, isLoggedIn, hasCompletedOnboarding } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);

  const videoSource = isDark ? darkVideo : lightVideo;
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = true;
    p.play();
  });

  const navigateAway = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    // Fade out then navigate
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (isLoggedIn && hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else if (isLoggedIn && !hasCompletedOnboarding) {
        router.replace('/onboarding/personal' as any);
      } else {
        router.replace('/login');
      }
    });
  }, [fadeAnim, isLoggedIn, hasCompletedOnboarding]);

  // If the user is already logged in and onboarded, skip the video entirely.
  useEffect(() => {
    if (!isLoading && isLoggedIn && hasCompletedOnboarding) {
      router.replace('/(tabs)');
      hasNavigated.current = true;
    }
  }, [isLoading, isLoggedIn, hasCompletedOnboarding]);

  // Listen for video playback ending.
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('playToEnd', () => {
      navigateAway();
    });

    return () => {
      subscription.remove();
    };
  }, [player, navigateAway]);

  // Fallback timer in case video events don't fire (e.g. web).
  useEffect(() => {
    const timer = setTimeout(() => {
      navigateAway();
    }, 6000);
    return () => clearTimeout(timer);
  }, [navigateAway]);

  const bgColor = isDark ? '#000000' : '#ffffff';

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
