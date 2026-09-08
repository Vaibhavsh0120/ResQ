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

export const TabButton = React.forwardRef<View, TabButtonProps>(({ icon: Icon, label, isFocused, onPress, style: _incomingStyle, ...rest }, ref) => {
  const { colors } = useAppTheme();
  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        tabHaptic();
        onPress?.(e);
      }}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      {...rest}
      // `style` is applied AFTER `{...rest}`, matching Expo's own reference
      // TabButton implementation (docs.expo.dev/router/advanced/custom-tabs)
      // exactly — deliberately discarding whatever `style` TabTrigger's
      // Slot forwards through `rest`, rather than trying to merge it.
      // Previously `style` was spread BEFORE `{...rest}` here, so
      // TabTrigger's own forwarded style silently overwrote this
      // component's entire layout, including the `flexDirection: 'column'`
      // meant to stack the icon above the label — that's what actually
      // caused the icon and label to render side by side instead of
      // stacked, no matter what was set in `styles.tab`.
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
    >
      <View style={[styles.iconPill, isFocused && { backgroundColor: colors.brandSoft }]}>
        <Icon size={24} color={isFocused ? colors.brand : colors.inkFaint} />
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

export const ReportTabButton = React.forwardRef<View, TabTriggerSlotProps>(({ isFocused, onPress, style: _incomingStyle, ...rest }, ref) => {
  const { colors } = useAppTheme();
  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        tabHaptic();
        onPress?.(e);
      }}
      accessibilityLabel="Report an incident"
      accessibilityRole="button"
      {...rest}
      // See the identical comment in TabButton above — style is applied
      // after `{...rest}` so it always wins, matching Expo's own reference
      // TabButton pattern.
      style={({ pressed }) => [styles.reportTab, pressed && styles.reportTabPressed]}
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
        <AlertTriangle size={26} color={colors.onBrand} />
      </View>
      <Text style={[styles.tabLabel, { color: colors.inkFaint }]}>Report</Text>
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
    // Explicit rather than relying on RN's column default — icon pill on
    // top, label underneath.
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconPill: {
    width: 44,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTab: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    // Matches the regular tabs' `gap: 3` from icon to label exactly — this
    // was previously `gap: 5` plus an extra `marginTop: 1` on the label
    // (6px total), which is why the Report label sat visibly further from
    // its icon than every other tab's label despite looking like "the same
    // gap" in the layout. Now identical.
    gap: 3,
    // Raises this tab's own stacking order above its row siblings so the
    // popped-up circle (marginTop below) never renders underneath, and is
    // never obscured by, a neighboring tab's touch target.
    zIndex: 2,
  },
  reportTabPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  reportButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    // Previously -26, which popped the circle far enough above the bar's
    // top edge to overlap page content sitting just above the tab bar
    // (cards, list rows) on shorter screens. -18 keeps the raised-button
    // look while keeping the circle's top edge inside the bar's own
    // padding, not spilling past it.
    marginTop: -18,
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
});
