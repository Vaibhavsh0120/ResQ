import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Keyboard, Mic, Volume2 } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { IconButton } from '@/components/IconButton';
import { useHideTabBar } from '@/context/useHideTabBar';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

/**
 * Full-screen voice conversation with ResQ — reached from Home's "Ask
 * ResQ" composer row (see (tabs)/index.tsx) via its mic button, or by
 * opening a previously-saved voice conversation from chat.tsx's history
 * drawer (via the `threadId` param — see the effect below). Talk instead
 * of type: tap the orb to speak, ResQ replies with real text-to-speech
 * (expo-speech) and the orb animates while it's listening or talking,
 * driven by useVoiceAssistant's phase/amplitude state.
 *
 * Speech-to-text is real on both web (the browser's native
 * SpeechRecognition API — voiceService.web.ts) and native (wraps
 * expo-speech-recognition — voiceService.ts) as of 2026-09-12. The
 * native path is typechecked against the library's real API but not yet
 * verified on an actual device/simulator (no Xcode/Android Studio in the
 * environment that wired it) — see voiceService.ts's header comment and
 * README.md's "Voice input" section for exactly what to verify. If
 * `voiceAvailable` is ever false (recognition genuinely unsupported on
 * the device, or an unverified build issue), this screen falls back to a
 * typed-input composer instead of a mic button — the reply still comes
 * back with full text-to-speech and the same animated orb, so "talk to
 * ResQ" degrades to "type to ResQ, hear it reply" rather than silently
 * faking a transcript.
 */
