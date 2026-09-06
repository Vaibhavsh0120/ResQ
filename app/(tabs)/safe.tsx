import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronRight, HomeIcon, MapPin, Navigation } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { IconButton } from '@/components/IconButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useSafePlaces } from '@/hooks/useSafePlaces';

// Note: Safe places is a primary tab destination (like Home/Updates/Family),
// so its header shows the profile icon rather than a back arrow — matching
// every other root-level tab screen.
export default function Safe() {
  const { colors } = useAppTheme();
  const { data: places, loading, error, refresh } = useSafePlaces();
  const [district, setDistrict] = useState('Riverside district');
  const [editingLocation, setEditingLocation] = useState(false);
  const [draftDistrict, setDraftDistrict] = useState(district);
  // The map card below is a stylized static illustration, not a real
  // MapView (no map SDK wired in yet — see PROGRESS.md). "Map view"
  // highlights it instead of pretending to switch to a live map.
  const [mapHighlighted, setMapHighlighted] = useState(false);

  const highlightMap = () => {
    setMapHighlighted(true);
    setTimeout(() => setMapHighlighted(false), 900);
  };

  const saveLocation = () => {
    if (draftDistrict.trim()) setDistrict(draftDistrict.trim());
    setEditingLocation(false);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="Safe places"
        showProfile
        onProfilePress={() => router.push('/profile')}
        action={
          <IconButton label="Highlight map" onPress={highlightMap} muted>
            <Navigation size={18} color={colors.inkMuted} />
          </IconButton>
        }
      />
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

        <View
          style={[
            styles.mapCard,
            { borderColor: mapHighlighted ? colors.brand : colors.line, backgroundColor: colors.brandSoft },
            mapHighlighted && styles.mapCardHighlighted,
          ]}
        >
          <View style={[styles.mapPin, styles.pinOne, { backgroundColor: colors.brand, borderColor: colors.onBrandBorder }]}>
            <MapPin size={16} color={colors.onBrand} />
          </View>
          <View style={[styles.mapPin, styles.pinTwo, { backgroundColor: colors.danger, borderColor: colors.onBrandBorder }]}>
            <MapPin size={16} color={colors.onDanger} />
          </View>
          <View style={[styles.mapPin, styles.pinThree, { backgroundColor: colors.brand, borderColor: colors.onBrandBorder }]}>
            <MapPin size={16} color={colors.onBrand} />
          </View>
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
                onPress={() => router.push({ pathname: '/place-detail', params: { id } })}
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
  mapCard: {
    height: 190,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  mapCardHighlighted: {
    borderWidth: 2,
  },
  mapPin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  pinOne: { left: '26%', top: '37%' },
  pinTwo: { right: '25%', top: '22%' },
  pinThree: { right: '39%', bottom: '19%' },
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
