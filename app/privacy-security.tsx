import React, { useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, Check, LockKeyhole, MapPin, ShieldCheck, Users, X } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { Eyebrow } from '@/components/Eyebrow';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { exportLocalData, wipeLocalData } from '@/services/localDataService';

/** Settings screen covering what data ResQ uses and who can see it. */
export default function PrivacySecurity() {
  const { colors } = useAppTheme();
  const { logout } = useAuth();
  const [locationSharing, setLocationSharing] = useState(true);
  const [circleVisibility, setCircleVisibility] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onDownloadData = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const data = await exportLocalData();
      // No backend yet (see PROGRESS.md — this is device-local data
      // only), so this shares the export via the OS share sheet rather
      // than uploading anywhere — the user can save it, AirDrop it,
      // email it to themselves, whatever they choose.
      await Share.share({
        title: 'My ResQ data',
        message: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Could not prepare your data export.');
    } finally {
      setExporting(false);
    }
  };

  const onConfirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await wipeLocalData();
      // No manual navigation needed — logout() flips isLoggedIn to
      // false, and the root layout's Stack.Protected guard removes every
      // authenticated screen's history and lands on /login on its own
      // (same pattern profile.tsx's sign-out button relies on).
      await logout();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete your account right now.');
      setDeleting(false);
    }
  };

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

        <Pressable onPress={onDownloadData} disabled={exporting} style={[styles.linkRow, { borderColor: colors.line }, exporting && styles.disabledRow]}>
          <Text style={[styles.linkText, { color: colors.brand }]}>{exporting ? 'Preparing your data...' : 'Download my data'}</Text>
        </Pressable>
        {exportError && <Text style={[styles.errorText, { color: colors.danger }]}>{exportError}</Text>}

        <Pressable onPress={() => setDeleteConfirmOpen(true)} style={[styles.linkRow, { borderColor: colors.line }]}>
          <Text style={[styles.linkText, { color: colors.danger }]}>Delete my account</Text>
        </Pressable>

        <Text style={[styles.footnote, { color: colors.inkMuted }]}>
          There's no server behind ResQ yet, so both actions above work entirely with the data already
          stored on this device.
        </Text>
      </Screen>

      <Modal visible={deleteConfirmOpen} transparent animationType="fade" onRequestClose={() => setDeleteConfirmOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => !deleting && setDeleteConfirmOpen(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: colors.surface, borderColor: colors.line }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.confirmHeader}>
              <View style={[styles.confirmIcon, { backgroundColor: colors.dangerSoft }]}>
                <AlertTriangle size={20} color={colors.danger} />
              </View>
              {!deleting && (
                <Pressable onPress={() => setDeleteConfirmOpen(false)} hitSlop={8}>
                  <X size={18} color={colors.inkMuted} />
                </Pressable>
              )}
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Delete your account?</Text>
            <Text style={[styles.confirmBody, { color: colors.inkMuted }]}>
              This permanently erases everything stored on this device — your profile, family circle,
              readiness progress, and settings. This can't be undone.
            </Text>
            {deleteError && <Text style={[styles.errorText, { color: colors.danger }]}>{deleteError}</Text>}
            <PrimaryButton title="Delete everything" onPress={onConfirmDelete} loading={deleting} variant="danger" />
            {!deleting && (
              <Pressable onPress={() => setDeleteConfirmOpen(false)} style={styles.cancelRow}>
                <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  disabledRow: { opacity: 0.5 },
  errorText: { fontSize: 11, lineHeight: 16, marginTop: 6 },
  footnote: { fontSize: 10, lineHeight: 15, marginTop: 20, marginBottom: 8 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 360, padding: 20, borderWidth: 1, borderRadius: radius.lg, gap: 6 },
  confirmHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  confirmIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  confirmBody: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cancelRow: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 13, fontWeight: '700' },
});
