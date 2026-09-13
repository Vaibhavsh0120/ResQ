import { useCallback, useRef, useState } from 'react';
import { streamChatReply, fetchChatThreadMessages, saveChatThread } from '@/services/chatService';
import { buildWelcomeMessage } from '@/data/mockChat';
import { useAuth } from '@/context/AuthContext';
import { ChatMessage, ChatStreamEvent } from '@/types';

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${nextId++}`;

export function useChat() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const [messages, setMessages] = useState<ChatMessage[]>([buildWelcomeMessage(firstName)]);
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Mirrors activeThreadId, readable synchronously from inside the
  // streaming callback below (state itself would be a stale closure at
  // that point — the callback is created once per `send` call and
  // activeThreadId may change between when it's created and when the
  // stream actually finishes).
  const activeThreadIdRef = useRef<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const userMessage: ChatMessage = { id: genId('user'), role: 'user', text: trimmed };
      const assistantId = genId('assistant');
      const placeholder: ChatMessage = { id: assistantId, role: 'assistant', text: '', pending: true };

      setMessages((prev) => [...prev, userMessage, placeholder]);
      setSending(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // Kept in sync with the messages state as events arrive, so the
      // save below (after the stream settles) has the true final
      // content without needing a second read of React state — setState
      // updaters run async and reading `messages` here would risk a
      // stale value from before this send() call's own updates applied.
      let finalMessages: ChatMessage[] = [];

      const handleEvent = (event: ChatStreamEvent) => {
        setMessages((prev) => {
          const next = prev.map((m) => {
            if (m.id !== assistantId) return m;
            if (event.type === 'token') return { ...m, text: m.text + event.text };
            if (event.type === 'sources') return { ...m, sources: event.sources };
            if (event.type === 'done') return { ...m, pending: false };
            if (event.type === 'error') return { ...m, pending: false, text: m.text || event.message };
            return m;
          });
          finalMessages = next;
          return next;
        });
      };

      try {
        await streamChatReply(trimmed, [...messages, userMessage], handleEvent, controller.signal);
        // A reply that was aborted (e.g. the user navigated away or
        // started a new conversation mid-stream) shouldn't be saved
        // half-finished — only persist once the exchange actually
        // completed. The welcome message alone (no real exchange yet)
        // never reaches this point since send() requires trimmed text.
        if (!controller.signal.aborted && finalMessages.length > 0) {
          const saved = await saveChatThread({
            id: activeThreadIdRef.current ?? undefined,
            source: 'chat',
            messages: finalMessages,
          });
          activeThreadIdRef.current = saved.id;
          setActiveThreadId(saved.id);
        }
      } finally {
        setSending(false);
      }
    },
    [messages, sending]
  );

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort();
    activeThreadIdRef.current = null;
    setActiveThreadId(null);
    setMessages([buildWelcomeMessage(firstName)]);
  }, [firstName]);

  const loadThread = useCallback(
    async (threadId: string) => {
      abortRef.current?.abort();
      setLoadingThread(true);
      setThreadError(null);
      try {
        const threadMessages = await fetchChatThreadMessages(threadId);
        setMessages(threadMessages);
        activeThreadIdRef.current = threadId;
        setActiveThreadId(threadId);
      } catch (err) {
        setThreadError(err instanceof Error ? err.message : 'Could not load that conversation.');
      } finally {
        setLoadingThread(false);
      }
    },
    []
  );

  return { messages, sending, send, startNewConversation, loadThread, loadingThread, threadError, activeThreadId };
}
