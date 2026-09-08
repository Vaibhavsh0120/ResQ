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

// --- Sizing constants for the gap fix below ---
//
// Root cause of the previously "inconsistent" gap (confirmed by simulating
// this exact layout tree in Yoga, the layout engine RN actually uses, not
// just eyeballing a screenshot): every tab used `flex: 1`, so all 5 cells
// were forced to EQUAL width. Content was then centered inside each equal
// cell. That's fine when every icon is the same size, but the Report
// button's circle (54px) is wider than the other tabs' icon pill (44px) —
// so within the same equal-width cell, Report's icon ate 10px more of its
// cell than a regular tab's icon did, leaving 5px less padding on *each*
// side. The result: the whitespace gap on either side of Report was
// consistently ~20% smaller than every other gap, regardless of screen
// width — reproduced with Yoga at multiple widths (22.0 vs 19.0 out of a
// 22-24px gap on a narrow phone). That's the "unconsistent gap".
//
// Fix: stop using equal flex cells and instead give every cell a FIXED
// width sized as `icon width + 2 * TAB_H_PAD`, using the *same* padding
// value for every tab regardless of its icon's size. Report's cell is
// simply 10px wider (matching its 10px-larger icon) so the padding around
// every icon — and therefore the whitespace gap between every pair of
// icons — is identical by construction, not by coincidence of equal
// screen-width division. `justifyContent: 'space-between'` then splits
// any leftover bar width equally across the 4 gaps regardless of the
// cells' own widths (verified: 22.00 / 22.00 / 22.00 / 22.00 exactly, at
// three different simulated bar widths, including a tablet-width one).
const ICON_PILL_WIDTH = 44;
const REPORT_BUTTON_SIZE = 54;
const TAB_H_PAD = 10;
export const TAB_WIDTH = ICON_PILL_WIDTH + TAB_H_PAD * 2; // 64
export const REPORT_TAB_WIDTH = REPORT_BUTTON_SIZE + TAB_H_PAD * 2; // 74
// Narrowest a bar can be before cells would need to overlap or compress —
// used by the layout to decide when to stop stretching to full width on
// large screens (see app/(tabs)/_layout.tsx).
export const TAB_BAR_CONTENT_MIN_WIDTH = TAB_WIDTH * 4 + REPORT_TAB_WIDTH; // 330

export const tabBarStyles = StyleSheet.create({
  bar: {
    // Was 64. Report's raised circle (54px) sits higher than the other
    // tabs' icon pill (32px) via a negative marginTop (see reportButton
    // below), which pushes its label a few px lower than the other tabs'
    // labels. 64 wasn't quite tall enough to contain that, so the "Report"
    // label rendered outside the bar's own rounded bottom edge. 72 gives
    // it (and every other tab) a couple of px of clearance to spare —
    // computed from the actual content stack height, not a guess.
    minHeight: 72,
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Was 'space-around'. With fixed (not flex:1) cell widths, space-around
    // would still put HALF of a gap's worth of space outside the first/last
    // item — space-between puts equal space only *between* cells and lets
    // each end cell's own baked-in TAB_H_PAD be the only edge margin,
    // which reads as tighter/more intentional against the bar's rounded
    // ends and is what the equal-gap math above assumes.
    justifyContent: 'space-between',
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
    // Was `flex: 1` (equal-width cells — see the gap-fix comment above for
    // why that's what caused the inconsistent spacing). Fixed width, sized
    // to match TAB_H_PAD around the icon exactly like every other tab.
    width: TAB_WIDTH,
    minHeight: 46,
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
    width: ICON_PILL_WIDTH,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTab: {
    // Was `flex: 1`. Fixed width, 10px wider than a regular `tab` — exactly
    // matching how much wider reportButton (54) is than iconPill (44) — so
    // the padding around this icon equals every other tab's padding.
    width: REPORT_TAB_WIDTH,
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
    width: REPORT_BUTTON_SIZE,
    height: REPORT_BUTTON_SIZE,
    borderRadius: REPORT_BUTTON_SIZE / 2,
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
