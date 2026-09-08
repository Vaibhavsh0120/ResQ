import React from 'react';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { Platform, useWindowDimensions, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { useNavVisibility } from '@/context/NavVisibilityContext';
import { Activity, HomeIcon, MapPin, Users } from '@/components/icons';
import { ReportTabButton, TabButton, tabBarStyles } from '@/components/TabBarButtons';

// Same tablet/desktop content cap the rest of the app already uses
// (app/login.tsx, app/register.tsx, src/components/OnboardingLayout.tsx all
// center a maxWidth: 480/520 column on wide screens). Without this, the
// gap-fix above — which makes every gap between tabs mathematically equal —
// would still stretch those equal gaps to fill the *entire* width of an
// iPad or Mac window, e.g. ~110px between icons on a 700px-wide bar.
// Equal-but-huge isn't the goal; equal-and-reasonably-sized is.
const TAB_BAR_MAX_WIDTH = 480;

// expo-router/ui's headless tabs (Expo's current recommended way to build a
// fully custom tab bar, SDK 56+ — expo-router no longer supports importing
// @react-navigation/* directly in app code, which the older
// <Tabs tabBar={renderProp}> pattern relied on internally).
//
// IMPORTANT structural requirement, found the hard way (twice): <Tabs>
// discovers its routes by statically walking its own `children` prop with
// React's Children.forEach — on the *unrendered* element tree, before any
// component function runs. That walk only recurses into a plain <Fragment>
// or an actual <TabList> element; ANY other element type in between —
// including a plain <View> used just for absolute positioning — is opaque
// to it and silently drops every tab, throwing "Couldn't find any screens
// for the navigator." So <TabList> must be a direct child of <Tabs> (no
// wrapping <View>), and every <TabTrigger> must be a direct child of
// <TabList>. TabList itself is just a styled View under the hood
// (see expo-router/ui's TabList.js — it forwards `style` straight through),
// so the floating/absolute positioning that would normally live on a
// wrapper View goes directly on TabList's own `style` prop instead.
//
// SECOND requirement, found chasing the real runtime crash (not just a
// bundling/typecheck pass): that same Children.forEach walk runs once,
// against the *unrendered* element tree, independent of any component's
// props or state. `{!hideTabBar && <TabList>...}` conditionally omits the
// TabList element itself whenever hideTabBar is true — which is exactly
// what Profile and Chat set via useHideTabBar() the moment they gain
// focus. With zero TabTrigger children in the tree, <Tabs> throws
// "Couldn't find any screens for the navigator" — confirmed by reproducing
// it via `expo start` and navigating to Profile/Chat. Fix: TabList must
// ALWAYS be mounted; visibility is now a style concern (translateY +
// opacity + pointerEvents) applied to TabList itself, never a conditional
// render of the element.
//
// The button/icon presentation (TabButton, ReportTabButton, styles) is
// safe to keep in src/components/TabBarButtons.tsx since TabTrigger's
// `asChild` merge happens at runtime via Slot, not during this static walk.
export default function TabsLayout() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { hideTabBar } = useNavVisibility();
  const { width: windowWidth } = useWindowDimensions();
  // Distance from the bottom of the screen to the bar's bottom edge.
  // Lowered twice now on feedback that the bar should sit further down —
  // was `+ 6` originally, then `- 4`, now `- 8`. `Math.max(insets.bottom, 10)`
  // still puts a floor under this so it can't collide with the
  // home-indicator/gesture area even on a device with a very small bottom
  // inset (the floor of 10 minus 8 still leaves 2px of clearance there;
  // on any device with a real home-indicator inset — typically 34pt — this
  // leaves ~26pt of clearance, comfortably above it).
  const bottomOffset = Math.max(insets.bottom, 10) - 8;
  // On a phone this resolves to the original fixed 14 on both sides
  // (windowWidth - 28 <= 480 for every real phone, so
  // Math.min(...) always picks windowWidth - 28). On an iPad or Mac window
  // it caps the bar at TAB_BAR_MAX_WIDTH and centers it, same treatment
  // login/register/onboarding already use, so tab gaps stay a sensible
  // fixed size instead of stretching edge-to-edge on a 1000px-wide window.
  const barWidth = Math.min(windowWidth - 28, TAB_BAR_MAX_WIDTH);
  const barHorizontalInset = (windowWidth - barWidth) / 2;

  return (
    <Tabs>
      <TabSlot />
      <TabList
        style={[
          tabBarStyles.bar,
          Platform.select<ViewStyle>({ ios: tabBarStyles.barShadowIOS, android: tabBarStyles.barShadowAndroid }) ?? {},
          {
            position: 'absolute',
            left: barHorizontalInset,
            right: barHorizontalInset,
            bottom: bottomOffset,
            borderColor: colors.line,
            shadowColor: colors.shadow,
            // Android's BlurView support is inconsistent across devices, so
            // it keeps a solid surface there; iOS gets the frosted glass
            // via the BlurView + tint layer below.
            backgroundColor: Platform.OS === 'android' ? colors.surface : 'transparent',
          },
          hideTabBar
            ? { opacity: 0, transform: [{ translateY: 24 }] }
            : { opacity: 1, transform: [{ translateY: 0 }] },
        ]}
        // Keeps the bar out of the touch/focus tree while hidden, without
        // ever removing the TabList element itself (see note above).
        pointerEvents={hideTabBar ? 'none' : 'auto'}
      >
        {Platform.OS !== 'android' && (
          <>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={tabBarStyles.blurClip} />
            <View style={[tabBarStyles.blurClip, tabBarStyles.blurFill, { backgroundColor: colors.surfaceBlurTint }]} />
          </>
        )}
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon={HomeIcon} label="Home" />
        </TabTrigger>
        <TabTrigger name="updates" href="/updates" asChild>
          <TabButton icon={Activity} label="Updates" />
        </TabTrigger>
        <TabTrigger name="report" href="/report" asChild>
          <ReportTabButton />
        </TabTrigger>
        <TabTrigger name="family" href="/family" asChild>
          <TabButton icon={Users} label="Family" />
        </TabTrigger>
        <TabTrigger name="safe" href="/safe" asChild>
          <TabButton icon={MapPin} label="Places" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
