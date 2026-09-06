import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, Check, ImagePlus, Info, MapPin, Send, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ErrorState } from '@/components/AsyncState';
import { useIncidentReport } from '@/hooks/useIncidentReport';
import { disasterTypes } from '@/data/mockGuidance';

export default function Report() {
  const { colors } = useAppTheme();
  const { submit, submitting, error, result, reset } = useIncidentReport();
  const [reporting, setReporting] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [location, setLocation] = useState('Near Riverside Park');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const toggleType = (type: string) =>
    setTypes((current) => (current.includes(type) ? current.filter((t) => t !== type) : [...current, type]));

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      setPhotoUri(pickerResult.assets[0].uri);
    }
  };

  const resetForm = () => {
    reset();
    setReporting(false);
    setTypes([]);
    setDescription('');
    setPhotoUri(null);
  };

  const onSubmit = () => submit({ types, location, description, photoUri });

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Guidance & report" showProfile onProfilePress={() => router.push('/profile')} />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>RAG-POWERED SAFETY</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>
            Understand first.{'\n'}Report when ready.
          </Text>
          <Text style={[styles.introSub, { color: colors.inkMuted }]}>
            Choose what you&apos;re facing to get focused guidance from verified emergency sources.
          </Text>
        </View>

        {result ? (
          <View style={styles.successState}>
            <View style={[styles.successIcon, { backgroundColor: colors.brandSoft }]}>
              <Check size={28} color={colors.brand} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Thank you, Alex.</Text>
            <Text style={[styles.successBody, { color: colors.inkMuted }]}>
              Your report is marked as reported, not verified. ResQ will use it to improve local awareness.
            </Text>
            <View style={styles.successActions}>
              <PrimaryButton
                title="See guidance for this"
                onPress={() => router.push({ pathname: '/guidance-result', params: { types: types.join(',') } })}
                icon={<ShieldCheck size={16} color={colors.onBrand} />}
              />
              <PrimaryButton
                title="Back to home"
                variant="outline"
                onPress={() => {
                  resetForm();
                  router.push('/(tabs)');
                }}
              />
            </View>
          </View>
        ) : !reporting ? (
          <>
            <View style={[styles.ragBrief, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
              <View style={[styles.insightIcon, { backgroundColor: colors.brandSoft }]}>
                <ShieldCheck size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.briefTitle, { color: colors.foreground }]}>Evidence-first guidance</Text>
                <Text style={[styles.briefBody, { color: colors.inkMuted }]}>
                  Your selections help ResQ retrieve matching safety steps, current local updates, and trusted sources.
                </Text>
              </View>
            </View>

            <View style={styles.sectionTitle}>
              <Eyebrow>SELECT ALL THAT APPLY</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>What are you experiencing?</Text>
            </View>

            <View style={styles.disasterGrid}>
              {disasterTypes.map((type) => {
                const selected = types.includes(type);
                return (
                  <Pressable
                    key={type}
                    onPress={() => toggleType(type)}
                    style={[
                      styles.disasterButton,
                      {
                        borderColor: selected ? colors.brand : colors.line,
                        backgroundColor: selected ? colors.brandSoft : colors.surface,
                      },
                    ]}
                  >
                    <Text style={[styles.disasterText, { color: selected ? colors.brand : colors.foreground }]}>{type}</Text>
                    {selected && <Check size={15} color={colors.brand} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.guidancePreview, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
              <View style={styles.flex}>
                <Eyebrow>NEXT</Eyebrow>
                <Text style={[styles.briefTitle, { color: colors.foreground }]}>Get immediate safety guidance</Text>
                <Text style={[styles.briefBody, { color: colors.inkMuted }]}>
                  Start with verified steps before sharing an incident.
                </Text>
              </View>
              <ShieldCheck size={20} color={colors.brand} />
            </View>

            <View style={styles.centeredButtonRow}>
              <PrimaryButton
                title="Report an incident"
                disabled={!types.length}
                onPress={() => setReporting(true)}
                icon={<AlertTriangle size={16} color={colors.onBrand} />}
                style={styles.centeredButton}
              />
            </View>
          </>
        ) : (
          <View style={styles.reportForm}>
            <View style={[styles.selectedSummary, { backgroundColor: colors.brandSoft }]}>
              <Eyebrow>SELECTED HAZARDS</Eyebrow>
              <Text style={[styles.selectedSummaryText, { color: colors.brand }]}>{types.join(' · ')}</Text>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Where is it happening?</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  style={[styles.input, styles.inputPadded, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft }]}
                />
                <View style={styles.inputIcon}>
                  <MapPin size={16} color={colors.inkMuted} />
                </View>
              </View>
            </View>

            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Tell us more</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what you can see, who may be affected, and anything responders should know..."
                placeholderTextColor={colors.inkMuted}
                multiline
                style={[styles.textarea, { borderColor: colors.line, color: colors.foreground, backgroundColor: colors.surfaceSoft }]}
              />
            </View>

            <Pressable
              onPress={pickPhoto}
              style={[styles.photoUpload, { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}
            >
              <View style={styles.photoUploadLeft}>
                <ImagePlus size={18} color={colors.brand} />
                <Text style={[styles.photoUploadText, { color: colors.brand }]} numberOfLines={1}>
                  {photoUri ? photoUri.split('/').pop() : 'Add a photo (optional)'}
                </Text>
              </View>
            </Pressable>

            {error && <ErrorState message={error} />}

            <PrimaryButton
              title="Share report"
              onPress={onSubmit}
              loading={submitting}
              icon={<Send size={16} color={colors.onBrand} />}
            />

            <View style={styles.formNote}>
              <Info size={14} color={colors.inkMuted} />
              <Text style={[styles.formNoteText, { color: colors.inkMuted }]}>
                AI classification is an assessment only. It does not verify your report.
              </Text>
            </View>
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 20 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: -1, lineHeight: 30, marginTop: 6 },
  introSub: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  ragBrief: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  insightIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  briefTitle: { fontSize: 12, fontWeight: '700' },
  briefBody: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  sectionTitle: { marginTop: 24, marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  disasterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  disasterButton: {
    width: '48%',
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disasterText: { fontSize: 12, fontWeight: '600' },
  guidancePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  centeredButtonRow: {
    alignItems: 'center',
  },
  centeredButton: {
    width: '100%',
  },
  reportForm: { gap: 16 },
  selectedSummary: { padding: 12, borderRadius: radius.sm, gap: 6 },
  selectedSummaryText: { fontSize: 12, fontWeight: '700', lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 7 },
  inputWithIcon: { position: 'relative', justifyContent: 'center' },
  input: { height: 48, paddingHorizontal: 13, borderWidth: 1, borderRadius: radius.sm, fontSize: 13 },
  inputPadded: { paddingRight: 38 },
  inputIcon: { position: 'absolute', right: 14 },
  textarea: {
    minHeight: 96,
    padding: 13,
    borderWidth: 1,
    borderRadius: radius.sm,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  photoUpload: {
    minHeight: 50,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  photoUploadLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  photoUploadText: { fontSize: 12, flexShrink: 1 },
  formNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  formNoteText: { fontSize: 10, flex: 1 },
  successState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 10 },
  successIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  successBody: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10, marginBottom: 26 },
  successActions: { width: '100%', gap: 10 },
});
