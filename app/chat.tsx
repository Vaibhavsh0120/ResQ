import React, { useEffect, useState } from 'react';
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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ChevronRight, Menu, MessageCircle, Plus, Send, ShieldCheck, Sparkles, X } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { useHideTabBar } from '@/context/useHideTabBar';
import { useChat } from '@/hooks/useChat';
import { useChatThreads } from '@/hooks/useChatThreads';
import { mockChatSuggestions } from '@/data/mockChat';

const DRAWER_WIDTH_FRACTION = 0.78;
// Approximation of styles.drawer's '78%' width in raw pixels, needed
// because reanimated's worklets (running on the UI thread) can't read a
// percentage string against the live layout the way RN style resolution
// does — see the drawer's onLayout below, which replaces this with the
// real measured width the first time it's known.
const FALLBACK_DRAWER_WIDTH = 320;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Chat() {
  useHideTabBar();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { messages, sending, send, startNewConversation, loadThread, loadingThread, activeThreadId } = useChat();
  const { data: threads } = useChatThreads();
  const [input, setInput] = useState('');
  const [drawerWidth, setDrawerWidth] = useState(FALLBACK_DRAWER_WIDTH);

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

  const onSelectThread = async (threadId: string) => {
    setHistoryOpen(false);
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
                  onPress={() => onSelectThread(thread.id)}
                >
                  <MessageCircle size={15} color={colors.foreground} />
                  <View style={styles.flex}>
                    <Text style={[styles.historyText, { color: colors.foreground }]}>{thread.title}</Text>
                    <Text style={[styles.historySubtext, { color: colors.inkMuted }]}>{thread.updatedAt}</Text>
                  </View>
                  <ChevronRight size={15} color={colors.inkMuted} />
                </Pressable>
              ))}
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
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

        <View style={[styles.composer, { borderColor: colors.line, backgroundColor: colors.surfaceSoft }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything..."
            placeholderTextColor={colors.inkMuted}
            style={[styles.composerInput, { color: colors.foreground }]}
            onSubmitEditing={() => onSend()}
            returnKeyType="send"
          />
          <Pressable onPress={() => onSend()} style={[styles.sendButton, { backgroundColor: colors.brandDeep }]} accessibilityLabel="Send message">
            <Send size={17} color={colors.onBrand} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, flexDirection: 'row' },
  backdropFill: { ...StyleSheet.absoluteFillObject },
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
  composer: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 20, marginBottom: 16, padding: 7, borderWidth: 1, borderRadius: radius.lg },
  composerInput: { flex: 1, paddingHorizontal: 7, fontSize: 12 },
  sendButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
