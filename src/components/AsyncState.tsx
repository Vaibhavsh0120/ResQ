import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { AlertCircle, RefreshCw } from './icons';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.brand} />
      <Text style={[styles.label, { color: colors.inkMuted }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.card, { borderColor: colors.line, backgroundColor: colors.dangerSoft }]}>
      <AlertCircle size={18} color={colors.danger} />
      <Text style={[styles.message, { color: colors.danger }]}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton} hitSlop={8}>
          <RefreshCw size={14} color={colors.danger} />
          <Text style={[styles.retryText, { color: colors.danger }]}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  message: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
