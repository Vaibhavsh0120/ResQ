import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Clock3, Plus, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useFamily } from '@/hooks/useFamily';
import { FamilyMember } from '@/types';

export default function Family() {
  const { colors } = useAppTheme();
  const { members, loading, error, refresh, checkIn, invite } = useFamily();
  const [addingOpen, setAddingOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  const list = members ?? [];
  const safeCount = list.filter((p) => p.tone === 'success').length;
  const statusColor = (tone: FamilyMember['tone']) => (tone === 'success' ? colors.brand : colors.warning);

  const sendInvite = async () => {
    setInviting(true);
    await invite('Jamie Lee', 'Friend');
    setInviting(false);
    setAddingOpen(false);
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
                <Text style={[styles.addPersonBody, { color: colors.inkMuted }]}>Demo mode is ready for a new contact.</Text>
                <PrimaryButton title="Send invite" onPress={sendInvite} loading={inviting} />
              </View>
            )}

            <PrimaryButton
              title="Add someone to your circle"
              variant="outline"
              icon={<Plus size={17} color={colors.brand} />}
              onPress={() => setAddingOpen(true)}
            />

            <View style={[styles.checkinCard, { backgroundColor: colors.surfaceSoft }]}>
              <View style={[styles.insightIcon, { backgroundColor: colors.brandSoft }]}>
                <Clock3 size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.checkinTitle, { color: colors.foreground }]}>Next check-in</Text>
                <Text style={[styles.checkinBody, { color: colors.inkMuted }]}>Tomorrow at 9:00 AM · Riverside district</Text>
              </View>
              <Pressable onPress={() => checkIn('fam-2')} hitSlop={8}>
                <Text style={[styles.checkinLink, { color: colors.brand }]}>Check in</Text>
              </Pressable>
            </View>
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
  checkinCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 20, padding: 13, borderRadius: 15 },
  insightIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkinTitle: { fontSize: 12, fontWeight: '700' },
  checkinBody: { fontSize: 11, marginTop: 3 },
  checkinLink: { fontSize: 11, fontWeight: '700' },
});
