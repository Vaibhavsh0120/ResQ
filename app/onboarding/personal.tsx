import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { OnboardingLayout } from '@/components/OnboardingLayout';
import { useAuth } from '@/context/AuthContext';
import { getOnboardingPersonal, saveOnboardingPersonal } from '@/services/onboardingService';
import { mergeProfile } from '@/services/profileService';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PersonalStep() {
  const { colors } = useAppTheme();
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [selectedBlood, setSelectedBlood] = useState('');

  // Pre-fill from a previously-saved draft, if the user is returning to
  // this step (e.g. backed up from a later step, or resumed after quitting
  // onboarding partway through — see AGENT.md).
  useEffect(() => {
    getOnboardingPersonal().then((saved) => {
      if (!saved) return;
      if (saved.fullName) setFullName(saved.fullName);
      if (saved.phone) setPhone(saved.phone);
      if (saved.dob) setDob(saved.dob);
      if (saved.bloodType) setSelectedBlood(saved.bloodType);
    });
  }, []);

  const persist = async () => {
    await saveOnboardingPersonal({ fullName: fullName.trim(), phone: phone.trim(), dob: dob.trim(), bloodType: selectedBlood });
    // Also merge into the real profile immediately, not just the
    // onboarding draft — so name/phone/dob/bloodType are genuinely usable
    // (e.g. by Profile) even if the user quits before finishing the rest
    // of onboarding.
    await mergeProfile({
      ...(fullName.trim() ? { name: fullName.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(dob.trim() ? { dob: dob.trim() } : {}),
      ...(selectedBlood ? { bloodType: selectedBlood } : {}),
    });
  };

  const onContinue = async () => {
    await persist();
    router.push('/onboarding/medical' as any);
  };

  const onSkip = async () => {
    // Skip still saves whatever was actually filled in — "skip" means
    // "don't require completing this step," not "discard what's there."
    await persist();
    router.push('/onboarding/medical' as any);
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={5}
      title="About you"
      subtitle="Basic info that helps us personalize your safety plan and share critical details with first responders."
      onContinue={onContinue}
      onSkip={onSkip}
    >
      {/* Full Name */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Full name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          autoCapitalize="words"
          style={[styles.input, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft }]}
          placeholderTextColor={colors.inkFaint}
        />
      </View>

      {/* Phone */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Phone number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          keyboardType="phone-pad"
          style={[styles.input, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft }]}
          placeholderTextColor={colors.inkFaint}
        />
      </View>

      {/* Date of Birth */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Date of birth</Text>
        <TextInput
          value={dob}
          onChangeText={setDob}
          placeholder="DD / MM / YYYY"
          keyboardType="numeric"
          style={[styles.input, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft }]}
          placeholderTextColor={colors.inkFaint}
        />
      </View>

      {/* Blood Type */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Blood type</Text>
        <View style={styles.bloodGrid}>
          {BLOOD_TYPES.map((bt) => {
            const isSelected = selectedBlood === bt;
            return (
              <Text
                key={bt}
                onPress={() => setSelectedBlood(bt)}
                style={[
                  styles.bloodChip,
                  {
                    backgroundColor: isSelected ? colors.brandDeep : colors.surfaceSoft,
                    borderColor: isSelected ? colors.brand : colors.line,
                    color: isSelected ? colors.onBrand : colors.foreground,
                  },
                ]}
              >
                {bt}
              </Text>
            );
          })}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: radius.md,
    fontSize: 15,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    overflow: 'hidden',
  },
});
