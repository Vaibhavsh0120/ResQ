import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme/ThemeContext';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

/** Standard body wrapper for a tab/stack screen's content, below the Header. */
export function Screen({ children, scroll = true, contentStyle }: Props) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return <View style={[styles.body, { backgroundColor: colors.background }, contentStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.body, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
