import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAppTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';

export type LegalSection = {
  heading: string;
  body: string[]; // one or more paragraphs, rendered as separate <Text> blocks
};

type Props = {
  title: string;
  eyebrow: string;
  lastUpdated: string; // e.g. "September 10, 2026" — plain display string, not parsed
  intro: string;
  sections: LegalSection[];
};

/**
 * Shared renderer for privacy-policy.tsx and terms.tsx — both are static,
 * long-form legal copy with the same shape (title, last-updated date,
 * intro paragraph, then a list of headed sections), so this is the one
 * place that owns their typography instead of duplicating it across two
 * near-identical screens.
 */
export function LegalDocument({ title, eyebrow, lastUpdated, intro, sections }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title={title} onBack={() => router.back()} />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.lastUpdated, { color: colors.inkMuted }]}>Last updated {lastUpdated}</Text>
          <Text style={[styles.introText, { color: colors.inkMuted }]}>{intro}</Text>
        </View>

        {sections.map((section, index) => (
          <View key={section.heading} style={[styles.section, index === 0 && styles.firstSection]}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{section.heading}</Text>
            {section.body.map((paragraph, pIndex) => (
              <Text key={pIndex} style={[styles.paragraph, { color: colors.inkMuted }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 8 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.8, marginTop: 6, lineHeight: 27 },
  lastUpdated: { fontSize: 11, fontWeight: '600', marginTop: 8 },
  introText: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  section: { marginTop: 22 },
  firstSection: { marginTop: 18 },
  sectionHeading: { fontSize: 14, fontWeight: '800', letterSpacing: -0.2, marginBottom: 8 },
  paragraph: { fontSize: 12.5, lineHeight: 19, marginBottom: 8 },
});
