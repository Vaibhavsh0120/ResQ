import { useCallback, useRef, useState } from 'react';
import { streamChatReply } from '@/services/chatService';
import { mockWelcomeMessage } from '@/data/mockChat';
import { ChatMessage, ChatStreamEvent } from '@/types';

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${Date.now()}-${nextId++}`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([mockWelcomeMessage]);
  const [sending, setSending] = useState(false);
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
    setMessages([mockWelcomeMessage]);
  }, []);

  return { messages, sending, send, startNewConversation };
}
