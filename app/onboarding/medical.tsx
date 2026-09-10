import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { OnboardingLayout } from '@/components/OnboardingLayout';
import { X, Plus } from '@/components/icons';
import { getOnboardingMedical, saveOnboardingMedical } from '@/services/onboardingService';
import { mergeMedicalProfile } from '@/services/medicalProfileService';

export default function MedicalStep() {
  const { colors } = useAppTheme();

  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState('');

  // Accessibility toggles
  const [mobilityAid, setMobilityAid] = useState(false);
  const [visualImpairment, setVisualImpairment] = useState(false);
  const [hearingImpairment, setHearingImpairment] = useState(false);

  useEffect(() => {
    getOnboardingMedical().then((saved) => {
      if (!saved) return;
      setAllergies(saved.allergies);
      setConditions(saved.conditions);
      setMobilityAid(saved.usesMobilityAid);
      setVisualImpairment(saved.hasVisualImpairment);
      setHearingImpairment(saved.hasHearingImpairment);
    });
  }, []);

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies((prev) => [...prev, trimmed]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (a: string) => {
    setAllergies((prev) => prev.filter((x) => x !== a));
  };

  const persist = async () => {
    const data = {
      allergies,
      conditions: conditions.trim(),
      usesMobilityAid: mobilityAid,
      hasVisualImpairment: visualImpairment,
      hasHearingImpairment: hearingImpairment,
    };
    await saveOnboardingMedical(data);
    // Also write into the real, durable medical profile immediately, not
    // just the onboarding draft — mirrors personal.tsx's mergeProfile call.
    // Without this, medical info only ever lived in the draft key, which
    // clearOnboardingDraft() wipes on logout — the same gap §2.5 found and
    // fixed for name/phone/family, just not yet for medical info.
    await mergeMedicalProfile(data);
  };

  const onContinue = async () => {
    await persist();
    router.push('/onboarding/family' as any);
  };

  const onSkip = async () => {
    await persist();
    router.push('/onboarding/family' as any);
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={5}
      title="Medical info"
      subtitle="This helps first responders treat you correctly during an emergency. All data stays on your device."
      onContinue={onContinue}
      onSkip={onSkip}
    >
      {/* Allergies */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Allergies</Text>
        <View style={[styles.tagInputRow, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
          <TextInput
            value={allergyInput}
            onChangeText={setAllergyInput}
            placeholder="Type and press +"
            onSubmitEditing={addAllergy}
            returnKeyType="done"
            style={[styles.tagInput, { color: colors.foreground }]}
            placeholderTextColor={colors.inkFaint}
          />
          <Pressable
            onPress={addAllergy}
            style={[styles.addButton, { backgroundColor: colors.brandSoft }]}
          >
            <Plus size={16} color={colors.brand} />
          </Pressable>
        </View>
        {allergies.length > 0 && (
          <View style={styles.tagRow}>
            {allergies.map((a) => (
              <View
                key={a}
                style={[styles.tag, { backgroundColor: colors.brandSoft, borderColor: colors.brand }]}
              >
                <Text style={[styles.tagText, { color: colors.brand }]}>{a}</Text>
                <Pressable onPress={() => removeAllergy(a)} hitSlop={6}>
                  <X size={13} color={colors.brand} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Medical Conditions */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Medical conditions</Text>
        <TextInput
          value={conditions}
          onChangeText={setConditions}
          placeholder="e.g. Asthma, Diabetes, Epilepsy"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={[
            styles.textArea,
            { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft },
          ]}
          placeholderTextColor={colors.inkFaint}
        />
      </View>

      {/* Accessibility Needs */}
      <View>
        <Text style={[styles.label, { color: colors.foreground }]}>Accessibility needs</Text>
        <Text style={[styles.hint, { color: colors.inkMuted }]}>
          Select any that apply — this helps during evacuations.
        </Text>

        <ToggleRow
          label="Uses mobility aid"
          subtitle="Wheelchair, walker, cane, etc."
          active={mobilityAid}
          onToggle={() => setMobilityAid(!mobilityAid)}
          colors={colors}
        />
        <ToggleRow
          label="Visual impairment"
          subtitle="Partial or total vision loss"
          active={visualImpairment}
          onToggle={() => setVisualImpairment(!visualImpairment)}
          colors={colors}
        />
        <ToggleRow
          label="Hearing impairment"
          subtitle="Partial or total hearing loss"
          active={hearingImpairment}
          onToggle={() => setHearingImpairment(!hearingImpairment)}
          colors={colors}
        />
      </View>
    </OnboardingLayout>
  );
}

function ToggleRow({
  label,
  subtitle,
  active,
  onToggle,
  colors,
}: {
  label: string;
  subtitle: string;
  active: boolean;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.toggleRow,
        {
          backgroundColor: active ? colors.brandSofter : colors.surfaceSoft,
          borderColor: active ? colors.brand : colors.line,
        },
      ]}
    >
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.toggleSub, { color: colors.inkMuted }]}>{subtitle}</Text>
      </View>
      <View
        style={[
          styles.toggleCircle,
          {
            backgroundColor: active ? colors.brand : colors.line,
          },
        ]}
      >
        {active && (
          <View style={[styles.toggleDot, { backgroundColor: colors.onBrand }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },

  // Tag input
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingLeft: 16,
    paddingRight: 6,
    height: 52,
  },
  tagInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Text area
  textArea: {
    minHeight: 90,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: radius.md,
    fontSize: 15,
    lineHeight: 22,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
