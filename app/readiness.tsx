import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  BriefcaseMedical,
  Check,
  Droplets,
  Flashlight,
  Radio,
  ShieldCheck,
  Users,
} from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useReadiness } from '@/hooks/useReadiness';

const STEP_ICONS = { BriefcaseMedical, Droplets, Flashlight, Radio };

export default function Readiness() {
  const { colors } = useAppTheme();
  const { data: readiness, loading, error, refresh, toggleItem } = useReadiness();

  const doneCount = readiness?.checklist.filter((i) => i.done).length ?? 0;
  const total = readiness?.checklist.length ?? 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Your readiness" onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      <Screen>
        {loading && <LoadingState label="Checking your readiness..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && readiness && (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.brandDeep, shadowColor: colors.shadowBrand }]}>
              <Eyebrow light>YOUR READINESS SCORE</Eyebrow>
              <View style={styles.heroRow}>
                <Text style={[styles.heroScore, { color: colors.onBrand }]}>{readiness.score}%</Text>
                <View style={[styles.heroRing, { backgroundColor: colors.onBrandOverlaySoft }]}>
                  <ShieldCheck size={28} color={colors.onBrand} />
                </View>
              </View>
              <Text style={[styles.heroSub, { color: colors.onBrandMuted }]}>
                You&apos;re ahead of most households in your area. A few small steps will get you even further.
              </Text>
            </View>

            <View style={styles.sectionHeading}>
              <Eyebrow>WHAT YOU&apos;VE DONE</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>
                {doneCount} of {total} essentials covered
              </Text>
            </View>

            <View style={styles.checklist}>
              {readiness.checklist.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.done }}
                  accessibilityLabel={item.label}
                  style={[styles.checklistRow, { borderColor: colors.line, backgroundColor: colors.surface }]}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: item.done ? colors.brand : 'transparent',
                        borderColor: item.done ? colors.brand : colors.line,
                      },
                    ]}
                  >
                    {item.done && <Check size={13} color={colors.onBrand} />}
                  </View>
                  <Text style={[styles.checklistLabel, { color: item.done ? colors.foreground : colors.inkMuted }]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sectionHeading}>
              <Eyebrow>KEEP GOING</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>Good things to do next</Text>
            </View>

            <View style={styles.stepsList}>
              {readiness.nextSteps.map((step) => {
                const Icon = STEP_ICONS[step.iconName];
                return (
                  <View key={step.id} style={[styles.stepCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                    <View style={[styles.stepIcon, { backgroundColor: colors.brandSoft }]}>
                      <Icon size={18} color={colors.brand} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                      <Text style={[styles.stepDetail, { color: colors.inkMuted }]}>{step.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[styles.tipCard, { backgroundColor: colors.surfaceSoft }]}>
              <View style={[styles.tipIcon, { backgroundColor: colors.brandSoft }]}>
                <Users size={17} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.tipTitle, { color: colors.foreground }]}>Being prepared is a team effort.</Text>
                <Text style={[styles.tipBody, { color: colors.inkMuted }]}>
                  Share your plan with your family circle so everyone knows what to do.
                </Text>
              </View>
            </View>
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroCard: { borderRadius: radius.xl, padding: 20, marginTop: 10, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 1, shadowRadius: 26, elevation: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 12 },
  heroScore: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5 },
  heroRing: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroSub: { fontSize: 12, lineHeight: 18 },
  sectionHeading: { marginTop: 26, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  checklist: { gap: 8 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md },
  checkCircle: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checklistLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  stepsList: { gap: 9 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderRadius: radius.lg },
  stepIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 13, fontWeight: '700' },
  stepDetail: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  tipCard: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 20, marginBottom: 18, padding: 14, borderRadius: 15 },
  tipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 12, fontWeight: '700' },
  tipBody: { fontSize: 11, marginTop: 4, lineHeight: 16 },
});
