import React from 'react';
import { TabList, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { AlertTriangle, Activity, HomeIcon, MapPin, Users } from '@/components/icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { useNavVisibility } from '@/context/NavVisibilityContext';

// Built on expo-router/ui's headless tabs — Expo's current recommended way
// to build a fully custom tab bar as of SDK 56+ (expo-router no longer
// supports importing @react-navigation/* directly in app code, which the
// older <Tabs tabBar={render-prop}> pattern relied on internally).
//
// Structural requirement: <Tabs>'s route-discovery walks its JSX tree
// looking for <TabTrigger> elements, but only descends through <Fragment>
// and <TabList> wrappers — any other component (a plain <View>, a custom
// component) stops that walk. So every <TabTrigger> below must be a direct
// child of <TabList>; the visual styling instead happens via each
// TabTrigger's `asChild`, which hands focus/press state to our own
// component (TabButton / ReportTabButton) using Radix's <Slot />.

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  index: HomeIcon,
  updates: Activity,
  family: Users,
  safe: MapPin,
};

const LABELS: Record<string, string> = {
  index: 'Home',
  updates: 'Updates',
  family: 'Family',
  safe: 'Places',
};

export function BottomTabBar() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { hideTabBar } = useNavVisibility();

  if (hideTabBar) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
      <TabList
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.line,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon={ICONS.index} label={LABELS.index} />
        </TabTrigger>
        <TabTrigger name="updates" href="/updates" asChild>
          <TabButton icon={ICONS.updates} label={LABELS.updates} />
        </TabTrigger>
        <TabTrigger name="report" href="/report" asChild>
          <ReportTabButton />
        </TabTrigger>
        <TabTrigger name="family" href="/family" asChild>
          <TabButton icon={ICONS.family} label={LABELS.family} />
        </TabTrigger>
        <TabTrigger name="safe" href="/safe" asChild>
          <TabButton icon={ICONS.safe} label={LABELS.safe} />
        </TabTrigger>
      </TabList>
    </View>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
};

const TabButton = React.forwardRef<View, TabButtonProps>(({ icon: Icon, label, isFocused, onPress, ...rest }, ref) => {
  const { colors } = useAppTheme();
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      style={[styles.tab, isFocused && { backgroundColor: colors.brandSoft }]}
      accessibilityLabel={label}
      accessibilityState={isFocused ? { selected: true } : {}}
      {...rest}
    >
      <Icon size={19} color={isFocused ? colors.brand : colors.inkMuted} />
      <Text style={[styles.tabLabel, { color: isFocused ? colors.brand : colors.inkMuted }]}>{label}</Text>
    </Pressable>
  );
});
TabButton.displayName = 'TabButton';

const ReportTabButton = React.forwardRef<View, TabTriggerSlotProps>(({ isFocused, onPress, ...rest }, ref) => {
  const { colors } = useAppTheme();
  return (
    <Pressable ref={ref} onPress={onPress} style={styles.reportTab} accessibilityLabel="Report an incident" {...rest}>
      <View style={[styles.reportButton, { backgroundColor: colors.brandDeep, borderColor: colors.surface }]}>
        <AlertTriangle size={19} color={colors.onBrand} />
      </View>
      <Text style={[styles.tabLabel, { color: colors.inkMuted }]}>Report</Text>
    </Pressable>
  );
});
ReportTabButton.displayName = 'ReportTabButton';

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  bar: {
    minHeight: 66,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 7,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tab: {
    flex: 1,
    minHeight: 49,
    minWidth: 45,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 17,
  },
  reportTab: {
    flex: 1,
    minHeight: 49,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
});
