import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  AlertTriangle,
  ChevronRight,
  LifeBuoy,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Users,
} from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { useReadiness } from '@/hooks/useReadiness';
import { useFamily } from '@/hooks/useFamily';
import { useAuth } from '@/context/AuthContext';
import { timeOfDayGreeting, todayEyebrow } from '@/utils/format';

export default function Home() {
  const { colors } = useAppTheme();
  const { data: readiness } = useReadiness();
  const { members } = useFamily();
  const { user } = useAuth();

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `${timeOfDayGreeting()}, ${firstName}` : timeOfDayGreeting();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header showProfile onProfilePress={() => router.push('/profile')} />
      <Screen>
        <View style={styles.greeting}>
          <View>
            <Eyebrow>{todayEyebrow()}</Eyebrow>
            <Text style={[styles.h1, { color: colors.foreground }]}>{greeting}</Text>
          </View>
        </View>

        {/* SOS: the single highest-priority control in the app (PROGRESS.md
            §2.4/§7) — deliberately placed above the readiness card, not
            buried in a menu or folded into the quick-actions grid where
            it'd read as just another equal-weight option. router.push (not
            replace) so the Home screen is still underneath in history —
            backing out of SOS should return here, not to some other tab. */}
        <Pressable
          onPress={() => router.push('/sos')}
          style={({ pressed }) => [
            styles.sosBar,
            { backgroundColor: colors.danger, shadowColor: colors.shadowStrong },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open emergency SOS"
        >
          <View style={[styles.sosIcon, { backgroundColor: colors.onBrandOverlaySoft }]}>
            <LifeBuoy size={20} color={colors.onDanger} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.sosTitle, { color: colors.onDanger }]}>Emergency SOS</Text>
            <Text style={[styles.sosSubtitle, { color: colors.onDanger }]}>Tap to alert your contacts &amp; call 112</Text>
          </View>
          <ChevronRight size={18} color={colors.onDanger} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/readiness')}
          style={({ pressed }) => [
            styles.heroCard,
            { backgroundColor: colors.brandDeep, shadowColor: colors.shadowBrand },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="View your readiness details"
        >
          <View style={styles.heroCopy}>
            <Eyebrow light>YOUR READINESS</Eyebrow>
            <Text style={[styles.heroHeading, { color: colors.onBrand }]}>
              {readiness?.headline ?? "You're in a good place."}
            </Text>
            <Text style={[styles.heroSub, { color: colors.onBrandMuted }]}>
              {readiness?.subtext ?? 'Your essentials are up to date.'}
            </Text>
          </View>
          <View
            style={[
              styles.readinessRing,
              { borderColor: colors.onBrandHairline, borderTopColor: colors.mapPinRing, borderRightColor: colors.mapPinRing },
            ]}
          >
            <Text style={[styles.readinessNumber, { color: colors.onBrand }]}>{readiness?.score ?? '--'}</Text>
            <Text style={[styles.readinessPercent, { color: colors.onBrand }]}>%</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/chat')}
          style={[styles.composer, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}
        >
          <View style={[styles.chatOrb, { backgroundColor: colors.brandSoft }]}>
            <Sparkles size={18} color={colors.brand} />
          </View>
          <Text style={[styles.composerCopy, { color: colors.inkMuted }]}>Ask ResQ anything...</Text>
          <View style={[styles.composerSend, { backgroundColor: colors.brandDeep }]}>
            <Send size={15} color={colors.onBrand} />
          </View>
        </Pressable>

        <View style={styles.sectionHeading}>
          <View>
            <Eyebrow>QUICK ACTIONS</Eyebrow>
            <Text style={[styles.h2, { color: colors.foreground }]}>What do you need?</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/updates')} hitSlop={8}>
            <View style={styles.seeAll}>
              <Text style={[styles.linkText, { color: colors.brand }]}>See all</Text>
              <ChevronRight size={15} color={colors.brand} />
            </View>
          </Pressable>
        </View>

        <View style={styles.actionGrid}>
          <ActionCard
            onPress={() => router.push('/(tabs)/report')}
            iconBg={colors.dangerSoft}
            iconColor={colors.danger}
            icon={<AlertTriangle size={19} color={colors.danger} />}
            title="Report an incident"
            subtitle="Share what's happening"
          />
          <ActionCard
            onPress={() => router.push('/(tabs)/safe')}
            iconBg={colors.brandSoft}
            iconColor={colors.brand}
            icon={<MapPin size={19} color={colors.brand} />}
            title="Find safe places"
            subtitle="Nearby support and shelter"
          />
          <ActionCard
            onPress={() => router.push('/(tabs)/family')}
            iconBg={colors.blueSoft}
            iconColor={colors.blue}
            icon={<Users size={19} color={colors.blue} />}
            title="Check on family"
            subtitle={familyCircleSubtitle(members?.length)}
          />
          <ActionCard
            onPress={() => router.push('/chat')}
            iconBg={colors.purpleSoft}
            iconColor={colors.purple}
            icon={<MessageCircle size={19} color={colors.purple} />}
            title="Ask ResQ"
            subtitle="Get calm, clear guidance"
          />
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/family')}
          style={[styles.insightCard, { backgroundColor: colors.surfaceSoft }]}
        >
          <View style={[styles.insightIcon, { backgroundColor: colors.brandSoft }]}>
            <Sparkles size={17} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.insightTitle, { color: colors.foreground }]}>
              A little preparation goes a long way.
            </Text>
            <Text style={[styles.insightSubtitle, { color: colors.inkMuted }]}>
              Review your emergency contacts today.
            </Text>
          </View>
          <ChevronRight size={17} color={colors.inkMuted} />
        </Pressable>
      </Screen>
    </View>
  );
}

function familyCircleSubtitle(count: number | undefined): string {
  if (count == null) return 'Loading your circle...';
  if (count === 0) return 'Add your first contact';
  if (count === 1) return '1 person in your circle';
  return `${count} people in your circle`;
}

function ActionCard({
  onPress,
  iconBg,
  iconColor,
  icon,
  title,
  subtitle,
}: {
  onPress: () => void;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        { borderColor: colors.line, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: colors.inkMuted }]}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 18,
  },
  h1: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 6,
    maxWidth: '100%',
  },
  h2: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  sosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radius.lg,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
  },
  sosIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sosSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    padding: 20,
    minHeight: 130,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 6,
  },
  heroCopy: {
    flex: 1,
  },
  heroHeading: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 10,
    marginBottom: 8,
  },
  heroHeadingStrong: {
    fontWeight: '800',
  },
  heroSub: {
    fontSize: 12,
  },
  readinessRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-22deg' }],
  },
  readinessNumber: {
    fontSize: 20,
    fontWeight: '800',
    transform: [{ rotate: '22deg' }],
  },
  readinessPercent: {
    fontSize: 10,
    transform: [{ rotate: '22deg' }],
    marginTop: -2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 9,
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 17,
  },
  chatOrb: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerCopy: {
    flex: 1,
    fontSize: 12,
  },
  composerSend: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
    marginBottom: 14,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    minHeight: 126,
    padding: 15,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 15,
  },
  actionSubtitle: {
    fontSize: 11,
    marginTop: 5,
    lineHeight: 15,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginTop: 16,
    padding: 13,
    borderRadius: 15,
  },
  insightIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
});
