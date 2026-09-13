import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock3, MapPin, MessageCircle, Phone, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { MiniMap } from '@/components/MiniMap';
import { useFamily } from '@/hooks/useFamily';
import { mapsLinkForCoords } from '@/utils/location';

/**
 * Drill-in screen for a single person in the user's circle — reached by
 * tapping a row on the Family tab. Takes the person's id via route params
 * rather than passing the whole object, so a deep link or push notification
 * could open this screen directly once a backend exists.
 */
export default function FamilyMemberDetail() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { members, loading, error, refresh, checkIn } = useFamily();
  const [checkingIn, setCheckingIn] = React.useState(false);

  const person = (members ?? []).find((m) => m.id === id);

  const onCheckIn = async () => {
    if (!id) return;
    setCheckingIn(true);
    await checkIn(id);
    setCheckingIn(false);
  };

  const onCall = () => {
    if (!person?.phone) return;
    Linking.openURL(`tel:${person.phone}`);
  };

  const onMessage = () => {
    if (!person?.phone) return;
    // SMS URL separator differs by platform: iOS uses "&", Android uses "?".
    const separator = Platform.OS === 'ios' ? '&' : '?';
    Linking.openURL(`sms:${person.phone}${separator}body=`);
  };

  const onLocate = () => {
    if (!person) return;
    // Prefer a real coordinate-based Maps link when we have one on file
    // (see FamilyMember.latitude/.longitude's doc comment in types/index.ts)
    // — falls back to the existing name-based search otherwise, since
    // not every member has shared a location yet.
    const url =
      person.latitude != null && person.longitude != null
        ? mapsLinkForCoords(person.latitude, person.longitude)
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(person.lastKnownLocation ?? person.name)}`;
    Linking.openURL(url);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title={person?.name ?? 'Person'} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/family'))} />
      <Screen>
        {loading && <LoadingState label="Loading their details..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && !person && (
          <View style={styles.notFound}>
            <Text style={[styles.notFoundText, { color: colors.inkMuted }]}>
              We couldn&apos;t find this person. They may have been removed from your circle.
            </Text>
          </View>
        )}

        {!loading && !error && person && (
          <>
            {/* Redesigned 2026-09-12 — was a plain centered avatar/name/
                badge stack directly on the screen background, reading as
                basic compared to guidance-result.tsx's hero treatment
                elsewhere in the app. Now a brandDeep hero card (same
                shadow/radius pattern as that screen) holding avatar,
                name, relation and status together, so this drill-in
                screen reads as considered rather than a bare list of
                facts. All functionality below (call/message/locate, map,
                check-in) is unchanged — only the presentation. */}
            <View style={[styles.heroCard, { backgroundColor: colors.brandDeep, shadowColor: colors.shadowBrand }]}>
              <View style={[styles.avatar, { backgroundColor: colors.onBrandOverlaySoft, borderColor: colors.onBrandHairline }]}>
                <Text style={[styles.avatarText, { color: colors.onBrand }]}>{person.initials}</Text>
              </View>
              <Text style={[styles.name, { color: colors.onBrand }]}>{person.name}</Text>
              <Text style={[styles.relation, { color: colors.onBrandMuted }]}>{person.relation}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.onBrandOverlaySoft }]}>
                <View style={[styles.statusDot, { backgroundColor: person.tone === 'success' ? colors.onBrand : colors.warning }]} />
                <Text style={[styles.statusText, { color: colors.onBrand }]}>{person.status}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={onCall}
                disabled={!person.phone}
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.line }, !person.phone && styles.actionButtonDisabled]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.brandSoft }]}>
                  <Phone size={17} color={colors.brand} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Call</Text>
              </Pressable>
              <Pressable
                onPress={onMessage}
                disabled={!person.phone}
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.line }, !person.phone && styles.actionButtonDisabled]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.brandSoft }]}>
                  <MessageCircle size={17} color={colors.brand} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Message</Text>
              </Pressable>
              <Pressable
                onPress={onLocate}
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.line }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.brandSoft }]}>
                  <MapPin size={17} color={colors.brand} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Locate</Text>
              </Pressable>
            </View>
            {!person.phone && (
              <Text style={[styles.noPhoneNote, { color: colors.inkMuted }]}>
                No phone number on file for {person.name} yet — Call and Message are unavailable.
              </Text>
            )}

            {person.latitude != null && person.longitude != null && (
              <View style={[styles.mapWrap, { borderColor: colors.line }]}>
                <MiniMap
                  markers={[{ id: person.id, latitude: person.latitude, longitude: person.longitude, kind: 'user' }]}
                  height={150}
                  zoom={14}
                  accessibilityLabel={`Map showing ${person.name}'s last known location`}
                />
              </View>
            )}

            <View style={styles.sectionHeading}>
              <Eyebrow>STATUS</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>Latest check-in</Text>
            </View>
            <View style={[styles.infoCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.brandSoft }]}>
                <Clock3 size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>
                  {person.tone === 'success' ? 'Checked in as safe' : 'Waiting on check-in'}
                </Text>
                <Text style={[styles.infoSubtitle, { color: colors.inkMuted }]}>{person.lastKnownLocation ?? 'Location not shared yet'}</Text>
              </View>
            </View>

            <PrimaryButton
              title={person.tone === 'success' ? 'Ask for a fresh check-in' : 'Mark as checked in'}
              onPress={onCheckIn}
              loading={checkingIn}
              icon={<ShieldCheck size={16} color={colors.onBrand} />}
              style={styles.checkInButton}
            />
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notFound: { paddingTop: 40, alignItems: 'center' },
  notFoundText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 20,
    gap: 6,
    marginTop: 10,
    borderRadius: radius.xl,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 6,
  },
  avatar: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 6, borderWidth: 1 },
  avatarText: { fontSize: 22, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  relation: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, marginTop: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 9, marginTop: 20, marginBottom: 8 },
  actionButton: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderRadius: radius.lg },
  actionButtonDisabled: { opacity: 0.4 },
  actionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  noPhoneNote: { fontSize: 10, lineHeight: 14, marginBottom: 16 },
  mapWrap: { marginBottom: 20, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
  sectionHeading: { marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md, marginBottom: 24 },
  infoIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 13, fontWeight: '700' },
  infoSubtitle: { fontSize: 10, marginTop: 3 },
  checkInButton: { marginBottom: 12 },
});
