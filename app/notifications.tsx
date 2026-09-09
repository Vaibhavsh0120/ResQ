import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CloudRain as AlertIcon, ShieldCheck, Users } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem, NotificationKind } from '@/types';

const KIND_ICONS: Record<NotificationKind, React.ComponentType<{ size?: number; color?: string }>> = {
  alert: AlertIcon,
  family: Users,
  readiness: ShieldCheck,
  system: Bell,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const { colors } = useAppTheme();
  const { notifications, loading, error, refresh, markRead, markAllRead, unreadCount } = useNotifications();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Notifications" onBack={() => router.back()} />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>{unreadCount > 0 ? `${unreadCount} UNREAD` : 'ALL CAUGHT UP'}</Eyebrow>
          <View style={styles.introRow}>
            <Text style={[styles.h1, { color: colors.foreground }]}>Alerts & updates</Text>
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} hitSlop={8}>
                <Text style={[styles.markAllText, { color: colors.brand }]}>Mark all read</Text>
              </Pressable>
            )}
          </View>
        </View>

        {loading && <LoadingState label="Loading your notifications..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && (notifications ?? []).length === 0 && (
          <View style={styles.empty}>
            <Bell size={28} color={colors.inkMuted} />
            <Text style={[styles.emptyText, { color: colors.inkMuted }]}>Nothing here yet. We'll let you know when something needs your attention.</Text>
          </View>
        )}

        {!loading && !error && (notifications ?? []).length > 0 && (
          <View style={styles.list}>
            {(notifications ?? []).map((item) => (
              <NotificationRow key={item.id} item={item} onPress={() => !item.read && markRead(item.id)} />
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const { colors } = useAppTheme();
  const Icon = KIND_ICONS[item.kind];

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { borderColor: colors.line, backgroundColor: item.read ? colors.surface : colors.brandSoft },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSoft }]}>
        <Icon size={17} color={colors.brand} />
      </View>
      <View style={styles.flex}>
        <View style={styles.rowTitleRow}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
          {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.brand }]} />}
        </View>
        <Text style={[styles.rowBody, { color: colors.inkMuted }]}>{item.body}</Text>
        <Text style={[styles.rowTime, { color: colors.inkMuted }]}>{timeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 18 },
  introRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.7 },
  markAllText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12, paddingHorizontal: 20 },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.lg },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTitle: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  unreadDot: { width: 6, height: 6, borderRadius: 3 },
  rowBody: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  rowTime: { fontSize: 9, marginTop: 6 },
});
