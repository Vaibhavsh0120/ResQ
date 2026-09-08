import React from 'react';
import { ArrowLeft, Bell } from '@/components/icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { IconButton } from './IconButton';
import { Logo } from './Logo';

// Height of the actual title/avatar/action row, excluding the safe-area
// inset. The header's total height is this plus insets.top (see below) —
// previously the header had a *fixed* `height: 60` while also adding
// `paddingTop: insets.top + 10`, so on any device with a tall top inset
// (notch / Dynamic Island, ~47-59pt) the padding alone could approach or
// exceed the fixed height, squeezing or clipping the content row up
// against/behind the status bar. Height is now derived from the same
// insets.top value the padding uses, so it always has room.
const HEADER_CONTENT_HEIGHT = 50;

type Props = {
  title?: string;
  /** Show the profile avatar button on the left (used by every primary tab screen). */
  showProfile?: boolean;
  onProfilePress?: () => void;
  /** Show a back arrow on the left instead (used only by screens reached by drilling in). */
  onBack?: () => void;
  action?: React.ReactNode;
  initials?: string;
};

export function Header({ title, showProfile = false, onProfilePress, onBack, action, initials = 'AC' }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { height: insets.top + HEADER_CONTENT_HEIGHT }]}>
      {showProfile ? (
        <Pressable
          accessibilityLabel="Open profile"
          accessibilityRole="button"
          onPress={onProfilePress}
          style={[styles.avatarButton, { backgroundColor: colors.brandDeep }]}
          hitSlop={4}
        >
          <Text style={[styles.avatarText, { color: colors.onBrand }]}>{initials}</Text>
        </Pressable>
      ) : onBack ? (
        <IconButton label="Go back" onPress={onBack}>
          <ArrowLeft size={20} color={colors.foreground} />
        </IconButton>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.titleWrap}>
        {title ? (
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <Logo compact />
        )}
      </View>

      {action ?? (
        <IconButton label="Notifications" onPress={() => {}} muted>
          <Bell size={18} color={colors.inkMuted} />
        </IconButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    // Bottom padding gives the content row breathing room above the
    // screen content below; top space is entirely the safe-area inset
    // baked into `height` above, so content always sits below the notch/
    // Dynamic Island regardless of device.
    paddingBottom: 10,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '800',
  },
  spacer: {
    width: 36,
    height: 36,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
