import { ChatMessage, ChatThread, ChatThreadSummary } from '@/types';

/**
 * The greeting shown at the start of every new conversation. Personalized
 * with the real signed-in user's first name by useChat — this is just the
 * template (previously hardcoded to "Hi Alex").
 */
export function buildWelcomeMessage(firstName?: string): ChatMessage {
  const greetingName = firstName ? ` ${firstName}` : '';
  return {
    id: 'msg-welcome',
    role: 'assistant',
    text: `Hi${greetingName}. I'm here to help you feel more prepared. What would you like to know?`,
  };
}

export const mockChatSuggestions = ['What goes in a go-bag?', 'How do I make a plan?', 'Find a safe place'];

/**
 * Full message history for each previous thread, so tapping a row in the
 * history drawer can actually load that conversation instead of just
 * closing the drawer (see PROGRESS.md Phase 0). A real backend replaces
 * this with a `/v1/chat/threads/:id` fetch — useChat's loadThread already
 * treats this as async so that swap needs no UI change.
 */
export const mockChatThreads: ChatThread[] = [
  {
    id: 'thread-1',
    title: 'Building a go-bag',
    updatedAt: 'Earlier this week',
    messages: [
      { id: 'thread-1-msg-1', role: 'user', text: 'What should I keep in a go-bag?' },
      {
        id: 'thread-1-msg-2',
        role: 'assistant',
        text: 'A good first step is to keep it simple: water, a small first aid kit, a flashlight, spare power, and any essential medication. I can help you make a checklist.',
      },
      { id: 'thread-1-msg-3', role: 'user', text: 'How much water should I pack?' },
      {
        id: 'thread-1-msg-4',
        role: 'assistant',
        text: 'A common guideline is about 1 gallon (roughly 4 liters) per person per day, enough for at least 3 days — more if anyone in your household has specific medical needs.',
      },
    ],
  },
  {
    id: 'thread-2',
    title: 'Safe places nearby',
    updatedAt: 'Earlier this week',
    messages: [
      { id: 'thread-2-msg-1', role: 'user', text: 'Where can I find a safe place near me?' },
      {
        id: 'thread-2-msg-2',
        role: 'assistant',
        text: "Check the Safe Places tab for shelters and resource centers near your current area, including hours and whether they're currently open.",
      },
    ],
  },
  {
    id: 'thread-3',
    title: 'Family check-in plan',
    updatedAt: 'Earlier this week',
    messages: [
      { id: 'thread-3-msg-1', role: 'user', text: 'How do I set up a check-in plan with my family?' },
      {
        id: 'thread-3-msg-2',
        role: 'assistant',
        text: 'Start by adding everyone to your Family circle so you can see their status at a glance. Agree on a regular check-in time, and make sure at least one contact outside your immediate area knows the plan too.',
      },
    ],
  },
];

export function findMockThreadSummaries(): ChatThreadSummary[] {
  return mockChatThreads.map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
}

export function findMockThreadMessages(threadId: string): ChatMessage[] | undefined {
  return mockChatThreads.find((t) => t.id === threadId)?.messages;
}
