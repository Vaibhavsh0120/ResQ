import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Clock3, HomeIcon, Navigation, Phone } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { MiniMap } from '@/components/MiniMap';
import { useSafePlaces } from '@/hooks/useSafePlaces';

/** Drill-in screen for a single safe place, reached by tapping a row on the Safe places tab. */
export default function PlaceDetail() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: places, loading, error, refresh } = useSafePlaces();

  const place = (places ?? []).find((p) => p.id === id);

  const onDirections = () => {
    if (!place) return;
    const url =
      place.latitude != null && place.longitude != null
        ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
    Linking.openURL(url);
  };

  const onCallAhead = () => {
    if (!place?.phone) return;
    Linking.openURL(`tel:${place.phone}`);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title={place?.name ?? 'Safe place'} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/safe'))} />
      <Screen>
        {loading && <LoadingState label="Loading this place..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && !place && (
          <View style={styles.notFound}>
            <Text style={[styles.notFoundText, { color: colors.inkMuted }]}>
              We couldn&apos;t find this place. It may no longer be listed nearby.
            </Text>
          </View>
        )}

        {!loading && !error && place && (
          <>
            <View style={styles.mapWrap}>
              <MiniMap
                markers={place.latitude != null && place.longitude != null ? [{ id: place.id, latitude: place.latitude, longitude: place.longitude }] : []}
                height={140}
                zoom={15}
                accessibilityLabel={`Map showing ${place.name}`}
              />
            </View>

            <View style={styles.hero}>
              <Eyebrow>{place.status.toUpperCase()}</Eyebrow>
              <Text style={[styles.name, { color: colors.foreground }]}>{place.name}</Text>
              <Text style={[styles.detail, { color: colors.inkMuted }]}>{place.detail}</Text>
            </View>

            <View style={styles.actionsRow}>
              <Pressable onPress={onDirections} style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                <Navigation size={18} color={colors.brand} />
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Directions</Text>
              </Pressable>
              <Pressable
                onPress={onCallAhead}
                disabled={!place.phone}
                style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.line }, !place.phone && styles.actionButtonDisabled]}
              >
                <Phone size={18} color={colors.brand} />
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>Call ahead</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeading}>
              <Eyebrow>DETAILS</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>What to expect</Text>
            </View>

            <View style={[styles.infoCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.brandSoft }]}>
                <HomeIcon size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>Community shelter point</Text>
                <Text style={[styles.infoSubtitle, { color: colors.inkMuted }]}>
                  Accepts walk-ins, no registration required. Bring identification if you have it.
                </Text>
              </View>
            </View>

            <View style={[styles.infoCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.brandSoft }]}>
                <Clock3 size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>Current status</Text>
                <Text style={[styles.infoSubtitle, { color: colors.inkMuted }]}>{place.detail}</Text>
              </View>
            </View>

            <PrimaryButton
              title="Back to safe places"
              variant="outline"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/safe'))}
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
  mapWrap: { marginTop: 10 },
  hero: { marginTop: 18, marginBottom: 20 },
  name: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  detail: { fontSize: 12, marginTop: 6 },
  actionsRow: { flexDirection: 'row', gap: 9, marginBottom: 24 },
  actionButton: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderWidth: 1, borderRadius: radius.lg },
  actionButtonDisabled: { opacity: 0.4 },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  sectionHeading: { marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md, marginBottom: 10 },
  infoIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 13, fontWeight: '700' },
  infoSubtitle: { fontSize: 11, marginTop: 4, lineHeight: 16 },
});
