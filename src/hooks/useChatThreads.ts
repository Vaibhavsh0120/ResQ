import { fetchChatThreads } from '@/services/chatService';
import { useAsync } from './useAsync';

export function useChatThreads() {
  return useAsync(fetchChatThreads, []);
}
