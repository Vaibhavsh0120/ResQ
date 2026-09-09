import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LifeBuoy, Phone, Users } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useSosHistory } from '@/hooks/useSosHistory';
import { SosEvent } from '@/types';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Local SOS activation log — reached from Profile (see app/profile.tsx).
 * Purely on-device today (see sosService.ts); there's no backend to sync
 * this against yet, so this is the full and only record of past SOS use.
 */
export default function SosHistory() {
  const { colors } = useAppTheme();
  const { events, loading, error, refresh } = useSosHistory();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="SOS history" onBack={() => router.back()} />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>YOUR ACTIVATIONS</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>Past SOS alerts</Text>
          <Text style={[styles.h1Sub, { color: colors.inkMuted }]}>
            Stored only on this device — there's no server copy yet.
          </Text>
        </View>

        {loading && <LoadingState label="Loading your SOS history..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && (events ?? []).length === 0 && (
          <View style={styles.empty}>
            <LifeBuoy size={28} color={colors.inkMuted} />
            <Text style={[styles.emptyText, { color: colors.inkMuted }]}>
              You haven't activated SOS yet. When you do, it'll show up here.
            </Text>
          </View>
        )}

        {!loading && !error && (events ?? []).length > 0 && (
          <View style={styles.list}>
            {(events ?? []).map((item) => (
              <EventRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

function EventRow({ item }: { item: SosEvent }) {
  const { colors } = useAppTheme();
  const contactCount = item.contactsNotified.length;

  return (
    <View style={[styles.row, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.dangerSoft }]}>
        <LifeBuoy size={17} color={colors.danger} />
      </View>
      <View style={styles.flex}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>SOS activated</Text>
          <Text style={[styles.rowTime, { color: colors.inkMuted }]}>{formatWhen(item.triggeredAt)}</Text>
        </View>
        {item.location && <Text style={[styles.rowLocation, { color: colors.inkMuted }]}>{item.location}</Text>}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: item.calledEmergencyNumber ? colors.brandSoft : colors.surfaceSoft }]}>
            <Phone size={11} color={item.calledEmergencyNumber ? colors.brand : colors.inkFaint} />
            <Text style={[styles.badgeText, { color: item.calledEmergencyNumber ? colors.brand : colors.inkFaint }]}>
              {item.calledEmergencyNumber ? 'Called 112' : 'Not called'}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: contactCount > 0 ? colors.brandSoft : colors.surfaceSoft }]}>
            <Users size={11} color={contactCount > 0 ? colors.brand : colors.inkFaint} />
            <Text style={[styles.badgeText, { color: contactCount > 0 ? colors.brand : colors.inkFaint }]}>
              {contactCount > 0 ? `${contactCount} contact${contactCount === 1 ? '' : 's'} messaged` : 'No one messaged'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 18 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.7, marginTop: 6 },
  h1Sub: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12, paddingHorizontal: 20 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.lg },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowTime: { fontSize: 9 },
  rowLocation: { fontSize: 10, marginTop: 3 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
