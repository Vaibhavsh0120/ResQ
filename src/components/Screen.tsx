import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Enables pull-to-refresh (native RefreshControl) on the scrolling body. Ignored when scroll={false} — a non-scrolling screen has no gesture to pull. */
  onRefresh?: () => void;
  /** Whether a refresh triggered by onRefresh is still in flight, so the native spinner shows/hides correctly. Required together with onRefresh. */
  refreshing?: boolean;
};

/** Standard body wrapper for a tab/stack screen's content, below the Header. */
export function Screen({ children, scroll = true, contentStyle, onRefresh, refreshing }: Props) {
  const { colors } = useAppTheme();

  if (!scroll) {
    // A non-scrolling screen body is expected to fill the available
    // height, the same way the ScrollView branch below does via its own
    // `flex: 1` wrapper — without it, this View shrinks to its content's
    // intrinsic height, and any child relying on `flex: 1` to center/fill
    // within it (e.g. sos.tsx's triggerWrap) collapses to near-zero
    // remaining space instead. See AGENT.md's 2026-09-11 session 2 entry.
    return (
      <View style={[styles.flex, styles.body, { backgroundColor: colors.background }, contentStyle]}>{children}</View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.body, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
});
