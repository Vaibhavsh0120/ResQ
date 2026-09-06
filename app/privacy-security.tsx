import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, LockKeyhole, MapPin, ShieldCheck, Users } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';

/** Settings screen covering what data ResQ uses and who can see it. */
export default function PrivacySecurity() {
  const { colors } = useAppTheme();
  const [locationSharing, setLocationSharing] = useState(true);
  const [circleVisibility, setCircleVisibility] = useState(true);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header title="Privacy & security" onBack={() => router.back()} />
      <Screen>
        <View style={styles.intro}>
          <Eyebrow>YOUR DATA, YOUR CONTROL</Eyebrow>
          <Text style={[styles.h1, { color: colors.foreground }]}>What ResQ shares, and with whom.</Text>
        </View>

        <View style={styles.list}>
          <ToggleRow
            icon={<MapPin size={18} color={colors.foreground} />}
            title="Share live location"
            subtitle="Lets your circle see your location during an active check-in"
            on={locationSharing}
            onPress={() => setLocationSharing((v) => !v)}
          />
          <ToggleRow
            icon={<Users size={18} color={colors.foreground} />}
            title="Visible to my circle"
            subtitle="Your safety status is visible to people in your family circle"
            on={circleVisibility}
            onPress={() => setCircleVisibility((v) => !v)}
          />
        </View>

        <View style={styles.sectionHeading}>
          <Eyebrow>HOW YOUR DATA IS USED</Eyebrow>
        </View>

        <View style={[styles.infoCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.brandSoft }]}>
            <ShieldCheck size={17} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Incident reports</Text>
            <Text style={[styles.infoSubtitle, { color: colors.inkMuted }]}>
              Reports you submit are marked as reported, not verified, and are used to improve local
              awareness. They are not shared with your family circle automatically.
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { borderColor: colors.line, backgroundColor: colors.surface }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.brandSoft }]}>
            <LockKeyhole size={17} color={colors.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Profile details</Text>
            <Text style={[styles.infoSubtitle, { color: colors.inkMuted }]}>
              Your name, contact info, and emergency note are only visible to you unless you choose to
              share them with someone in your circle.
            </Text>
          </View>
        </View>

        <Pressable style={[styles.linkRow, { borderColor: colors.line }]}>
          <Text style={[styles.linkText, { color: colors.brand }]}>Download my data</Text>
        </Pressable>
        <Pressable style={[styles.linkRow, { borderColor: colors.line }]}>
          <Text style={[styles.linkText, { color: colors.danger }]}>Delete my account</Text>
        </Pressable>
      </Screen>
    </View>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  on,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  on: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderColor: colors.line, backgroundColor: colors.surface }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={title}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.brandSoft }]}>{icon}</View>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.inkMuted }]}>{subtitle}</Text>
      </View>
      <View style={[styles.toggleTrack, { backgroundColor: on ? colors.brand : colors.line }]}>
        <View style={[styles.toggleThumb, { backgroundColor: colors.controlThumb }, on && styles.toggleThumbOn]}>
          {on && <Check size={9} color={colors.brand} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { marginTop: 10, marginBottom: 20 },
  h1: { fontSize: 21, fontWeight: '800', letterSpacing: -0.7, marginTop: 6, lineHeight: 26 },
  list: { gap: 8, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowSubtitle: { fontSize: 10, marginTop: 3, lineHeight: 14 },
  toggleTrack: { width: 30, height: 18, borderRadius: radius.pill, padding: 2, justifyContent: 'center' },
  toggleThumb: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  toggleThumbOn: { marginLeft: 12 },
  sectionHeading: { marginTop: 24, marginBottom: 12 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderWidth: 1, borderRadius: radius.md, marginBottom: 10 },
  infoIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 13, fontWeight: '700' },
  infoSubtitle: { fontSize: 11, marginTop: 4, lineHeight: 16 },
  linkRow: { paddingVertical: 14, borderBottomWidth: 1, marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: '700' },
});
