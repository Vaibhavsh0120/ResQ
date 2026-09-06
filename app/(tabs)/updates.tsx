import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Activity, Bell, CarFront, ChevronRight, CloudRain, HomeIcon, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { IconButton } from '@/components/IconButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useUpdates } from '@/hooks/useUpdates';
import { UpdateTone } from '@/types';

const ICONS = { CloudRain, Home: HomeIcon, CarFront };

export default function Updates() {
  const { colors } = useAppTheme();
  const { data: updates, loading, error, refresh } = useUpdates();
  const [justRefreshed, setJustRefreshed] = useState(false);

  const onRefresh = () => {
    refresh();
    setJustRefreshed(true);
  };

  const toneColor = (tone: UpdateTone) =>
    tone === 'warning' ? colors.warning : tone === 'success' ? colors.brand : colors.danger;
  const toneBg = (tone: UpdateTone) =>
    tone === 'warning' ? colors.warningSoft : tone === 'success' ? colors.brandSoft : colors.dangerSoft;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="Live updates"
        showProfile
        onProfilePress={() => router.push('/profile')}
        action={
          <IconButton label="Refresh updates" onPress={onRefresh} muted>
            <Activity size={18} color={colors.inkMuted} />
          </IconButton>
        }
      />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>STAY IN THE KNOW</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>What&apos;s happening nearby.</Text>
          <Text style={[styles.introSub, { color: colors.inkMuted }]}>
            Trusted updates and community signals for Riverside district.
          </Text>
        </View>

        <View style={[styles.statusRow, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
          <View style={[styles.liveDot, { backgroundColor: justRefreshed ? colors.blue : colors.brand }]} />
          <Text style={[styles.statusText, { color: colors.brand }]}>
            {justRefreshed ? 'Just refreshed' : 'Live coverage active'}
          </Text>
          <Text style={[styles.statusSub, { color: colors.inkMuted }]}>Riverside district</Text>
        </View>

        {loading && <LoadingState label="Fetching the latest updates..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && (
          <View style={styles.list}>
            {(updates ?? []).map(({ id, title, detail, tone, iconName }) => {
              const Icon = ICONS[iconName];
              return (
                <Pressable
                  key={id}
                  onPress={() => router.push({ pathname: '/update-detail', params: { id } })}
                  style={[styles.card, { borderColor: colors.line, backgroundColor: colors.surface }]}
                >
                  <View style={[styles.cardIcon, { backgroundColor: toneBg(tone) }]}>
                    <Icon size={18} color={toneColor(tone)} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
                    <Text style={[styles.cardDetail, { color: colors.inkMuted }]}>{detail}</Text>
                    <Text style={[styles.cardBody, { color: colors.inkMuted }]}>
                      Read the latest details and decide what feels right for you.
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.inkMuted} />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.sectionHeading}>
          <Eyebrow>PREPAREDNESS</Eyebrow>
          <Text style={[styles.h2, { color: colors.foreground }]}>Small things help</Text>
        </View>

        <View style={styles.topicGrid}>
          <Pressable
            onPress={() => router.push('/readiness')}
            style={[styles.topicCard, { borderColor: colors.line, backgroundColor: colors.surface }]}
          >
            <ShieldCheck size={19} color={colors.brand} />
            <Text style={[styles.topicTitle, { color: colors.foreground }]}>Review your plan</Text>
            <Text style={[styles.topicSubtitle, { color: colors.inkMuted }]}>2 min check-in</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/alert-preferences')}
            style={[styles.topicCard, { borderColor: colors.line, backgroundColor: colors.surface }]}
          >
            <Bell size={19} color={colors.brand} />
            <Text style={[styles.topicTitle, { color: colors.foreground }]}>Alert preferences</Text>
            <Text style={[styles.topicSubtitle, { color: colors.inkMuted }]}>Choose what matters</Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 20 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  introSub: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusSub: { fontSize: 10, marginLeft: 'auto' },
  list: { gap: 9 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 13,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  cardIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '700' },
  cardDetail: { fontSize: 10, marginTop: 4 },
  cardBody: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  sectionHeading: { marginTop: 26, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  topicGrid: { flexDirection: 'row', gap: 9 },
  topicCard: { flex: 1, minHeight: 110, padding: 15, borderWidth: 1, borderRadius: radius.lg, justifyContent: 'flex-end' },
  topicTitle: { fontSize: 13, fontWeight: '700', marginTop: 10 },
  topicSubtitle: { fontSize: 10, marginTop: 4 },
});
