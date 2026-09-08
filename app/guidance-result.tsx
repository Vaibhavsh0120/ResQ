import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Check, LifeBuoy, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useGuidance } from '@/hooks/useGuidance';

export default function GuidanceResult() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ types?: string }>();
  const types = (params.types ?? '').split(',').filter(Boolean);
  const { data: guidance, loading, error, load } = useGuidance();

  useEffect(() => {
    load(types.length ? types : ['general']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.types]);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Your guidance" onBack={() => router.back()} />
      <Screen>
        {loading && <LoadingState label="Retrieving verified guidance..." />}
        {!loading && error && <ErrorState message={error} onRetry={() => load(types.length ? types : ['general'])} />}

        {!loading && !error && guidance && (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.brandDeep, shadowColor: colors.shadowBrand }]}>
              <View style={styles.heroTop}>
                <View style={[styles.heroIcon, { backgroundColor: colors.onBrandOverlaySoft }]}>
                  <AlertTriangle size={20} color={colors.onBrand} />
                </View>
                {guidance.confidence && (
                  <View style={[styles.confidenceBadge, { backgroundColor: colors.onBrandOverlaySoft }]}>
                    <Text style={[styles.confidenceText, { color: colors.onBrand }]}>
                      {guidance.confidence === 'high' ? 'Well-supported' : guidance.confidence === 'medium' ? 'Good match' : 'Limited match'}
                    </Text>
                  </View>
                )}
              </View>
              <Eyebrow light>GUIDANCE FOR</Eyebrow>
              <Text style={[styles.heroTitle, { color: colors.onBrand }]}>{guidance.disasterType}</Text>
              <Text style={[styles.heroSub, { color: colors.onBrandMuted }]}>{guidance.why}</Text>
            </View>

            <View style={styles.sectionHeading}>
              <Eyebrow>DO THIS NOW</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>Immediate steps</Text>
            </View>
            <View style={styles.stepsList}>
              {guidance.doThisNow.map((step) => (
                <View key={step} style={[styles.stepRow, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                  <View style={[styles.stepCheck, { backgroundColor: colors.brandSoft }]}>
                    <Check size={13} color={colors.brand} />
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionHeading}>
              <Eyebrow>AVOID</Eyebrow>
              <Text style={[styles.h2, { color: colors.foreground }]}>What not to do</Text>
            </View>
            <View style={styles.stepsList}>
              {guidance.avoid.map((step) => (
                <View key={step} style={[styles.stepRow, { borderColor: colors.line, backgroundColor: colors.dangerSoft }]}>
                  <View style={[styles.stepCheck, { backgroundColor: colors.surface }]}>
                    <AlertTriangle size={12} color={colors.danger} />
                  </View>
                  <Text style={[styles.stepText, { color: colors.foreground }]}>{step}</Text>
                </View>
              ))}
            </View>

            {guidance.sources.length > 0 && (
              <>
                <View style={styles.sectionHeading}>
                  <Eyebrow>SOURCES</Eyebrow>
                  <Text style={[styles.h2, { color: colors.foreground }]}>Where this comes from</Text>
                </View>
                <View style={styles.sourcesList}>
                  {guidance.sources.map((source) => (
                    <View key={source.id} style={[styles.sourceRow, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
                      <ShieldCheck size={15} color={colors.brand} />
                      <View style={styles.flex}>
                        <Text style={[styles.sourceTitle, { color: colors.foreground }]}>{source.title}</Text>
                        {source.publisher && <Text style={[styles.sourcePublisher, { color: colors.inkMuted }]}>{source.publisher}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={[styles.footerCard, { backgroundColor: colors.surfaceSoft }]}>
              <LifeBuoy size={17} color={colors.brand} />
              <Text style={[styles.footerText, { color: colors.inkMuted }]}>
                This guidance is generated from trusted sources and is not a substitute for instructions from local
                emergency authorities.
              </Text>
            </View>

            {/* replace, not push: this screen is a root-level sibling of the
                (tabs) group (see app/_layout.tsx), not a screen inside it.
                Confirmed by reading expo-router's own source
                (getNavigationAction.js): push is only auto-converted to a
                same-instance tab-focus when the *divergent* navigator
                between the current and target route is the tabs group
                itself. From here the divergent navigator is the root
                stack, so push would genuinely stack a second, separate
                (tabs) instance on top of whichever one is already open
                underneath this screen — back would then have to be
                pressed twice to actually leave. replace swaps this screen
                for a fresh (tabs) mount at the same stack position instead. */}
            <PrimaryButton title="Back to home" onPress={() => router.replace('/(tabs)')} variant="outline" />
          </>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heroCard: { borderRadius: radius.xl, padding: 20, marginTop: 10, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 1, shadowRadius: 26, elevation: 6 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  confidenceText: { fontSize: 9, fontWeight: '800' },
  heroTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -1, marginTop: 8, marginBottom: 10 },
  heroSub: { fontSize: 12, lineHeight: 18 },
  sectionHeading: { marginTop: 24, marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  stepsList: { gap: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 13, borderWidth: 1, borderRadius: radius.md },
  stepCheck: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sourcesList: { gap: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: radius.md },
  sourceTitle: { fontSize: 12, fontWeight: '700' },
  sourcePublisher: { fontSize: 10, marginTop: 2 },
  footerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, marginTop: 22, marginBottom: 18, borderRadius: radius.lg },
  footerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
