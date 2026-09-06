import React from 'react';
import { ArrowLeft, Bell } from '@/components/icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { IconButton } from './IconButton';
import { Logo } from './Logo';

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
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
