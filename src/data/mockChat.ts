import { ChatMessage, ChatThreadSummary } from '@/types';

export const mockWelcomeMessage: ChatMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  text: "Hi Alex. I'm here to help you feel more prepared. What would you like to know?",
};

export const mockChatSuggestions = ['What goes in a go-bag?', 'How do I make a plan?', 'Find a safe place'];

export const mockChatThreads: ChatThreadSummary[] = [
  { id: 'thread-1', title: 'Building a go-bag', updatedAt: 'Earlier this week' },
  { id: 'thread-2', title: 'Safe places nearby', updatedAt: 'Earlier this week' },
  { id: 'thread-3', title: 'Family check-in plan', updatedAt: 'Earlier this week' },
];

/**
 * Canned assistant reply used by the mock chat service. A real
 * implementation replaces this with a call to the RAG chat endpoint
 * (see src/services/chatService.ts), most likely streamed token by token.
 */
export const mockAssistantReply =
  'A good first step is to keep it simple: water, a small first aid kit, a flashlight, spare power, and any essential medication. I can help you make a checklist.';
