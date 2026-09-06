import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  Check,
  ChevronRight,
  Info,
  LockKeyhole,
  LogIn,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useHideTabBar } from '@/context/useHideTabBar';
import { useProfile } from '@/hooks/useProfile';
import { ProfileData } from '@/types';
import { mockProfile } from '@/data/mockProfile';

export default function Profile() {
  useHideTabBar();
  const { colors, isDark, setIsDark } = useAppTheme();
  const { profile, loading, error, refresh, save, saving } = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(mockProfile);

  useEffect(() => {
    if (profile) setDraft(profile);
  }, [profile]);

  const update = (key: keyof ProfileData, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const onSave = async () => {
    const result = await save(draft);
    if (result) setEditing(false);
  };

  const displayed = profile ?? mockProfile;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Profile" onBack={() => router.back()} />
      <Screen>
        {loading && <LoadingState label="Loading your profile..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: colors.brandDeep, shadowColor: colors.shadowBrand }]}>
            <Text style={[styles.avatarText, { color: colors.onBrand }]}>AC</Text>
          </View>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{displayed.name}</Text>
          <Text style={[styles.heroEmail, { color: colors.inkMuted }]}>{displayed.email}</Text>
          <View style={[styles.badge, { backgroundColor: colors.brandSoft }]}>
            <ShieldCheck size={14} color={colors.brand} />
            <Text style={[styles.badgeText, { color: colors.brand }]}>Verified profile</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <PrimaryButton
            title={editing ? 'Editing profile' : 'Edit profile'}
            variant="outline"
            style={styles.flex}
            onPress={() => {
              setDraft(displayed);
              setEditing(true);
            }}
          />
          {editing && (
            <PrimaryButton
              title="Save"
              style={styles.flex}
              icon={<Check size={15} color={colors.onBrand} />}
              onPress={onSave}
              loading={saving}
            />
          )}
        </View>

        {editing ? (
          <View style={styles.formStack}>
            <FormField label="Full name" value={draft.name} onChangeText={(v) => update('name', v)} />
            <FormField label="Email address" value={draft.email} onChangeText={(v) => update('email', v)} />
            <FormField label="Phone number" value={draft.phone} onChangeText={(v) => update('phone', v)} />
            <FormField label="Home area" value={draft.location} onChangeText={(v) => update('location', v)} />
            <FormField label="Emergency note" value={draft.note} onChangeText={(v) => update('note', v)} multiline />
          </View>
        ) : (
          <View style={styles.detailsStack}>
            <DetailRow icon={<Phone size={17} color={colors.foreground} />} title={displayed.phone} subtitle="Emergency contact number" />
            <DetailRow icon={<MapPin size={17} color={colors.foreground} />} title={displayed.location} subtitle="Primary location" />
            <DetailRow icon={<Info size={17} color={colors.foreground} />} title="Emergency note" subtitle={displayed.note} />
          </View>
        )}

        <View style={styles.statsRow}>
          <StatCard value="82%" label="Readiness" />
          <StatCard value="3" label="People" />
          <StatCard value="4" label="Guides read" />
        </View>

        <View style={styles.settingsList}>
          <SettingsRow
            icon={<Users size={18} color={colors.foreground} />}
            title="My people"
            subtitle="Manage your safety circle"
            trailing={<ChevronRight size={17} color={colors.inkMuted} />}
            onPress={() => router.push('/(tabs)/family')}
          />
          <SettingsRow icon={<Bell size={18} color={colors.foreground} />} title="Notifications" subtitle="Alerts and check-in reminders" trailing={<Toggle on />} onPress={() => router.push('/alert-preferences')} />
          <SettingsRow
            icon={<Sparkles size={18} color={colors.foreground} />}
            title={isDark ? 'Dark mode' : 'Light mode'}
            subtitle="Neutral appearance for ResQ"
            trailing={<Toggle on={isDark} />}
            onPress={() => setIsDark(!isDark)}
          />
          <SettingsRow
            icon={<LockKeyhole size={18} color={colors.foreground} />}
            title="Privacy & security"
            subtitle="Your data, your control"
            trailing={<ChevronRight size={17} color={colors.inkMuted} />}
            onPress={() => router.push('/privacy-security')}
          />
        </View>

        <Pressable
          onPress={() => router.replace('/login')}
          style={[styles.signOut, { backgroundColor: colors.dangerSoft }]}
        >
          <LogIn size={17} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>Sign out</Text>
        </Pressable>
      </Screen>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[
          multiline ? styles.textarea : styles.input,
          { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft },
        ]}
      />
    </View>
  );
}

function DetailRow({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.detailRow, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.brandSoft }]}>{icon}</View>
      <View style={styles.flex}>
        <Text style={[styles.detailTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.detailSubtitle, { color: colors.inkMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surfaceSoft }]}>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.inkMuted }]}>{label}</Text>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
  onPress?: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} style={[styles.settingsRow, { borderColor: colors.line, backgroundColor: colors.surface }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.brandSoft }]}>{icon}</View>
      <View style={styles.flex}>
        <Text style={[styles.settingsTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingsSubtitle, { color: colors.inkMuted }]}>{subtitle}</Text>
      </View>
      {trailing}
    </Pressable>
  );
}

function Toggle({ on }: { on: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.toggleTrack, { backgroundColor: on ? colors.brand : colors.line }]}>
      <View style={[styles.toggleThumb, { backgroundColor: colors.controlThumb }, on && styles.toggleThumbOn]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  heroEmail: { fontSize: 11, marginTop: 5, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  formStack: { gap: 12, marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.sm, fontSize: 13 },
  textarea: { minHeight: 70, padding: 12, borderWidth: 1, borderRadius: radius.sm, fontSize: 13, textAlignVertical: 'top' },
  detailsStack: { gap: 8, marginBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderWidth: 1, borderRadius: radius.md },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 12, fontWeight: '700' },
  detailSubtitle: { fontSize: 10, marginTop: 3, lineHeight: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.lg },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, marginTop: 4 },
  settingsList: { gap: 8, marginBottom: 8 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md },
  settingsTitle: { fontSize: 12, fontWeight: '700' },
  settingsSubtitle: { fontSize: 10, marginTop: 3 },
  toggleTrack: { width: 30, height: 18, borderRadius: radius.pill, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'white' },
  toggleThumbOn: { marginLeft: 12 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    marginTop: 22,
    borderRadius: radius.md,
  },
  signOutText: { fontSize: 12, fontWeight: '700' },
});
