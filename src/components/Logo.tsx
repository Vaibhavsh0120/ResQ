import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';

// Local brand mark (see /logo/ for the original 1254x1254 source files this
// was generated from) — replaces a prior external Vercel-hosted URL that
// added latency/flicker and failed offline on every screen that rendered
// the logo.
const logoSource = require('../../assets/images/logo-mark.png');

// App name is displayed as "ResQ" (previously lowercase "resq") everywhere in the UI.
export function Logo({ compact = false }: { compact?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.brand}>
      <View style={[styles.logoBadge, { backgroundColor: colors.brandDeep }]}>
        <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
      </View>
      <Text style={[compact ? styles.textCompact : styles.text, { color: colors.foreground }]}>ResQ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 15,
    height: 15,
  },
  text: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -1,
  },
  textCompact: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -1,
  },
});
