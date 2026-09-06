import React from 'react';
import { AccessibilityRole, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';

type Props = {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  muted?: boolean;
};

export function IconButton({ label, onPress, children, muted = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={'button' as AccessibilityRole}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: muted ? colors.surfaceSoft : 'transparent' },
        pressed && styles.pressed,
      ]}
      hitSlop={6}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
