import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'outline' | 'secondary' | 'danger';
  style?: any;
};

export function PrimaryButton({ title, onPress, disabled, loading, icon, variant = 'primary', style }: Props) {
  const { colors } = useAppTheme();

  const backgroundColor =
    variant === 'primary'
      ? colors.brandDeep
      : variant === 'danger'
      ? colors.dangerSoft
      : variant === 'secondary'
      ? colors.surface
      : 'transparent';

  const textColor =
    variant === 'primary' ? colors.onBrand : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.foreground : colors.brand;

  const borderColor = variant === 'outline' ? colors.line : variant === 'secondary' ? colors.line : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor, borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0 },
        (disabled || loading) && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
          {icon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
});
