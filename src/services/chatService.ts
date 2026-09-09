import { config } from '@/config/env';
import { ApiError } from './apiClient';
import { findMockThreadMessages, findMockThreadSummaries } from '@/data/mockChat';
import { ChatMessage, ChatStreamEvent, ChatThreadSummary } from '@/types';

/**
 * Canned assistant reply used by the mock chat service. A real
 * implementation replaces this with a call to the RAG chat endpoint
 * (see streamChatReply below), most likely streamed token by token.
 */
const mockAssistantReply =
  'A good first step is to keep it simple: water, a small first aid kit, a flashlight, spare power, and any essential medication. I can help you make a checklist.';

/**
 * Sends a user message to the ResQ assistant and streams the response back
 * token by token via `onEvent`, matching how a RAG chat endpoint typically
 * behaves (retrieve -> generate -> stream tokens -> emit sources -> done).
 *
 * Mock mode fakes the stream by chunking a canned reply, so the chat UI's
 * incremental-render logic is exercised identically to how it will behave
 * against a real backend — swapping this function's body for an SSE/
 * WebSocket reader is the only change needed once the RAG endpoint exists.
 */
export async function streamChatReply(
  message: string,
  history: ChatMessage[],
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  if (config.useMockData) {
    return mockStreamReply(onEvent, signal);
  }

  const response = await fetch(`${config.apiBaseUrl}${config.endpoints.chat}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!response.ok || !response.body) {
    onEvent({ type: 'error', message: 'Unable to reach the assistant right now.' });
    return;
  }

  // Real backend is expected to stream newline-delimited JSON events
  // matching `ChatStreamEvent`. Adjust this reader if the backend instead
  // uses standard SSE ("data: ...\n\n" framing).
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          onEvent(JSON.parse(line) as ChatStreamEvent);
        } catch {
          // Skip malformed lines rather than failing the whole stream.
        }
      }
    }
  } catch (err) {
    if (!(err instanceof Error && err.name === 'AbortError')) {
      onEvent({ type: 'error', message: 'Connection to the assistant was interrupted.' });
    }
  }
}

async function mockStreamReply(onEvent: (event: ChatStreamEvent) => void, signal?: AbortSignal): Promise<void> {
  const words = mockAssistantReply.split(' ');
  for (const word of words) {
    if (signal?.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 35));
    onEvent({ type: 'token', text: `${word} ` });
  }
  onEvent({ type: 'done' });
}

export async function fetchChatThreads(): Promise<ChatThreadSummary[]> {
  if (config.useMockData) {
    return findMockThreadSummaries();
  }
  const response = await fetch(`${config.apiBaseUrl}/v1/chat/threads`);
  if (!response.ok) throw new ApiError('Could not load previous conversations.', response.status);
  return response.json();
}

/**
 * Loads a previous thread's full message history — the real backing for
 * tapping a row in chat.tsx's history drawer (previously a dead tap that
 * only closed the drawer; see PROGRESS.md Phase 0).
 */
export async function fetchChatThreadMessages(threadId: string): Promise<ChatMessage[]> {
  if (config.useMockData) {
    const messages = findMockThreadMessages(threadId);
    if (!messages) throw new ApiError('That conversation could not be found.', 404);
    return messages;
  }
  const response = await fetch(`${config.apiBaseUrl}/v1/chat/threads/${threadId}`);
  if (!response.ok) throw new ApiError('Could not load that conversation.', response.status);
  return response.json();
}
