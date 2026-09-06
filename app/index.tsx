import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';

// Local brand mark — see Logo.tsx for why this replaced an external URL.
const logoSource = require('../assets/images/logo-mark.png');

export default function Splash() {
  const { colors } = useAppTheme();
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(lineWidth, {
      toValue: 1,
      duration: 1100,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1300);
    return () => clearTimeout(timer);
  }, [lineWidth]);

  return (
    <View style={[styles.container, { backgroundColor: colors.brandDeep }]}>
      <View style={[styles.mark, { backgroundColor: colors.onBrandOverlaySoft }]}>
        <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={[styles.brand, { color: colors.onBrand }]}>ResQ</Text>
      <Text style={[styles.tagline, { color: colors.onBrandMuted }]}>Prepared for what matters.</Text>
      <View style={[styles.loadingTrack, { backgroundColor: colors.onBrandOverlayFainter }]}>
        <Animated.View
          style={[
            styles.loadingFill,
            {
              backgroundColor: colors.onBrand,
              width: lineWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    marginTop: 6,
  },
  loadingTrack: {
    width: 120,
    height: 3,
    borderRadius: 2,
    marginTop: 28,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 2,
  },
});
