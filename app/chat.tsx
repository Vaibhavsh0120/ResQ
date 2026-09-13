import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight, Menu, MessageCircle, Mic, Plus, Send, ShieldCheck, Sparkles, X } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header, HEADER_CONTENT_HEIGHT } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { useHideTabBar } from '@/context/useHideTabBar';
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible';
import { useChat } from '@/hooks/useChat';
import { useChatThreads } from '@/hooks/useChatThreads';
import { mockChatSuggestions } from '@/data/mockChat';
import { timeAgo } from '@/utils/format';

const DRAWER_WIDTH_FRACTION = 0.78;
// Approximation of styles.drawer's '78%' width in raw pixels, needed
// because reanimated's worklets (running on the UI thread) can't read a
// percentage string against the live layout the way RN style resolution
// does — see the drawer's onLayout below, which replaces this with the
// real measured width the first time it's known.
const FALLBACK_DRAWER_WIDTH = 320;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Real conversations save `updatedAt` as an ISO timestamp
 * (chatService.ts's saveChatThread); the 3 example seed threads use a
 * fixed human string ("Earlier this week") since they were never
 * "really" updated at a specific moment. Rendering an ISO timestamp
 * through timeAgo() gives a real "12 min ago"-style label for actual
 * conversations, while the seed examples just display their string as-is
 * (Date parsing it yields Invalid Date, which is the deliberate signal to
 * fall back rather than something to guard against as an error case).
 */
function formatThreadTimestamp(updatedAt: string): string {
  const parsed = new Date(updatedAt);
  return Number.isNaN(parsed.getTime()) ? updatedAt : timeAgo(updatedAt);
}

export default function Chat() {
  useHideTabBar();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  // Set by guidance-result.tsx's "Continue chat with ResQ" button (via
  // router.push({ pathname: '/chat', params: { topic } })) so a guidance
  // topic can be picked up right where it left off, without the user
  // having to retype what they just read. Optional — every other way of
  // reaching this screen (Home's composer, the tab bar) has no such
  // param, and behaves exactly as before.
  const { topic } = useLocalSearchParams<{ topic?: string }>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { messages, sending, send, startNewConversation, loadThread, loadingThread, activeThreadId } = useChat();
  const { data: threads } = useChatThreads();
  const [input, setInput] = useState('');
  const [drawerWidth, setDrawerWidth] = useState(FALLBACK_DRAWER_WIDTH);
  const keyboardVisible = useKeyboardVisible();
  // Mic when there's nothing to send yet and the keyboard isn't up (the
  // natural "I'd rather talk" moment) — send button the instant either
  // condition flips, since at that point there's something to actually
  // send. On web, useKeyboardVisible always reports false (no software
  // keyboard exists there), so this correctly collapses to "mic only
  // when the input is empty" on web rather than getting stuck showing
  // mic just because a keyboard visibility check can't apply.
  const showMicButton = !keyboardVisible && input.trim().length === 0;

  // Fires the topic exactly once per navigation into this screen with a
  // topic param — same immediate-send behavior as tapping one of the
  // suggestion chips below (onSend(s)), for consistency. Guarded by a
  // ref rather than clearing the param, since expo-router params aren't
  // straightforward to mutate from inside the screen that received them,
  // and a ref survives re-renders (keyboard open/close, etc.) without
  // re-firing, while still resetting naturally if the user navigates
  // here again with a *different* topic later.
  const sentTopicRef = useRef<string | null>(null);
  useEffect(() => {
    if (topic && sentTopicRef.current !== topic) {
      sentTopicRef.current = topic;
      send(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  // Drives the drawer's slide-in/out and the backdrop's fade, and doubles
  // as the swipe gesture's live offset: 0 = fully open, -drawerWidth =
  // fully closed (slid off-screen to the left, since the drawer is
  // anchored to the left edge). A right-to-left swipe is the standard
  // iOS drawer-dismiss gesture — this adds it on top of the existing
  // tap-outside-to-close, which the Modal's onRequestClose/backdrop press
  // still handle unchanged.
  const translateX = useSharedValue(-FALLBACK_DRAWER_WIDTH);

  useEffect(() => {
    translateX.value = withTiming(historyOpen ? 0 : -drawerWidth, { duration: 220 });
  }, [historyOpen, drawerWidth, translateX]);

  const closeDrawer = () => setHistoryOpen(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onChange((event) => {
      // Only leftward drag (closing) moves the drawer; a rightward drag
      // while already fully open has nothing further to do.
      if (event.changeX < 0) {
        translateX.value = Math.max(-drawerWidth, Math.min(0, translateX.value + event.changeX));
      }
    })
    .onEnd((event) => {
      // Cross roughly a third of the drawer's width, or flick fast enough,
      // and treat it as a completed close — otherwise spring back open.
      const shouldClose = translateX.value < -drawerWidth / 3 || event.velocityX < -800;
      if (shouldClose) {
        translateX.value = withTiming(-drawerWidth, { duration: 180 });
        runOnJS(closeDrawer)();
      } else {
        translateX.value = withTiming(0, { duration: 180 });
      }
    });

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: drawerWidth > 0 ? 1 + translateX.value / drawerWidth : 0,
  }));

  const onSend = (value = input) => {
    if (!value.trim()) return;
    send(value);
    setInput('');
  };

  const onSelectThread = async (threadId: string, source: 'chat' | 'voice') => {
    setHistoryOpen(false);
    // Voice-sourced conversations resume on the voice page (real speech
    // in and out), not here — this screen only has a typed composer.
    // Text-sourced ones resume in place, same as before.
    if (source === 'voice') {
      router.push({ pathname: '/voice', params: { threadId } });
      return;
    }
    await loadThread(threadId);
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="Ask ResQ"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        action={
          <IconButton label="Open previous chats" onPress={() => setHistoryOpen(true)} muted>
            <Menu size={18} color={colors.inkMuted} />
          </IconButton>
        }
      />

      <Modal visible={historyOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.backdrop}>
          <AnimatedPressable
            style={[styles.backdropFill, { backgroundColor: colors.overlay }, backdropAnimatedStyle]}
            onPress={closeDrawer}
          />
          <GestureDetector gesture={panGesture}>
            <Animated.View
              onLayout={(e) => setDrawerWidth(e.nativeEvent.layout.width)}
              style={[
                styles.drawer,
                { backgroundColor: colors.surface, borderColor: colors.line, paddingTop: insets.top + 16 },
                drawerAnimatedStyle,
              ]}
            >
              <View style={styles.drawerHeader}>
                <Text style={[styles.drawerTitle, { color: colors.foreground }]}>Previous chats</Text>
                <IconButton label="Close previous chats" onPress={closeDrawer} muted>
                  <X size={17} color={colors.inkMuted} />
                </IconButton>
              </View>
              <Pressable
                style={[styles.newChatRow, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}
                onPress={() => {
                  startNewConversation();
                  setHistoryOpen(false);
                }}
              >
                <Sparkles size={16} color={colors.brand} />
                <Text style={[styles.newChatText, { color: colors.brand }]}>New conversation</Text>
                <Plus size={15} color={colors.brand} />
              </Pressable>
              {(threads ?? []).map((thread) => (
                <Pressable
                  key={thread.id}
                  style={[styles.historyRow, thread.id === activeThreadId && { backgroundColor: colors.surfaceSoft, borderRadius: radius.md }]}
                  onPress={() => onSelectThread(thread.id, thread.source)}
                >
                  {thread.source === 'voice' ? (
                    <Mic size={15} color={colors.foreground} />
                  ) : (
                    <MessageCircle size={15} color={colors.foreground} />
                  )}
                  <View style={styles.flex}>
                    <Text style={[styles.historyText, { color: colors.foreground }]}>{thread.title}</Text>
                    <Text style={[styles.historySubtext, { color: colors.inkMuted }]}>{formatThreadTimestamp(thread.updatedAt)}</Text>
                  </View>
                  <ChevronRight size={15} color={colors.inkMuted} />
                </Pressable>
              ))}
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        // Was a hardcoded 90 — right for some devices, too large for
        // others (leaving a visible gap between the composer and the
        // keyboard, since a larger offset means the view gets pushed up
        // *less* than the keyboard's real height). Header renders as a
        // sibling above this KeyboardAvoidingView, not inside it, so its
        // real on-screen height (insets.top + HEADER_CONTENT_HEIGHT —
        // see Header.tsx) is exactly what needs to be offset, and it
        // varies by device via insets.top (notch/Dynamic Island vs not).
        keyboardVerticalOffset={insets.top + HEADER_CONTENT_HEIGHT}
      >
        <View style={[styles.chatIntro, { borderColor: colors.line }]}>
          <View style={[styles.chatOrb, { backgroundColor: colors.brandSoft }]}>
            <Sparkles size={20} color={colors.brand} />
          </View>
          <View>
            <Text style={[styles.chatIntroTitle, { color: colors.foreground }]}>ResQ guide</Text>
            <Text style={[styles.chatIntroSubtitle, { color: colors.inkMuted }]}>
              {loadingThread ? 'Loading conversation...' : sending ? 'Typing...' : 'Usually replies instantly'}
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === 'user' ? styles.messageRowUser : styles.messageRowBot]}>
              <View style={styles.messageColumn}>
                <View
                  style={[
                    styles.messageBubble,
                    item.role === 'user'
                      ? { backgroundColor: colors.brandDeep, borderBottomRightRadius: 4 }
                      : { backgroundColor: colors.surfaceSoft, borderBottomLeftRadius: 4 },
                  ]}
                >
                  <Text style={{ color: item.role === 'user' ? colors.onBrand : colors.foreground, fontSize: 12, lineHeight: 18 }}>
                    {item.text || (item.pending ? '...' : '')}
                  </Text>
                </View>
                {!!item.sources?.length && (
                  <View style={styles.sourcesList}>
                    {item.sources.map((source) => (
                      <View key={source.id} style={[styles.sourceRow, { borderColor: colors.line, backgroundColor: colors.surface }]}>
                        <ShieldCheck size={12} color={colors.brand} />
                        <Text style={[styles.sourceText, { color: colors.inkMuted }]} numberOfLines={1}>
                          {source.title}
                          {source.publisher ? ` · ${source.publisher}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        />

        <View style={styles.suggestionsRow}>
          {mockChatSuggestions.map((s) => (
            <Pressable key={s} onPress={() => onSend(s)} style={[styles.suggestionChip, { borderColor: colors.line, backgroundColor: colors.surface }]}>
              <Text style={[styles.suggestionText, { color: colors.brand }]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <View
          style={[
            styles.composer,
            { borderColor: colors.line, backgroundColor: colors.surfaceSoft, marginBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything..."
            placeholderTextColor={colors.inkMuted}
            style={[styles.composerInput, { color: colors.foreground }]}
            onSubmitEditing={() => onSend()}
            returnKeyType="send"
          />
          <Pressable
            onPress={showMicButton ? () => router.push('/voice') : () => onSend()}
            style={[styles.sendButton, { backgroundColor: colors.brandDeep }]}
            accessibilityLabel={showMicButton ? 'Talk to ResQ' : 'Send message'}
          >
            {showMicButton ? <Mic size={17} color={colors.onBrand} /> : <Send size={17} color={colors.onBrand} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, flexDirection: 'row' },
  backdropFill: StyleSheet.absoluteFill,
  drawer: {
    width: `${DRAWER_WIDTH_FRACTION * 100}%`,
    height: '100%',
    padding: 16,
    borderRightWidth: 1,
    gap: 8,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  drawerTitle: { fontSize: 15, fontWeight: '700' },
  newChatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: radius.md, marginBottom: 8 },
  newChatText: { flex: 1, fontSize: 12, fontWeight: '700' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  historyText: { fontSize: 12 },
  historySubtext: { fontSize: 9, marginTop: 3 },
  chatIntro: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  chatOrb: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chatIntroTitle: { fontSize: 12, fontWeight: '700' },
  chatIntroSubtitle: { fontSize: 10, marginTop: 3 },
  messagesList: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  messageRow: { flexDirection: 'row' },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowBot: { justifyContent: 'flex-start' },
  messageColumn: { maxWidth: '83%', gap: 6 },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 15 },
  sourcesList: { gap: 4 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderRadius: radius.md },
  sourceText: { flex: 1, fontSize: 10 },
  suggestionsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 10, flexWrap: 'wrap' },
  suggestionChip: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderRadius: radius.pill },
  suggestionText: { fontSize: 10 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 20, padding: 7, borderWidth: 1, borderRadius: radius.lg },
  composerInput: { flex: 1, paddingHorizontal: 7, fontSize: 12 },
  sendButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