export default function Voice() {
  useHideTabBar();
  const { colors } = useAppTheme();
  const { threadId } = useLocalSearchParams<{ threadId?: string }>();
  const {
    phase,
    turns,
    interimTranscript,
    amplitude,
    error,
    firstName,
    voiceAvailable,
    voiceUnavailableReason,
    startListening,
    stopListening,
    sendTyped,
    interrupt,
    loadThread,
    dismissError,
  } = useVoiceAssistant();

  useEffect(() => {
    if (threadId) loadThread(threadId);
    // Intentionally only on mount / if the param itself changes — not on
    // every loadThread identity change, which would refire this whenever
    // useVoiceAssistant re-renders for unrelated reasons (phase changes,
    // etc.) and interrupt an in-progress conversation the user is
    // actively having.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const [typedInput, setTypedInput] = useState('');
  const [showKeyboardInput, setShowKeyboardInput] = useState(!voiceAvailable);
  const scrollRef = useRef<ScrollView>(null);

  const scale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetScale = 1 + amplitude * 0.28;
    Animated.spring(scale, {
      toValue: targetScale,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6,
    }).start();
  }, [amplitude, scale]);

  useEffect(() => {
    const active = phase === 'listening' || phase === 'speaking';
    Animated.timing(ringOpacity, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [phase, ringOpacity]);

  useEffect(() => {
    if (turns.length > 0) {
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }, [turns, interimTranscript]);

  const close = () => {
    router.back();
  };

  const onOrbPress = () => {
    if (phase === 'listening') {
      stopListening();
    } else if (phase === 'speaking' || phase === 'thinking') {
      // Barge-in: stop ResQ mid-reply and start listening again right
      // away, instead of forcing the user to wait for it to finish
      // talking. `thinking` is included too — the reply hasn't started
      // streaming yet, but the same tap-to-interrupt intent applies:
      // the user wants to say something else now, not wait.
      interrupt();
    } else if (phase === 'idle' || phase === 'error') {
      if (error) dismissError();
      startListening();
    }
  };

  const onSendTyped = () => {
    const value = typedInput.trim();
    if (!value) return;
    sendTyped(value);
    setTypedInput('');
  };

  const statusCopy = (() => {
    if (error) return error;
    if (phase === 'listening') return interimTranscript || 'Listening...';
    if (phase === 'thinking') return 'Thinking...';
    if (phase === 'speaking') return voiceAvailable ? 'Speaking... tap or talk to interrupt' : 'Speaking...';
    if (turns.length === 0) {
      return voiceAvailable
        ? `Tap the mic and talk to ResQ${firstName ? `, ${firstName}` : ''}.`
        : 'Type a message — ResQ will reply out loud.';
    }
    return voiceAvailable ? 'Tap the mic to talk again.' : 'Type your next message.';
  })();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton label="Close voice conversation" onPress={close}>
          <ArrowLeft size={20} color={colors.foreground} />
        </IconButton>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]}>Talk to ResQ</Text>
        {voiceAvailable ? (
          <IconButton
            label={showKeyboardInput ? 'Switch to voice input' : 'Switch to typed input'}
            onPress={() => setShowKeyboardInput((v) => !v)}
            muted
          >
            <Keyboard size={17} color={colors.inkMuted} />
          </IconButton>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {turns.length > 0 && (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.transcriptList}
          showsVerticalScrollIndicator={false}
        >
          {turns.map((turn) => (
            <View key={turn.id} style={[styles.turnRow, turn.role === 'user' ? styles.turnRowUser : styles.turnRowBot]}>
              <View
                style={[
                  styles.turnBubble,
                  turn.role === 'user'
                    ? { backgroundColor: colors.brandDeep, borderBottomRightRadius: 4 }
                    : { backgroundColor: colors.surfaceSoft, borderBottomLeftRadius: 4 },
                ]}
              >
                <Text style={{ color: turn.role === 'user' ? colors.onBrand : colors.foreground, fontSize: 13, lineHeight: 19 }}>
                  {turn.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={[styles.orbSection, turns.length === 0 && styles.flex]}>
        <Text style={[styles.statusText, { color: error ? colors.danger : colors.inkMuted }]} numberOfLines={2}>
          {statusCopy}
        </Text>

        <View style={styles.orbStage}>
          <Animated.View
            style={[
              styles.orbRing,
              {
                borderColor: phase === 'speaking' ? colors.brand : colors.danger,
                opacity: ringOpacity,
                transform: [{ scale }],
              },
            ]}
          />
          <Pressable
            onPress={onOrbPress}
            disabled={!voiceAvailable && phase !== 'error'}
            accessibilityRole="button"
            accessibilityLabel={phase === 'listening' ? 'Stop listening' : 'Start talking to ResQ'}
            style={[
              styles.orb,
              {
                backgroundColor:
                  phase === 'speaking' ? colors.brandDeep : phase === 'listening' ? colors.danger : colors.surface,
                borderColor: colors.line,
                borderWidth: phase === 'idle' || phase === 'error' ? 1 : 0,
              },
            ]}
          >
            {phase === 'speaking' ? (
              <Volume2 size={30} color={colors.onBrand} />
            ) : phase === 'thinking' ? (
              <View style={styles.thinkingDots}>
                <ThinkingDot color={colors.brand} delay={0} />
                <ThinkingDot color={colors.brand} delay={150} />
                <ThinkingDot color={colors.brand} delay={300} />
              </View>
            ) : (
              <Mic size={30} color={phase === 'listening' ? colors.onDanger : colors.foreground} />
            )}
          </Pressable>
        </View>

        {!voiceAvailable && !showKeyboardInput && (
          <Text style={[styles.unavailableHint, { color: colors.inkFaint }]}>{voiceUnavailableReason}</Text>
        )}
      </View>

      {(showKeyboardInput || !voiceAvailable) && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={20}>
          <View style={[styles.composer, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
            <TextInput
              value={typedInput}
              onChangeText={setTypedInput}
              placeholder="Type your message..."
              placeholderTextColor={colors.inkMuted}
              style={[styles.composerInput, { color: colors.foreground }]}
              onSubmitEditing={onSendTyped}
              returnKeyType="send"
              editable={phase !== 'thinking'}
            />
            <Pressable onPress={onSendTyped} style={[styles.sendButton, { backgroundColor: colors.brandDeep }]} accessibilityLabel="Send message">
              <Text style={[styles.sendButtonText, { color: colors.onBrand }]}>Send</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

/** One dot of the three-dot "thinking" indicator, pulsing on a staggered delay. */
function ThinkingDot({ color, delay }: { color: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true, delay }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, delay]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { width: 36, height: 36 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 8,
  },
  topBarTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  transcriptList: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  turnRow: { flexDirection: 'row' },
  turnRowUser: { justifyContent: 'flex-end' },
  turnRowBot: { justifyContent: 'flex-start' },
  turnBubble: {
    maxWidth: '83%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 15,
  },
  orbSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingHorizontal: 32,
    paddingBottom: 30,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
  },
  orbStage: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
  },
  orb: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unavailableHint: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 260,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 7,
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  composerInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  sendButton: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
