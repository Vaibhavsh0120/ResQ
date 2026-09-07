import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { OnboardingLayout } from '@/components/OnboardingLayout';
import { MapPin, Navigation } from '@/components/icons';

export default function LocationStep() {
  const { colors } = useAppTheme();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      setLocationStatus(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('Location permission denied. Enter manually below.');
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        if (item.street) setAddress(`${item.streetNumber || ''} ${item.street}`.trim());
        if (item.city) setCity(item.city);
        if (item.region) setStateRegion(item.region);
        setLocationStatus('Location detected successfully!');
      } else {
        setLocationStatus('Location detected coordinates.');
      }
    } catch {
      setLocationStatus('Could not detect location. Please enter manually.');
    } finally {
      setLocating(false);
    }
  };

  const onContinue = () => {
    router.push('/onboarding/emergency' as any);
  };

  const onSkip = () => {
    router.push('/onboarding/emergency' as any);
  };

  return (
    <OnboardingLayout
      step={4}
      totalSteps={5}
      title="Home location"
      subtitle="Set your primary residence or shelter zone so ResQ can alert you to hyper-local hazards and evacuation corridors."
      onContinue={onContinue}
      onSkip={onSkip}
    >
      {/* Quick location auto-detect */}
      <Pressable
        onPress={handleUseCurrentLocation}
        disabled={locating}
        style={[
          styles.detectBtn,
          { backgroundColor: colors.brandSoft, borderColor: colors.brand },
        ]}
      >
        {locating ? (
          <ActivityIndicator size="small" color={colors.brand} />
        ) : (
          <Navigation size={18} color={colors.brand} />
        )}
        <Text style={[styles.detectBtnText, { color: colors.brand }]}>
          {locating ? 'Detecting location...' : 'Use current location'}
        </Text>
      </Pressable>

      {locationStatus ? (
        <Text style={[styles.statusText, { color: colors.inkMuted }]}>{locationStatus}</Text>
      ) : null}

      {/* Street Address */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Street address</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. 742 Evergreen Terrace"
          placeholderTextColor={colors.inkFaint}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceSoft, borderColor: colors.line, color: colors.foreground },
          ]}
        />
      </View>

      {/* City / District & State row */}
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={[styles.label, { color: colors.foreground }]}>City / District</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Springfield"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.line, color: colors.foreground },
            ]}
          />
        </View>

        <View style={styles.flex1}>
          <Text style={[styles.label, { color: colors.foreground }]}>State / Region</Text>
          <TextInput
            value={stateRegion}
            onChangeText={setStateRegion}
            placeholder="e.g. OR"
            placeholderTextColor={colors.inkFaint}
            style={[
              styles.input,
              { backgroundColor: colors.surfaceSoft, borderColor: colors.line, color: colors.foreground },
            ]}
          />
        </View>
      </View>

      {/* Nearest Landmark */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Nearest landmark</Text>
        <TextInput
          value={landmark}
          onChangeText={setLandmark}
          placeholder="e.g. Near Metro Station / Community Park"
          placeholderTextColor={colors.inkFaint}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceSoft, borderColor: colors.line, color: colors.foreground },
          ]}
        />
        <Text style={[styles.hint, { color: colors.inkMuted }]}>
          Helps rescue teams navigate when GPS or street signs are down.
        </Text>
      </View>

      {/* Privacy note */}
      <View
        style={[
          styles.privacyCard,
          { backgroundColor: colors.surfaceSoft, borderColor: colors.line },
        ]}
      >
        <MapPin size={16} color={colors.brand} />
        <Text style={[styles.privacyText, { color: colors.inkMuted }]}>
          Your location data is encrypted on your device and only broadcast during active SOS alerts.
        </Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  detectBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  privacyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});
