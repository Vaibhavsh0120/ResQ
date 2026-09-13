/**
 * Unit tests for src/services/chatService.ts's persistence layer, added
 * 2026-09-12 alongside making chat/voice conversation history real
 * (previously fetchChatThreads/fetchChatThreadMessages only ever read
 * static mockChat.ts fixtures — nothing said in chat.tsx or voice.tsx was
 * ever actually saved). Uses the same real-crypto secureStorage mock as
 * secureStorage.test.ts (see that file's doc comment) so these tests
 * exercise the genuine encrypt/store/decrypt round trip, not a fake
 * pass-through that would hide a broken encryption path the way a
 * smoke-test-only mount check could.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-crypto', () => require('./__mocks__/expoCryptoMock').mockExpoCrypto());
jest.mock('expo-secure-store', () => require('./__mocks__/expoCryptoMock').mockExpoSecureStore());

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveChatThread, fetchChatThreads, fetchChatThreadMessages, deleteChatThread } from '../src/services/chatService';
import { mockChatThreads } from '../src/data/mockChat';
import { ChatMessage } from '../src/types';

const sampleMessages: ChatMessage[] = [
  { id: 'm1', role: 'user', text: 'What should I pack for an earthquake kit?' },
  { id: 'm2', role: 'assistant', text: 'Water, a flashlight, and a first aid kit are a good start.' },
];

describe('chatService persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('seeds from mockChatThreads on first read', async () => {
    const threads = await fetchChatThreads();
    expect(threads).toHaveLength(mockChatThreads.length);
    // Seeded threads carry their source through untouched.
    expect(threads.find((t) => t.id === 'thread-3')?.source).toBe('voice');
  });

  it('saves a new conversation and it appears in fetchChatThreads', async () => {
    const saved = await saveChatThread({ source: 'chat', messages: sampleMessages });
    expect(saved.id).toBeTruthy();
    expect(saved.title).toBe('What should I pack for an earthquake kit?');
    expect(saved.source).toBe('chat');

    const threads = await fetchChatThreads();
    // Original 3 seed threads + the 1 just saved.
    expect(threads).toHaveLength(mockChatThreads.length + 1);
    expect(threads.some((t) => t.id === saved.id)).toBe(true);
  });

  it('fetchChatThreadMessages returns exactly what was saved', async () => {
    const saved = await saveChatThread({ source: 'voice', messages: sampleMessages });
    const messages = await fetchChatThreadMessages(saved.id);
    expect(messages).toEqual(sampleMessages);
  });

  it('updates an existing thread in place instead of creating a duplicate when an id is passed', async () => {
    const first = await saveChatThread({ source: 'chat', messages: sampleMessages });
    const moreMessages: ChatMessage[] = [
      ...sampleMessages,
      { id: 'm3', role: 'user', text: 'What about pets?' },
      { id: 'm4', role: 'assistant', text: 'Include food, water, and any medication for them too.' },
    ];
    const updated = await saveChatThread({ id: first.id, source: 'chat', messages: moreMessages });

    expect(updated.id).toBe(first.id);
    // Title is derived once from the first user message and preserved on
    // update, not recomputed from a later message.
    expect(updated.title).toBe(first.title);

    const threads = await fetchChatThreads();
    const matching = threads.filter((t) => t.id === first.id);
    expect(matching).toHaveLength(1); // no duplicate thread created

    const messages = await fetchChatThreadMessages(first.id);
    expect(messages).toEqual(moreMessages);
  });

  it('rejects saving an empty conversation', async () => {
    await expect(saveChatThread({ source: 'chat', messages: [] })).rejects.toThrow();
  });

  it('throws a 404-style error for an unknown thread id', async () => {
    await expect(fetchChatThreadMessages('does-not-exist')).rejects.toThrow('could not be found');
  });

  it('deleteChatThread removes a thread so it no longer appears', async () => {
    const saved = await saveChatThread({ source: 'chat', messages: sampleMessages });
    await deleteChatThread(saved.id);
    const threads = await fetchChatThreads();
    expect(threads.some((t) => t.id === saved.id)).toBe(false);
  });

  it('truncates a long first message into a shorter title', async () => {
    const longText = 'a'.repeat(80);
    const saved = await saveChatThread({
      source: 'chat',
      messages: [{ id: 'm1', role: 'user', text: longText }],
    });
    expect(saved.title.length).toBeLessThan(longText.length);
    expect(saved.title.endsWith('...')).toBe(true);
  });
});
