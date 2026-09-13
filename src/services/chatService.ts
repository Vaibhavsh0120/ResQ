import * as secureStorage from './secureStorage';
import { config } from '@/config/env';
import { ApiError, mockDelay } from './apiClient';
import { mockChatThreads } from '@/data/mockChat';
import { ChatMessage, ChatStreamEvent, ChatThread, ChatThreadSummary } from '@/types';

// ── Conversation history: local-only persistence until a backend exists ──
// Previously fetchChatThreads/fetchChatThreadMessages only ever read the
// static mockChatThreads fixtures — nothing the user actually said in
// chat.tsx or voice.tsx was ever saved anywhere, so "Previous chats" was
// permanently frozen at 3 hardcoded example threads regardless of what
// conversations actually happened. Fixed 2026-09-12 with the same
// secureStorage-backed, seed-once-from-mock pattern familyService.ts
// already established — conversations can include personal or medical
// details a user discusses with ResQ, so they get the same at-rest
// encryption treatment as the family circle and profile, not plain
// AsyncStorage. Both chat.tsx (via useChat.ts) and voice.tsx (via
// useVoiceAssistant.ts) now call saveChatThread below when a conversation
// has real content, so both surfaces feed the same thread store — this is
// also what makes voice conversations show up in the history drawer
// alongside typed ones (ChatThreadSummary.source distinguishes the two
// for display, e.g. a mic icon vs a message icon).

const STORAGE_KEY = '@resq_chat_threads';

async function readLocal(): Promise<ChatThread[]> {
  const raw = await secureStorage.migrateLegacyPlaintext(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as ChatThread[];
    } catch {
      // Corrupted storage — fall through to reseeding.
    }
  }
  await secureStorage.setItem(STORAGE_KEY, JSON.stringify(mockChatThreads));
  return mockChatThreads;
}

async function writeLocal(threads: ChatThread[]): Promise<void> {
  await secureStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}

/**
 * Derives a short, human-readable title from a conversation's first user
 * message — the same idea as how most chat UIs (ChatGPT, Claude, etc.)
 * title a new thread, since there's no other natural title to use for a
 * conversation nobody named.
 */
function deriveTitle(firstUserText: string): string {
  const trimmed = firstUserText.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New conversation';
  return trimmed.length > 48 ? `${trimmed.slice(0, 48).trimEnd()}...` : trimmed;
}

/**
 * Saves (creating or updating) a conversation thread. Called once a
 * conversation actually has real content — see useChat.ts's `send` and
 * useVoiceAssistant.ts's `sendToAssistant`, both of which call this after
 * a real exchange completes, not on every keystroke or interim state.
 * Passing an existing thread's id updates it in place (so continuing a
 * loaded thread doesn't fork a duplicate); omitting id creates a new one.
 */
export async function saveChatThread(params: {
  id?: string;
  source: 'chat' | 'voice';
  messages: ChatMessage[];
}): Promise<ChatThread> {
  const { id, source, messages } = params;
  if (messages.length === 0) throw new Error('Cannot save an empty conversation.');

  const current = await readLocal();
  const firstUserMessage = messages.find((m) => m.role === 'user')?.text ?? '';
  const existing = id ? current.find((t) => t.id === id) : undefined;

  const thread: ChatThread = {
    id: existing?.id ?? id ?? `thread-${Date.now()}`,
    title: existing?.title ?? deriveTitle(firstUserMessage),
    updatedAt: new Date().toISOString(),
    source,
    messages,
  };

  const next = existing ? current.map((t) => (t.id === thread.id ? thread : t)) : [thread, ...current];
  await writeLocal(next);
  return thread;
}

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

/**
 * Canned source list emitted after the mock reply finishes streaming, so
 * chat.tsx's sources rendering (see AGENT.md) has something real
 * to exercise in mock mode too, not just on previously-saved threads. Shape
 * matches what a real RAG endpoint would emit as its own `sources` event.
 */
const mockAssistantSources = [{ id: 'ndma-general', title: 'General Preparedness Guidelines', publisher: 'NDMA' }];

async function mockStreamReply(onEvent: (event: ChatStreamEvent) => void, signal?: AbortSignal): Promise<void> {
  const words = mockAssistantReply.split(' ');
  for (const word of words) {
    if (signal?.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 35));
    onEvent({ type: 'token', text: `${word} ` });
  }
  if (signal?.aborted) return;
  onEvent({ type: 'sources', sources: mockAssistantSources });
  onEvent({ type: 'done' });
}

export async function fetchChatThreads(): Promise<ChatThreadSummary[]> {
  if (config.useMockData) {
    const threads = await readLocal();
    // Most-recently-updated first, matching how every other "recent
    // items" list in this app (updates, notifications) orders itself —
    // the drawer should surface what was just talked about, not an
    // arbitrary storage-insertion order.
    const sorted = [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return mockDelay(sorted.map(({ id, title, updatedAt, source }) => ({ id, title, updatedAt, source })));
  }
  const response = await fetch(`${config.apiBaseUrl}/v1/chat/threads`);
  if (!response.ok) throw new ApiError('Could not load previous conversations.', response.status);
  return response.json();
}

/**
 * Loads a previous thread's full message history — the real backing for
 * tapping a row in chat.tsx's history drawer (previously a dead tap that
 * only closed the drawer; see AGENT.md). Also used by
 * voice.tsx when resuming a previous voice conversation from the drawer.
 */
export async function fetchChatThreadMessages(threadId: string): Promise<ChatMessage[]> {
  if (config.useMockData) {
    const threads = await readLocal();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) throw new ApiError('That conversation could not be found.', 404);
    return mockDelay(thread.messages);
  }
  const response = await fetch(`${config.apiBaseUrl}/v1/chat/threads/${threadId}`);
  if (!response.ok) throw new ApiError('Could not load that conversation.', response.status);
  return response.json();
}

/**
 * Removes a saved conversation entirely — not currently wired to any UI
 * (no "delete conversation" affordance exists in chat.tsx's drawer yet),
 * but implemented alongside the rest of this real persistence layer so
 * it isn't a gap someone has to remember to add storage-side later. A
 * natural next small UI addition once someone wants a delete/swipe
 * action on a history row.
 */
export async function deleteChatThread(threadId: string): Promise<void> {
  if (config.useMockData) {
    const threads = await readLocal();
    await writeLocal(threads.filter((t) => t.id !== threadId));
    return;
  }
  const response = await fetch(`${config.apiBaseUrl}/v1/chat/threads/${threadId}`, { method: 'DELETE' });
  if (!response.ok) throw new ApiError('Could not delete that conversation.', response.status);
}
