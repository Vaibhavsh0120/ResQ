import React from 'react';
import { TabTriggerSlotProps } from 'expo-router/ui';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { AlertTriangle } from '@/components/icons';

// These are safe to keep in their own file: TabTrigger's `asChild` merges
// focus/press props into whatever component it wraps via Radix's `Slot`,
// which is a runtime prop-merge, not part of expo-router's static
// route-discovery tree-walk. Only the <Tabs>/<TabList>/<TabTrigger>
// structure itself is discovery-sensitive — see the comment in
// app/(tabs)/_layout.tsx for why that part must stay inline there.

/** Light tap on every tab switch — no-ops on web, where Haptics isn't supported. */
function tabHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}

export type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
};

export const TabButton = React.forwardRef<View, TabButtonProps>(({ icon: Icon, label, isFocused, onPress, ...rest }, ref) => {
  const { colors } = useAppTheme();
  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        tabHaptic();
        onPress?.(e);
      }}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      {...rest}
    >
      <View style={[styles.iconPill, isFocused && { backgroundColor: colors.brandSoft }]}>
        <Icon size={20} color={isFocused ? colors.brand : colors.inkFaint} />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.brand : colors.inkFaint },
          isFocused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});
TabButton.displayName = 'TabButton';

export const ReportTabButton = React.forwardRef<View, TabTriggerSlotProps>(({ isFocused, onPress, ...rest }, ref) => {
  const { colors } = useAppTheme();
  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        tabHaptic();
        onPress?.(e);
      }}
      style={({ pressed }) => [styles.reportTab, pressed && styles.reportTabPressed]}
      accessibilityLabel="Report an incident"
      accessibilityRole="button"
      {...rest}
    >
      <View
        style={[
          styles.reportButton,
          {
            backgroundColor: colors.brandDeep,
            borderColor: colors.surface,
            shadowColor: colors.shadowBrand,
          },
        ]}
      >
        <AlertTriangle size={22} color={colors.onBrand} />
      </View>
      <Text style={[styles.tabLabel, styles.reportLabel, { color: colors.inkFaint }]}>Report</Text>
    </Pressable>
  );
});
ReportTabButton.displayName = 'ReportTabButton';

export const tabBarStyles = StyleSheet.create({
  bar: {
    minHeight: 64,
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingTop: 9,
    paddingBottom: 9,
  },
  barShadowIOS: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 22,
  },
  barShadowAndroid: {
    elevation: 12,
  },
  // Sits behind the TabTriggers as the first child of <TabList> — clips the
  // BlurView to the bar's rounded corners without putting `overflow:
  // hidden` on the bar itself, which would also clip the iOS shadow above.
  //
  // NOTE: this used to spread `StyleSheet.absoluteFillObject`, which does
  // not exist in this RN version (0.86 only exports `absoluteFill`,
  // confirmed against node_modules/react-native's own type defs) — spreading
  // `undefined` is a silent no-op in JS, so these two styles previously
  // carried no absolute positioning at all. Fixed to spread the real API.
  blurClip: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  blurFill: {
    ...StyleSheet.absoluteFill,
  },
});

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    minHeight: 46,
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconPill: {
    width: 40,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTab: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  reportTabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  reportButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  reportLabel: {
    marginTop: 1,
  },
});
