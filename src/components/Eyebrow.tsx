import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[styles.text, { color: light ? colors.onBrandFaint : colors.inkMuted }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
