import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CarFront, CloudRain, HomeIcon, ShieldCheck } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { LoadingState, ErrorState } from '@/components/AsyncState';
import { useUpdates } from '@/hooks/useUpdates';
import { UpdateTone } from '@/types';

const ICONS = { CloudRain, Home: HomeIcon, CarFront };

/** Drill-in screen for a single live update, reached by tapping a card on the Updates tab. */
export default function UpdateDetail() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: updates, loading, error, refresh } = useUpdates();

  const update = (updates ?? []).find((u) => u.id === id);

  const toneColor = (tone: UpdateTone) =>
    tone === 'warning' ? colors.warning : tone === 'success' ? colors.brand : colors.danger;
  const toneBg = (tone: UpdateTone) =>
    tone === 'warning' ? colors.warningSoft : tone === 'success' ? colors.brandSoft : colors.dangerSoft;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Update" onBack={() => router.back()} />
      <Screen>
        {loading && <LoadingState label="Loading this update..." />}
        {!loading && error && <ErrorState message={error} onRetry={refresh} />}

        {!loading && !error && !update && (
          <View style={styles.notFound}>
            <Text style={[styles.notFoundText, { color: colors.inkMuted }]}>
              This update is no longer available.
            </Text>
          </View>
        )}

        {!loading && !error && update && (
          <>
            <View style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: toneBg(update.tone) }]}>
                {(() => {
                  const Icon = ICONS[update.iconName];
                  return <Icon size={24} color={toneColor(update.tone)} />;
                })()}
              </View>
              <Eyebrow>{update.detail}</Eyebrow>
              <Text style={[styles.title, { color: colors.foreground }]}>{update.title}</Text>
            </View>

            <View style={[styles.bodyCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                {bodyCopyFor(update.title)}
              </Text>
            </View>

            {update.source && (
              <>
                <View style={styles.sectionHeading}>
                  <Eyebrow>SOURCE</Eyebrow>
                  <Text style={[styles.h2, { color: colors.foreground }]}>Where this comes from</Text>
                </View>
                <View style={[styles.sourceRow, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
                  <ShieldCheck size={15} color={colors.brand} />
                  <View style={styles.flex}>
                    <Text style={[styles.sourceTitle, { color: colors.foreground }]}>{update.source.title}</Text>
                    {update.source.publisher && (
                      <Text style={[styles.sourcePublisher, { color: colors.inkMuted }]}>{update.source.publisher}</Text>
                    )}
                  </View>
                </View>
              </>
            )}

            <PrimaryButton title="Back to updates" variant="outline" onPress={() => router.back()} style={styles.backButton} />
          </>
        )}
      </Screen>
    </View>
  );
}

// Mock detail copy — a real backend would return full update body text.
// Keyed by title so this stays stable if mock data order changes.
function bodyCopyFor(title: string): string {
  if (title.toLowerCase().includes('rain')) {
    return 'Forecasters expect sustained heavy rainfall overnight, with the heaviest bands moving through between 10pm and 3am. Low-lying areas near the river may see localized flooding. Avoid unnecessary travel during this window and move any vehicles away from known flood-prone streets.';
  }
  if (title.toLowerCase().includes('community hall')) {
    return 'Riverside Community Hall has reopened its doors and is accepting walk-ins. Volunteers on site can help with supplies, phone charging, and connecting with family. No registration or ID required to enter.';
  }
  if (title.toLowerCase().includes('road closure')) {
    return 'A community member reported a road closure near Northside, likely due to standing water or debris. This has not yet been independently verified. If you\u2019re in the area, consider an alternate route and report back if conditions change.';
  }
  return 'More detail on this update will appear here as it becomes available.';
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notFound: { paddingTop: 40, alignItems: 'center' },
  notFoundText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  hero: { alignItems: 'flex-start', marginTop: 10, marginBottom: 18, gap: 8 },
  heroIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.6, lineHeight: 26 },
  bodyCard: { padding: 15, borderWidth: 1, borderRadius: radius.lg, marginBottom: 22 },
  bodyText: { fontSize: 13, lineHeight: 21 },
  sectionHeading: { marginBottom: 12 },
  h2: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: radius.md, marginBottom: 24 },
  sourceTitle: { fontSize: 12, fontWeight: '700' },
  sourcePublisher: { fontSize: 10, marginTop: 2 },
  backButton: { marginTop: 4 },
});
