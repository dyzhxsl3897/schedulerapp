import api from './axios';
import { ChatMessage } from '../types';

interface ChatResponsePayload {
  reply: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const payload = {
    message,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  };
  const response = await api.post<ChatResponsePayload>('/ai/chat', payload);
  return response.data.reply;
}
