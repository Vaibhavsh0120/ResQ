import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, BellOff, ChevronRight, Clock3, Plus, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useFamily } from '@/hooks/useFamily';
import { useCurrentArea } from '@/hooks/useCurrentArea';
import { useCheckInReminder } from '@/hooks/useCheckInReminder';
import { FamilyMember } from '@/types';

const RELATION_OPTIONS = ['Partner', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

export default function Family() {
  const { colors } = useAppTheme();
  const { members, loading, error, refresh, checkIn, invite } = useFamily();
  const { area } = useCurrentArea();
  const { enabled: reminderEnabled, permissionDenied: reminderDenied, toggle: toggleReminder } = useCheckInReminder();
  const [addingOpen, setAddingOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const list = members ?? [];
  const safeCount = list.filter((p) => p.tone === 'success').length;
  const statusColor = (tone: FamilyMember['tone']) => (tone === 'success' ? colors.brand : colors.warning);

  const canSendInvite = newName.trim().length > 0 && newRelation.trim().length > 0;

  const sendInvite = async () => {
    if (!canSendInvite) return;
    setInviting(true);
    await invite(newName.trim(), newRelation.trim(), newPhone.trim() || undefined);
    setInviting(false);
    setAddingOpen(false);
    setNewName('');
    setNewRelation('');
    setNewPhone('');
  };

  const cancelAdding = () => {
    setAddingOpen(false);
    setNewName('');
    setNewRelation('');
    setNewPhone('');
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="My family"
        showProfile
        onProfilePress={() => router.push('/profile')}
        action={
          <IconButton label="Add person" onPress={() => setAddingOpen(true)} muted>
            <Plus size={18} color={colors.inkMuted} />
          </IconButton>
        }
      />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>YOUR SAFETY CIRCLE</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>Everyone connected.</Text>
          <Text style={[styles.introSub, { color: colors.inkMuted }]}>
            One calm place to check in, share plans, and stay close.
          </Text>
        </View>

        {loading && <LoadingState label="Checking on your circle..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.brandSoft }]}>
                  <ShieldCheck size={19} color={colors.brand} />
                </View>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {safeCount} of {list.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.inkMuted }]}>checked in safe</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.brandSoft }]}>
                  <Clock3 size={19} color={colors.brand} />
                </View>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>Today</Text>
                <Text style={[styles.summaryLabel, { color: colors.inkMuted }]}>next check-in</Text>
              </View>
            </View>

            {/* Moved above the person list/add-form (2026-09-11 nav/UX
                pass) — this is a time-sensitive action people were
                missing by having to scroll past the whole circle first. */}
            <View style={[styles.checkinCard, { backgroundColor: colors.surfaceSoft }]}>
              <View style={[styles.insightIcon, { backgroundColor: colors.brandSoft }]}>
                <Clock3 size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.checkinTitle, { color: colors.foreground }]}>Next check-in</Text>
                <Text style={[styles.checkinBody, { color: colors.inkMuted }]}>Tomorrow at 9:00 AM · {area ?? 'your area'}</Text>
                {reminderDenied && (
                  <Text style={[styles.checkinBody, { color: colors.warning }]}>
                    Notifications are turned off for ResQ in system settings.
                  </Text>
                )}
              </View>
              <Pressable
                onPress={toggleReminder}
                hitSlop={8}
                accessibilityRole="switch"
                accessibilityState={{ checked: reminderEnabled }}
                accessibilityLabel="Remind me to check in"
                style={styles.reminderToggle}
              >
                {reminderEnabled ? <Bell size={16} color={colors.brand} /> : <BellOff size={16} color={colors.inkMuted} />}
              </Pressable>
              <Pressable onPress={() => checkIn('fam-2')} hitSlop={8}>
                <Text style={[styles.checkinLink, { color: colors.brand }]}>Check in</Text>
              </Pressable>
            </View>

            <View style={styles.familyHeading}>
              <View>
                <Eyebrow>PEOPLE</Eyebrow>
                <Text style={[styles.h2, { color: colors.foreground }]}>Your circle</Text>
              </View>
              <View style={[styles.countBadge, { backgroundColor: colors.surfaceSoft }]}>
                <Text style={[styles.countBadgeText, { color: colors.inkMuted }]}>{list.length} people</Text>
              </View>
            </View>

            <View style={styles.list}>
              {list.map((person) => (
                <Pressable
                  key={person.id}
                  onPress={() => router.push({ pathname: '/family-member', params: { id: person.id } })}
                  style={[styles.personRow, { borderColor: colors.line, backgroundColor: colors.surface }]}
                >
                  <View style={[styles.personAvatar, { backgroundColor: colors.brandSoft }]}>
                    <Text style={[styles.personAvatarText, { color: colors.brandDeep }]}>{person.initials}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[styles.personName, { color: colors.foreground }]}>{person.name}</Text>
                    <Text style={[styles.personRelation, { color: colors.inkMuted }]}>{person.relation}</Text>
                  </View>
                  <View style={styles.personStatus}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(person.tone) }]} />
                    <Text style={[styles.statusText, { color: statusColor(person.tone) }]}>{person.status}</Text>
                  </View>
                  <ChevronRight size={16} color={colors.inkMuted} />
                </Pressable>
              ))}
            </View>

            {addingOpen && (
              <View style={[styles.addPersonCard, { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}>
                <Text style={[styles.addPersonTitle, { color: colors.foreground }]}>Add someone to your circle</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Full name"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.addPersonInput, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surface }]}
                  autoCapitalize="words"
                />
                <View style={styles.relationChips}>
                  {RELATION_OPTIONS.map((relation) => {
                    const selected = newRelation === relation;
                    return (
                      <Pressable
                        key={relation}
                        onPress={() => setNewRelation(relation)}
                        style={[
                          styles.relationChip,
                          {
                            borderColor: selected ? colors.brand : colors.line,
                            backgroundColor: selected ? colors.brand : colors.surface,
                          },
                        ]}
                      >
                        <Text style={[styles.relationChipText, { color: selected ? colors.onBrand : colors.inkMuted }]}>{relation}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={colors.inkMuted}
                  keyboardType="phone-pad"
                  style={[styles.addPersonInput, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surface }]}
                />
                <View style={styles.addPersonActions}>
                  <PrimaryButton title="Cancel" variant="outline" onPress={cancelAdding} style={styles.flex} />
                  <PrimaryButton
                    title="Send invite"
                    onPress={sendInvite}
                    loading={inviting}
                    disabled={!canSendInvite}
                    style={styles.flex}
                  />
                </View>
              </View>
            )}

            <PrimaryButton
              title="Add someone to your circle"
              variant="outline"
              icon={<Plus size={17} color={colors.brand} />}
              onPress={() => setAddingOpen(true)}
            />
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 8 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  introSub: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  summaryRow: { flexDirection: 'row', gap: 9, marginTop: 16, marginBottom: 22 },
  summaryCard: { flex: 1, alignItems: 'flex-start', gap: 7, padding: 14, borderWidth: 1, borderRadius: radius.lg },
  summaryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  summaryLabel: { fontSize: 10 },
  familyHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  countBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill },
  countBadgeText: { fontSize: 9 },
  list: { gap: 8, marginBottom: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md },
  personAvatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  personAvatarText: { fontSize: 10, fontWeight: '800' },
  personName: { fontSize: 13, fontWeight: '700' },
  personRelation: { fontSize: 10, marginTop: 2 },
  personStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700' },
  addPersonCard: { gap: 9, padding: 14, marginBottom: 12, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg },
  addPersonTitle: { fontSize: 13, fontWeight: '700' },
  addPersonBody: { fontSize: 10 },
  addPersonInput: { height: 44, paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.sm, fontSize: 12 },
  addPersonActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  relationChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  relationChip: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderRadius: radius.pill },
  relationChipText: { fontSize: 11, fontWeight: '700' },
  checkinCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 20, padding: 13, borderRadius: 15 },
  insightIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkinTitle: { fontSize: 12, fontWeight: '700' },
  checkinBody: { fontSize: 11, marginTop: 3 },
  checkinLink: { fontSize: 11, fontWeight: '700' },
  reminderToggle: { padding: 4 },
});
