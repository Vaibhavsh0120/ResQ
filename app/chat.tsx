import React, { useState } from 'react';
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
import { ChevronRight, Menu, MessageCircle, Plus, Send, Sparkles, X } from '@/components/icons';
import { useAppTheme } from '@/theme/ThemeContext';
import { radius } from '@/theme/colors';
import { Header } from '@/components/Header';
import { IconButton } from '@/components/IconButton';
import { useHideTabBar } from '@/context/useHideTabBar';
import { useChat } from '@/hooks/useChat';
import { mockChatSuggestions, mockChatThreads } from '@/data/mockChat';

export default function Chat() {
  useHideTabBar();
  const { colors } = useAppTheme();
  const [historyOpen, setHistoryOpen] = useState(false);
  const { messages, sending, send, startNewConversation } = useChat();
  const [input, setInput] = useState('');

  const onSend = (value = input) => {
    if (!value.trim()) return;
    send(value);
    setInput('');
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Header
        title="Ask ResQ"
        onBack={() => router.back()}
        action={
          <IconButton label="Open previous chats" onPress={() => setHistoryOpen(true)} muted>
            <Menu size={18} color={colors.inkMuted} />
          </IconButton>
        }
      />

      <Modal visible={historyOpen} transparent animationType="fade" onRequestClose={() => setHistoryOpen(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => setHistoryOpen(false)}>
          <Pressable style={[styles.drawer, { backgroundColor: colors.surface, borderColor: colors.line }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: colors.foreground }]}>Previous chats</Text>
              <IconButton label="Close previous chats" onPress={() => setHistoryOpen(false)} muted>
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
            {mockChatThreads.map((thread) => (
              <Pressable key={thread.id} style={styles.historyRow} onPress={() => setHistoryOpen(false)}>
                <MessageCircle size={15} color={colors.foreground} />
                <View style={styles.flex}>
                  <Text style={[styles.historyText, { color: colors.foreground }]}>{thread.title}</Text>
                  <Text style={[styles.historySubtext, { color: colors.inkMuted }]}>{thread.updatedAt}</Text>
                </View>
                <ChevronRight size={15} color={colors.inkMuted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={[styles.chatIntro, { borderColor: colors.line }]}>
          <View style={[styles.chatOrb, { backgroundColor: colors.brandSoft }]}>
            <Sparkles size={20} color={colors.brand} />
          </View>
          <View>
            <Text style={[styles.chatIntroTitle, { color: colors.foreground }]}>ResQ guide</Text>
            <Text style={[styles.chatIntroSubtitle, { color: colors.inkMuted }]}>
              {sending ? 'Typing...' : 'Usually replies instantly'}
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === 'user' ? styles.messageRowUser : styles.messageRowBot]}>
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
  drawer: { width: '78%', height: '100%', padding: 16, borderRightWidth: 1, gap: 8 },
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
  messageBubble: { maxWidth: '83%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 15 },
  suggestionsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 10, flexWrap: 'wrap' },
  suggestionChip: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderRadius: radius.pill },
  suggestionText: { fontSize: 10 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 7, marginHorizontal: 20, marginBottom: 16, padding: 7, borderWidth: 1, borderRadius: radius.lg },
  composerInput: { flex: 1, paddingHorizontal: 7, fontSize: 12 },
  sendButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
