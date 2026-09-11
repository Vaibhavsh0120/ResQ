import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowLeft, Check, LifeBuoy, Phone, Users } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Screen } from '@/components/Screen';
import { useFamily } from '@/hooks/useFamily';
import { useCurrentArea } from '@/hooks/useCurrentArea';
import { useSosHistory } from '@/hooks/useSosHistory';
import { mapsLinkForCoords } from '@/utils/location';
import { useHideTabBar } from '@/context/useHideTabBar';

// India's unified emergency number — see PROGRESS.md's launch-market note
// (India first). Revisit this constant if/when ResQ supports other regions.
const EMERGENCY_NUMBER = '112';

// How long the user must hold the button before SOS fires.
const HOLD_DURATION_MS = 2500;
const HOLD_TICK_MS = 50;

type Phase = 'idle' | 'holding' | 'confirmed';

function haptic(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style).catch(() => {});
  }
}

function notifyHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }
}

/**
 * Full-screen SOS flow — reached from Home's SOS button (see app/(tabs)/
 * index.tsx). This is Phase 1's highest-priority item (PROGRESS.md §2.4):
 * onboarding has always promised SOS behavior, but no trigger existed
 * anywhere in the app until now.
 *
 * Deliberate-trigger design: the button must be held for HOLD_DURATION_MS,
 * not tapped, so a pocket-press or accidental tap can't fire it. Releasing
 * early safely resets. Once fired, the two actions this can honestly take
 * with zero backend are: open `tel:112` (the user still has to tap call —
 * iOS/Android don't allow apps to place calls without a confirmation
 * dialog, and pretending otherwise would be dishonest) and open one SMS
 * share sheet per family member who has a phone number on file, matching
 * the existing tel:/sms: pattern already used in family-member.tsx.
 *
 * Runs against `useFamily()`, which is backed by mockFamily.ts today — this
 * intentionally does not wait on onboarding persistence (PROGRESS.md §7
 * explicitly calls this out as fine to build in parallel).
 *
 * **2026-09-09**: the SMS body and history log now include a real Google
 * Maps link built from `useCurrentArea()`'s live device coordinates (see
 * useDeviceLocation.ts) when a GPS fix is available, falling back to the
 * free-text area string exactly as before when it isn't (permission
 * denied, still loading, etc.) — this is the change onboarding's own
 * emergency-contacts copy ("immediately alerted with your live location")
 * has been promising since before Phase 1 started.
 */
