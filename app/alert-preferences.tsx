import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, CarFront, CloudRain, ShieldCheck, Users } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';

type PreferenceKey = 'weather' | 'community' | 'traffic' | 'family';

const PREFERENCES: { key: PreferenceKey; icon: React.ComponentType<{ size?: number; color?: string }>; title: string; subtitle: string }[] = [
  { key: 'weather', icon: CloudRain, title: 'Weather alerts', subtitle: 'Storms, flooding, and extreme heat warnings' },
  { key: 'community', icon: ShieldCheck, title: 'Community updates', subtitle: 'Shelter openings and neighborhood notices' },
  { key: 'traffic', icon: CarFront, title: 'Road & traffic', subtitle: 'Closures and hazards reported nearby' },
  { key: 'family', icon: Users, title: 'Family check-ins', subtitle: "When someone in your circle checks in or needs help" },
];

/** Settings screen for choosing which categories of live updates trigger a notification. */
export default function AlertPreferences() {
  const { colors } = useAppTheme();
  const [enabled, setEnabled] = useState<Record<PreferenceKey, boolean>>({
    weather: true,
    community: true,
    traffic: false,
    family: true,
  });

  const toggle = (key: PreferenceKey) => setEnabled((current) => ({ ...current, [key]: !current[key] }));

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Alert preferences" onBack={() => router.back()} />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>CHOOSE WHAT MATTERS</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>Only hear about what you need.</Text>
          <Text style={[styles.introSub, { color: colors.inkMuted }]}>
            Turn categories on or off. You can change this anytime.
          </Text>
        </View>

        <View style={styles.list}>
          {PREFERENCES.map(({ key, icon: Icon, title, subtitle }) => (
            <Pressable
              key={key}
              onPress={() => toggle(key)}
              style={[styles.row, { borderColor: colors.line, backgroundColor: colors.surface }]}
              accessibilityRole="switch"
              accessibilityState={{ checked: enabled[key] }}
              accessibilityLabel={title}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.brandSoft }]}>
                <Icon size={18} color={colors.brand} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
                <Text style={[styles.rowSubtitle, { color: colors.inkMuted }]}>{subtitle}</Text>
              </View>
              <View style={[styles.toggleTrack, { backgroundColor: enabled[key] ? colors.brand : colors.line }]}>
                <View style={[styles.toggleThumb, { backgroundColor: colors.controlThumb }, enabled[key] && styles.toggleThumbOn]} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.footerCard, { backgroundColor: colors.surfaceSoft }]}>
          <Bell size={17} color={colors.brand} />
          <Text style={[styles.footerText, { color: colors.inkMuted }]}>
            Critical safety alerts for your area are always delivered, even with categories turned off.
          </Text>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 22 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.8, marginTop: 6, lineHeight: 27 },
  introSub: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowSubtitle: { fontSize: 10, marginTop: 3, lineHeight: 14 },
  toggleTrack: { width: 30, height: 18, borderRadius: radius.pill, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 14, height: 14, borderRadius: 7 },
  toggleThumbOn: { marginLeft: 12 },
  footerCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, marginTop: 20, borderRadius: radius.lg },
  footerText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
