import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronRight, HomeIcon, MapPin } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { MiniMap } from '@/components/MiniMap';
import { useSafePlaces } from '@/hooks/useSafePlaces';
import { useCurrentArea } from '@/hooks/useCurrentArea';

// Note: Safe places is a primary tab destination (like Home/Updates/Family),
// so its header shows the profile icon rather than a back arrow — matching
// every other root-level tab screen.
export default function Safe() {
  const { colors } = useAppTheme();
  const { area, latitude, longitude } = useCurrentArea();
  // Real device coordinates now flow into the query once a GPS fix is
  // available (PROGRESS.md Phase 1's useDeviceLocation) — mockSafePlaces.ts
  // already has real Delhi-area coordinates, and safePlacesService.ts now
  // sorts by actual distance from the user when coordinates are present,
  // so "nearby" is real rather than a fixed static order.
  const { data: places, loading, error, refresh } = useSafePlaces({ latitude: latitude ?? undefined, longitude: longitude ?? undefined });
  // Seeded from the user's profile area (single source of truth — see
  // PROGRESS.md Phase 0), but kept as local state so a search here can be
  // overridden per-session without touching the saved profile.
  const [district, setDistrict] = useState(area ?? 'Your area');
  const [districtSeeded, setDistrictSeeded] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [draftDistrict, setDraftDistrict] = useState(district);

  // Profile loads async, so pick up the real area once it arrives — but
  // only before the user has actually edited the field themselves.
  useEffect(() => {
    if (area && !districtSeeded) {
      setDistrict(area);
      setDraftDistrict(area);
      setDistrictSeeded(true);
    }
  }, [area, districtSeeded]);

  const saveLocation = () => {
    if (draftDistrict.trim()) setDistrict(draftDistrict.trim());
    setDistrictSeeded(true); // user has now taken over this field; stop auto-syncing from profile
    setEditingLocation(false);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Safe places" showProfile onProfilePress={() => router.push('/profile')} />
      <Screen>
        <View style={[styles.locationBanner, { borderColor: colors.line }]}>
          <View style={[styles.locationDot, { backgroundColor: colors.brandSoft }]}>
            <MapPin size={17} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.locationTitle, { color: colors.foreground }]}>Near you</Text>
            <Text style={[styles.locationSub, { color: colors.inkMuted }]}>{district} · updated just now</Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => {
              setDraftDistrict(district);
              setEditingLocation((v) => !v);
            }}
          >
            <Text style={[styles.linkText, { color: colors.brand }]}>{editingLocation ? 'Cancel' : 'Change'}</Text>
          </Pressable>
        </View>

        {editingLocation && (
          <View style={[styles.locationEditor, { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}>
            <TextInput
              value={draftDistrict}
              onChangeText={setDraftDistrict}
              placeholder="Enter your area or district"
              placeholderTextColor={colors.inkMuted}
              style={[styles.locationInput, { color: colors.foreground, borderColor: colors.line, backgroundColor: colors.surface }]}
              autoFocus
              onSubmitEditing={saveLocation}
              returnKeyType="done"
            />
            <Pressable onPress={saveLocation} style={[styles.locationSave, { backgroundColor: colors.brandDeep }]}>
              <Check size={16} color={colors.onBrand} />
            </Pressable>
          </View>
        )}

        <View style={styles.mapWrap}>
          <MiniMap
            markers={(places ?? []).map((p) => ({ id: p.id, latitude: p.latitude ?? 0, longitude: p.longitude ?? 0 }))}
            height={190}
            accessibilityLabel={`Map showing ${(places ?? []).length} safe places nearby`}
          />
          <View style={[styles.mapLabel, { backgroundColor: colors.onBrandCard }]}>
            <Text style={[styles.mapLabelText, { color: colors.featuredIconFg }]}>{(places ?? []).length} safe places nearby</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Eyebrow>NEARBY SUPPORT</Eyebrow>
          <Text style={[styles.h2, { color: colors.foreground }]}>Places you can go</Text>
        </View>

        {loading && <LoadingState label="Finding places near you..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && (
          <View style={styles.list}>
            {(places ?? []).map(({ id, name, detail, status }) => (
              <Pressable
                key={id}
                onPress={() => router.replace({ pathname: '/place-detail', params: { id } })}
                style={[styles.placeRow, { borderColor: colors.line, backgroundColor: colors.surface }]}
              >
                <View style={[styles.placeIcon, { backgroundColor: colors.brandSoft }]}>
                  <HomeIcon size={17} color={colors.brand} />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.placeName, { color: colors.foreground }]}>{name}</Text>
                  <Text style={[styles.placeDetail, { color: colors.inkMuted }]}>{detail}</Text>
                </View>
                <Text style={[styles.openLabel, { color: colors.brand }]}>{status}</Text>
                <ChevronRight size={16} color={colors.inkMuted} />
              </Pressable>
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  locationDot: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  locationTitle: { fontSize: 11, fontWeight: '700' },
  locationSub: { fontSize: 10, marginTop: 3 },
  linkText: { fontSize: 11, fontWeight: '700' },
  locationEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  locationInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 12,
  },
  locationSave: { width: 40, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  mapWrap: {
    marginTop: 12,
  },
  mapLabel: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  mapLabelText: { fontSize: 10, fontWeight: '700' },
  sectionHeading: { marginTop: 26, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  list: { gap: 8 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md },
  placeIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  placeName: { fontSize: 13, fontWeight: '700' },
  placeDetail: { fontSize: 10, marginTop: 3 },
  openLabel: { fontSize: 9, fontWeight: '800' },
});