export default function Sos() {
  useHideTabBar();
  const { colors } = useAppTheme();
  const { members } = useFamily();
  const { area, latitude, longitude } = useCurrentArea();
  const { logEvent } = useSosHistory();

  // Onboarding's emergency-contacts copy has always promised contacts are
  // "immediately alerted with your live location" — until now this sent
  // only the free-text area string. With useDeviceLocation() wired through
  // useCurrentArea(), a real fix (when permission is granted and one has
  // resolved) upgrades both the SMS body and the history log below to an
  // actual maps link, not just a place name. Falls back to the area string
  // exactly as before when no fix is available yet (e.g. permission denied,
  // or still loading) — this is a strict upgrade, never a regression.
  const hasCoords = latitude != null && longitude != null;
  const locationSummary = hasCoords ? `${area ? `${area} — ` : ''}${mapsLinkForCoords(latitude as number, longitude as number)}` : area;

  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0); // 0..1 while holding
  const [calledEmergency, setCalledEmergency] = useState(false);
  const [messagedIds, setMessagedIds] = useState<Set<string>>(new Set());
  const [logged, setLogged] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const contactsWithPhone = (members ?? []).filter((m) => !!m.phone);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const fire = useCallback(async () => {
    clearTimer();
    setPhase('confirmed');
    setProgress(1);
    notifyHaptic();

    // Log immediately (with whatever we know so far) so a history entry
    // exists even if the user backs out before tapping the call/message
    // buttons below — the activation itself is the safety-relevant event.
    if (!logged) {
      setLogged(true);
      await logEvent({
        calledEmergencyNumber: false,
        contactsNotified: [],
        location: locationSummary,
      });
    }
  }, [clearTimer, locationSummary, logEvent, logged]);

  const startHold = () => {
    if (phase !== 'idle') return;
    setPhase('holding');
    elapsedRef.current = 0;
    haptic(Haptics.ImpactFeedbackStyle.Light);
    intervalRef.current = setInterval(() => {
      elapsedRef.current += HOLD_TICK_MS;
      const pct = Math.min(1, elapsedRef.current / HOLD_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        fire();
      }
    }, HOLD_TICK_MS);
  };

  const cancelHold = () => {
    if (phase !== 'holding') return;
    clearTimer();
    setPhase('idle');
    setProgress(0);
  };

  const callEmergency = () => {
    setCalledEmergency(true);
    Linking.openURL(`tel:${EMERGENCY_NUMBER}`);
  };

  const messageContact = (memberId: string, phone: string) => {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const locationClause = hasCoords
      ? ` — my current location: ${mapsLinkForCoords(latitude as number, longitude as number)}`
      : area
        ? ` — my last known area is ${area}`
        : '';
    const body = encodeURIComponent(`This is an SOS from ResQ. I need help${locationClause}. Please call me or emergency services if you can't reach me.`);
    Linking.openURL(`sms:${phone}${separator}body=${body}`);
    setMessagedIds((current) => new Set(current).add(memberId));
  };

  const messageAll = () => {
    contactsWithPhone.forEach((m) => messageContact(m.id, m.phone as string));
  };

  // Re-log with the final call/message state once the user has actually
  // taken those actions, so history reflects what really happened rather
  // than just "SOS was activated". This intentionally overwrites nothing —
  // it's a second entry's worth of truth captured in the same event via a
  // fresh log call would double-count, so instead we just keep local state
  // as the source of truth for this screen and only write once more, on
  // exit, if anything changed since the initial log.
  const finalizeAndClose = async () => {
    if (logged && (calledEmergency || messagedIds.size > 0)) {
      await logEvent({
        calledEmergencyNumber: calledEmergency,
        contactsNotified: contactsWithPhone
          .filter((m) => messagedIds.has(m.id))
          .map((m) => ({ id: m.id, name: m.name })),
        location: locationSummary,
      });
    }
    // replace, not back — SOS is now reached via router.replace from Home
    // (see (tabs)/index.tsx), so there's no Home entry left underneath to
    // pop back to.
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: 54 }]}>
        <Pressable
          onPress={phase === 'confirmed' ? finalizeAndClose : () => router.replace('/(tabs)')}
          accessibilityLabel="Close SOS"
          accessibilityRole="button"
          style={[styles.closeButton, { backgroundColor: colors.surface }]}
          hitSlop={8}
        >
          {phase === 'confirmed' ? <Check size={18} color={colors.foreground} /> : <ArrowLeft size={18} color={colors.foreground} />}
        </Pressable>
      </View>

      <Screen scroll={false} contentStyle={styles.body}>
        {phase !== 'confirmed' ? (
          <View style={styles.triggerWrap}>
            <Text style={[styles.title, { color: colors.foreground }]}>Emergency SOS</Text>
            <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
              Press and hold the button below for a few seconds to alert your emergency contacts and call {EMERGENCY_NUMBER}.
            </Text>

            <View style={styles.buttonStage}>
              <View
                style={[
                  styles.progressRing,
                  {
                    borderColor: colors.dangerSoft,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      borderColor: colors.danger,
                      opacity: progress > 0 ? 1 : 0,
                      transform: [{ scale: 0.9 + progress * 0.1 }],
                    },
                  ]}
                />
                <Pressable
                  onPressIn={startHold}
                  onPressOut={cancelHold}
                  accessibilityLabel="Hold to activate SOS"
                  accessibilityRole="button"
                  accessibilityHint="Press and hold for a few seconds to send an SOS alert"
                  style={[styles.sosButton, { backgroundColor: colors.danger }]}
                >
                  <LifeBuoy size={34} color={colors.onDanger} />
                  <Text style={[styles.sosButtonLabel, { color: colors.onDanger }]}>
                    {phase === 'holding' ? 'Keep holding...' : 'HOLD FOR SOS'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text style={[styles.hint, { color: colors.inkFaint }]}>
              Release early to cancel. Nothing is sent until the hold completes.
            </Text>
          </View>
        ) : (
          <View style={styles.confirmedWrap}>
            <View style={[styles.confirmedBadge, { backgroundColor: colors.dangerSoft }]}>
              <LifeBuoy size={28} color={colors.danger} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>SOS activated</Text>
            <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
              This is logged in your SOS history. Now reach the people who can actually help:
            </Text>

            <Pressable
              onPress={callEmergency}
              style={[styles.actionRow, { backgroundColor: colors.danger }]}
              accessibilityRole="button"
            >
              <Phone size={19} color={colors.onDanger} />
              <View style={styles.flex}>
                <Text style={[styles.actionTitle, { color: colors.onDanger }]}>Call {EMERGENCY_NUMBER}</Text>
                <Text style={[styles.actionSubtitle, { color: colors.onDanger }]}>India's unified emergency number</Text>
              </View>
              {calledEmergency && <Check size={18} color={colors.onDanger} />}
            </Pressable>

            {contactsWithPhone.length > 0 ? (
              <>
                <Pressable
                  onPress={messageAll}
                  style={[styles.actionRow, { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1 }]}
                  accessibilityRole="button"
                >
                  <Users size={19} color={colors.foreground} />
                  <View style={styles.flex}>
                    <Text style={[styles.actionTitle, { color: colors.foreground }]}>
                      Message all {contactsWithPhone.length} contact{contactsWithPhone.length === 1 ? '' : 's'}
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: colors.inkMuted }]}>Opens a message to each, one at a time</Text>
                  </View>
                </Pressable>

                <View style={styles.contactList}>
                  {contactsWithPhone.map((member) => (
                    <Pressable
                      key={member.id}
                      onPress={() => messageContact(member.id, member.phone as string)}
                      style={[styles.contactRow, { borderColor: colors.line, backgroundColor: colors.surface }]}
                    >
                      <View style={[styles.contactAvatar, { backgroundColor: colors.brandSoft }]}>
                        <Text style={[styles.contactInitials, { color: colors.brandDeep }]}>{member.initials}</Text>
                      </View>
                      <View style={styles.flex}>
                        <Text style={[styles.contactName, { color: colors.foreground }]}>{member.name}</Text>
                        <Text style={[styles.contactRelation, { color: colors.inkMuted }]}>{member.relation}</Text>
                      </View>
                      {messagedIds.has(member.id) && <Check size={16} color={colors.brand} />}
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View style={[styles.noContactsCard, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
                <Text style={[styles.noContactsText, { color: colors.inkMuted }]}>
                  None of your family circle has a phone number on file yet, so there's no one to message directly. Add a
                  number from the Family tab so SOS can reach them next time.
                </Text>
              </View>
            )}

            <Pressable onPress={finalizeAndClose} style={styles.doneButton}>
              <Text style={[styles.doneButtonText, { color: colors.inkMuted }]}>I'm done — close SOS</Text>
            </Pressable>
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  triggerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 4,
  },
  buttonStage: {
    marginTop: 40,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 6,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sosButtonLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
  },
  confirmedWrap: {
    paddingTop: 12,
    alignItems: 'center',
    gap: 4,
  },
  confirmedBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: 15,
    borderRadius: radius.lg,
    marginTop: 18,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  contactList: {
    width: '100%',
    gap: 8,
    marginTop: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  contactAvatar: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitials: {
    fontSize: 11,
    fontWeight: '800',
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
  },
  contactRelation: {
    fontSize: 10,
    marginTop: 2,
  },
  noContactsCard: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: 18,
  },
  noContactsText: {
    fontSize: 11,
    lineHeight: 16,
  },
  doneButton: {
    marginTop: 26,
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
