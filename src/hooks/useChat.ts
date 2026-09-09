import { useCallback, useRef, useState } from 'react';
import { streamChatReply, fetchChatThreadMessages } from '@/services/chatService';
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

      const handleEvent = (event: ChatStreamEvent) => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            if (event.type === 'token') return { ...m, text: m.text + event.text };
            if (event.type === 'sources') return { ...m, sources: event.sources };
            if (event.type === 'done') return { ...m, pending: false };
            if (event.type === 'error') return { ...m, pending: false, text: m.text || event.message };
            return m;
          })
        );
      };

      try {
        await streamChatReply(trimmed, [...messages, userMessage], handleEvent, controller.signal);
      } finally {
        setSending(false);
      }
    },
    [messages, sending]
  );

  const startNewConversation = useCallback(() => {
    abortRef.current?.abort();
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
